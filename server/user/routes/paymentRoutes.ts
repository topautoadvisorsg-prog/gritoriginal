import { Router } from 'express';
import { isAuthenticated } from '../../auth/guards';
import { stripeService } from '../../services/stripeService';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { createCheckoutSessionSchema } from '../../schemas';

const router = Router();

/**
 * Initiate a Stripe Checkout Session
 * Request Body: { priceId: string, successUrl: string, cancelUrl: string }
 */
router.post('/api/payments/create-checkout-session', isAuthenticated, validate(createCheckoutSessionSchema), async (req, res) => {
    try {
        const user = req.user as { id: string };
        const userId = user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { priceId, successUrl, cancelUrl } = req.body;

        const session = await stripeService.createCheckoutSession(
            userId,
            priceId,
            successUrl,
            cancelUrl
        );

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create checkout session';
        logger.error('Error in create-checkout-session route:', error);
        res.status(500).json({ error: message });
    }
});

export default router;
