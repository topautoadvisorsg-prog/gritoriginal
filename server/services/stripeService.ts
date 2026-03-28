import Stripe from 'stripe';
import { logger } from '../utils/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
    logger.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

let stripe: Stripe | null = null;

if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia',
    });
}

export const stripeService = {
    async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
        if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId,
                },
            });

            return session;
        } catch (error) {
            logger.error('Error creating Stripe checkout session:', error);
            throw error;
        }
    },

    constructEvent(payload: string | Buffer, signature: string, webhookSecret: string) {
        if (!stripe) throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    },
};

export default stripe;
