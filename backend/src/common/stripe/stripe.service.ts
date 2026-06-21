import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;
  private mockMode = true;

  constructor(private prisma: PrismaService) {
    const key = process.env.STRIPE_API_KEY;
    if (key && key.trim() !== '' && key.trim() !== 'your-stripe-api-key') {
      this.stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });
      this.mockMode = false;
      this.logger.log('Stripe Service initialized in Production Mode.');
    } else {
      this.logger.warn(
        'Stripe API Key not configured. Operating in MOCK MODE.',
      );
    }
  }

  isMockMode() {
    return this.mockMode;
  }

  /**
   * Generates a checkout session URL for a plan upgrade.
   */
  async createCheckoutSession(
    businessId: string,
    planId: string,
    returnUrl: string,
  ) {
    if (this.mockMode || !this.stripe) {
      this.logger.log(
        `Mock mode checkout session requested for business ${businessId}, plan ${planId}`,
      );
      // Return a local URL with parameters that the frontend can read to complete a simulated checkout
      return `${returnUrl}?mock_session_id=mock_sub_${planId}_${businessId}&plan_id=${planId}&business_id=${businessId}`;
    }

    // Resolve Price IDs based on Plan ID (Growth or Enterprise)
    let priceId = process.env.STRIPE_PRICE_GROWTH;
    if (planId === 'enterprise') {
      priceId = process.env.STRIPE_PRICE_ENTERPRISE;
    }

    if (!priceId) {
      throw new Error(`Stripe Price ID not configured for plan: ${planId}`);
    }

    // Fetch or create customer ID in DB
    const subscription = await this.prisma.subscription.findUnique({
      where: { businessId },
    });

    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
      });
      if (!business) {
        throw new Error('Business not found');
      }

      const customer = await this.stripe.customers.create({
        email: business.ownerId
          ? (
              await this.prisma.user.findUnique({
                where: { id: business.ownerId },
              })
            )?.email
          : undefined,
        name: business.companyName,
        metadata: { businessId },
      });
      stripeCustomerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Generates Stripe customer portal link.
   */
  async createBillingPortal(businessId: string, returnUrl: string) {
    if (this.mockMode || !this.stripe) {
      this.logger.log(
        `Mock billing portal requested for business ${businessId}`,
      );
      return returnUrl;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      throw new Error('No Stripe customer profile found for this business.');
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return portalSession.url;
  }

  /**
   * Provision a subscription in the local database.
   */
  async provisionSubscription(
    businessId: string,
    planId: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ) {
    const endPeriod = new Date();
    endPeriod.setDate(endPeriod.getDate() + 30); // 30 days plan duration

    const updated = await this.prisma.subscription.upsert({
      where: { businessId },
      create: {
        businessId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'ACTIVE',
        planId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: endPeriod,
      },
      update: {
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'ACTIVE',
        planId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: endPeriod,
      },
    });

    this.logger.log(
      `Provisioned subscription plan "${planId}" for business ${businessId}`,
    );
    return updated;
  }

  /**
   * Handles Stripe webhooks signatures.
   */
  constructWebhookEvent(
    rawBody: string,
    signature: string,
    secret: string,
  ): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe client not initialized');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  /**
   * Handle Webhook events.
   */
  async handleWebhookEvent(event: Stripe.Event) {
    const session = event.data.object as any;
    switch (event.type) {
      case 'checkout.session.completed': {
        const businessId = session.metadata?.businessId;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        // Find price/plan details from line items if active
        // Fallback to growth plan
        if (businessId) {
          await this.provisionSubscription(
            businessId,
            'growth',
            stripeCustomerId,
            stripeSubscriptionId,
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSubscriptionId = session.id;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: { status: 'CANCELED' },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const stripeSubscriptionId = session.id;
        const status = session.status === 'active' ? 'ACTIVE' : 'PAST_DUE';
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: { status },
        });
        break;
      }
    }
  }
}
