import { Express } from 'express';
import express from 'express';
import { stripeService } from '../../services/stripeService';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { users, events, rafflePool } from '../../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { config } from '../../config/env';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export function registerStripeWebhook(app: Express): void {
    // We need the raw body for signature verification
    app.post(
        '/api/webhooks/stripe',
        express.raw({ type: 'application/json' }),
        async (req, res) => {
            const signature = req.headers['stripe-signature'] as string;

            if (!webhookSecret) {
                logger.error('STRIPE_WEBHOOK_SECRET is not set. Webhook verification skipped (UNSAFE).');
                return res.status(500).json({ error: 'Webhook secret not configured' });
            }

            if (!signature) {
                return res.status(400).json({ error: 'No signature provided' });
            }

            let event: Stripe.Event;

            try {
                event = stripeService.constructEvent(req.body, signature, webhookSecret);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                logger.error(`Webhook signature verification failed: ${message}`);
                return res.status(400).send(`Webhook Error: ${message}`);
            }

            // Handle the event
            switch (event.type) {

                // ─── Checkout completed ─────────────────────────────────────────────
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.metadata?.userId;

                    if (userId) {
                        logger.info(`Fulfilling checkout session for user: ${userId}`);
                        try {
                            // Upgrade tier. subscriptionStartDate is set authoritatively by
                            // customer.subscription.created, but we record it here too as a
                            // belt-and-suspenders fallback in case that event arrives late.
                            await db.update(users)
                                .set({
                                    tier: 'premium',
                                    subscriptionStatus: 'active',
                                    subscriptionStartDate: new Date(),
                                })
                                .where(eq(users.id, userId));

                            // New subscribers are NOT added to the raffle pool immediately.
                            // They must complete at least 1 full month before qualifying.
                            // Promotional raffle fulfillment is disabled and no longer runs at event close.
                            logger.info(`[Raffle] New subscriber ${userId} — raffle eligibility starts after 1 full month`);
                            logger.info(`Successfully upgraded user ${userId} to premium`);
                        } catch (err) {
                            logger.error(`Failed to update user tier: ${err}`);
                        }
                    } else {
                        logger.warn('Checkout session completed but no userId found in metadata');
                    }
                    break;
                }

                // ─── New subscription created ───────────────────────────────────────
                // Canonical source of subscriptionStartDate for first-time subscribers.
                case 'customer.subscription.created': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const userId = subscription.metadata?.userId;

                    if (userId) {
                        // Stripe gives start_date as Unix timestamp (seconds)
                        const startDate = subscription.start_date
                            ? new Date(subscription.start_date * 1000)
                            : new Date();

                        await db.update(users)
                            .set({
                                subscriptionId: subscription.id,
                                subscriptionStartDate: startDate,
                            })
                            .where(eq(users.id, userId));

                        logger.info(`[Stripe] Subscription start date recorded for user ${userId}: ${startDate.toISOString()}`);
                    }
                    break;
                }

                // ─── Subscription updated (handles resubscriptions) ─────────────────
                // If a previously canceled subscription becomes active again, reset the
                // start date — the user must wait one full month before qualifying for
                // the raffle again.
                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;
                    const userId = subscription.metadata?.userId;

                    if (userId) {
                        const wasCancel = previousAttributes?.status === 'canceled';
                        const isNowActive = subscription.status === 'active';

                        if (wasCancel && isNowActive) {
                            // Resubscription — reset the clock
                            const resubDate = new Date();
                            await db.update(users)
                                .set({
                                    subscriptionId: subscription.id,
                                    subscriptionStatus: 'active',
                                    subscriptionStartDate: resubDate, // Reset — must wait 1 month again
                                    tier: 'premium',
                                })
                                .where(eq(users.id, userId));

                            logger.info(`[Stripe] Resubscription for user ${userId} — start date reset to ${resubDate.toISOString()}`);
                        } else {
                            // Routine status change (renewal, past_due, etc.)
                            await db.update(users)
                                .set({
                                    subscriptionStatus: subscription.status,
                                    currentPeriodEnd: subscription.current_period_end
                                        ? new Date(subscription.current_period_end * 1000)
                                        : undefined,
                                })
                                .where(eq(users.id, userId));

                            logger.info(`[Stripe] Subscription status updated for user ${userId}: ${subscription.status}`);
                        }
                    }
                    break;
                }

                // ─── Subscription deleted (canceled / expired) ──────────────────────
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const userId = subscription.metadata?.userId;

                    if (userId) {
                        await db.update(users)
                            .set({
                                subscriptionStatus: 'canceled',
                                tier: 'free',
                                // subscriptionStartDate is intentionally NOT cleared.
                                // It stays as a historical record and will be reset
                                // when they resubscribe via customer.subscription.updated.
                            })
                            .where(eq(users.id, userId));

                        logger.info(`[Stripe] Subscription canceled for user ${userId}`);
                    }
                    break;
                }

                case 'payment_intent.succeeded': {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    logger.info(`Payment intent succeeded: ${intent.id}`);
                    break;
                }

                default:
                    logger.info(`Unhandled event type: ${event.type}`);
            }

            res.status(200).json({ received: true });
        }
    );
}
