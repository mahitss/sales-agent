import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { AuthGuard } from '../../auth/auth.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import * as express from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @UseGuards(AuthGuard, TenantGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @Body() body: { businessId: string; planId: string; returnUrl: string },
  ) {
    if (!body.businessId || !body.planId || !body.returnUrl) {
      throw new BadRequestException(
        'Missing required fields: businessId, planId, returnUrl',
      );
    }
    const url = await this.stripeService.createCheckoutSession(
      body.businessId,
      body.planId,
      body.returnUrl,
    );
    return { url };
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Post('billing-portal')
  async createBillingPortal(
    @Body() body: { businessId: string; returnUrl: string },
  ) {
    if (!body.businessId || !body.returnUrl) {
      throw new BadRequestException(
        'Missing required fields: businessId, returnUrl',
      );
    }
    const url = await this.stripeService.createBillingPortal(
      body.businessId,
      body.returnUrl,
    );
    return { url };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
    @Res() res: express.Response,
  ) {
    if (this.stripeService.isMockMode()) {
      return res
        .status(200)
        .send({ received: true, msg: 'Mock webhook bypassed' });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Webhook signing secret not configured.');
    }

    try {
      const rawBody = req.body.toString();
      const event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        secret,
      );
      await this.stripeService.handleWebhookEvent(event);
      return res.status(200).send({ received: true });
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Endpoint to complete mock checkout immediately for testing.
   */
  @UseGuards(AuthGuard, TenantGuard)
  @Post('mock-checkout-success')
  async mockCheckoutSuccess(
    @Body() body: { businessId: string; planId: string },
  ) {
    if (!body.businessId || !body.planId) {
      throw new BadRequestException(
        'Missing required fields: businessId, planId',
      );
    }

    const sub = await this.stripeService.provisionSubscription(
      body.businessId,
      body.planId,
      'mock_customer_id',
      `mock_sub_id_${Date.now()}`,
    );

    return { success: true, subscription: sub };
  }
}
