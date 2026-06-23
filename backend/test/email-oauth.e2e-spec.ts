import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/common/email/email.service';
import { EmailSendingWorker } from '../src/jobs/workers/email-sending.worker';
import { Job } from 'bullmq';
import axios from 'axios';
import { EmailProviderFactory } from '../src/common/email/providers/provider.factory';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSend = jest.fn().mockResolvedValue({
  messageId: 'mock-smtp-sent-id-123',
  provider: 'SMTP',
  status: 'DELIVERED' as const,
});

jest.mock('../src/common/email/providers/provider.factory', () => {
  return {
    EmailProviderFactory: {
      create: jest.fn().mockImplementation(() => ({
        send: mockSend,
      })),
    },
  };
});

describe('Google OAuth & Email Infrastructure (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let emailService: EmailService;
  let emailSendingWorker: EmailSendingWorker;

  beforeAll(async () => {
    jest.setTimeout(30000);
    // Mock Environment Variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:4000/api/v1/auth/google/callback';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.EMAIL_PROVIDER = 'SMTP';
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.SMTP_FROM = 'no-reply@beacon.com';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    emailService = moduleFixture.get<EmailService>(EmailService);
    emailSendingWorker = moduleFixture.get<EmailSendingWorker>(EmailSendingWorker);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Google OAuth endpoints', () => {
    it('GET /api/v1/auth/google redirects to Google Consent screen', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/google')
        .expect(302);

      expect(res.headers.location).toContain('accounts.google.com');
      expect(res.headers.location).toContain('client_id=test-client-id');
      expect(res.headers.location).toContain('redirect_uri=');
    });

    it('GET /api/v1/auth/google/callback processes code, registers new user, and redirects to frontend dashboard', async () => {
      // Mock Google Token exchange
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-google-access-token',
        },
      });

      // Mock Google User profile info request
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          email: 'google-oauth-test@example.com',
          name: 'OAuth Test User',
          sub: 'google-user-sub-12345',
        },
      });

      // Clean up user if exists
      await prisma.user.deleteMany({
        where: { email: 'google-oauth-test@example.com' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/google/callback?code=test-auth-code')
        .expect(302);

      const decodedLocation = decodeURIComponent(res.headers.location);
      expect(decodedLocation).toContain('http://localhost:3000/dashboard');
      expect(decodedLocation).toContain('token=');
      expect(decodedLocation).toContain('google-oauth-test@example.com');

      // Verify user created in DB
      const dbUser = await prisma.user.findUnique({
        where: { email: 'google-oauth-test@example.com' },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.googleId).toBe('google-user-sub-12345');
      expect(dbUser?.authProvider).toBe('GOOGLE');
      expect(dbUser?.isVerified).toBe(true);

      // Verify activity audit log was written
      const auditLog = await prisma.activityLog.findFirst({
        where: { userId: dbUser?.id, action: 'AUTH_REGISTER' },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.description).toContain('google-oauth-test@example.com');
    }, 30000);
  });

  describe('Email Infrastructure and Tracking', () => {
    let activityId = '';

    it('Enqueuing email via EmailService creates PENDING EmailActivity and registers BullMQ job data', async () => {
      // Clear activities
      await prisma.emailActivity.deleteMany({
        where: { toAddress: 'google-oauth-test@example.com' },
      });

      // Call service method
      await emailService.sendVerificationEmail('google-oauth-test@example.com', 'test-verification-token');

      // Check DB activity created
      const activity = await prisma.emailActivity.findFirst({
        where: { toAddress: 'google-oauth-test@example.com' },
      });
      expect(activity).toBeDefined();
      expect(['PENDING', 'SENT']).toContain(activity?.status);
      expect(activity?.subject).toBe('Verify your Beacon AI Sales Agent account');
      expect(activity?.body).toContain('test-verification-token');
      activityId = activity!.id;
    }, 30000);

    it('EmailSendingWorker rewrites URLs, injects pixel, sends mail, and updates DB status to SENT', async () => {
      mockSend.mockClear();

      // Mock BullMQ Job structure
      const mockJob = {
        id: 'mock-job-id',
        name: 'send-generic-email',
        data: {
          to: 'google-oauth-test@example.com',
          subject: 'Verify your Beacon AI Sales Agent account',
          html: '<p>Please click <a href="http://destination.com/verify">here</a> to verify.</p>',
          from: 'no-reply@beacon.com',
          emailActivityId: activityId,
          emailType: 'VERIFICATION',
        },
      } as unknown as Job;

      await emailSendingWorker.process(mockJob);

      // Verify provider called
      expect(mockSend).toHaveBeenCalled();
      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toBe('google-oauth-test@example.com');
      // Verify link rewritten
      expect(sendArgs.html).toContain('/email-tracking/click/');
      expect(sendArgs.html).toContain('url=http%3A%2F%2Fdestination.com%2Fverify');
      // Verify tracking pixel injected
      expect(sendArgs.html).toContain('/email-tracking/open/');

      // Verify DB activity status updated
      const activity = await prisma.emailActivity.findUnique({
        where: { id: activityId },
      });
      expect(activity?.status).toBe('SENT');
      expect(activity?.messageId).toBe('mock-smtp-sent-id-123');

      // Verify tracking event written
      const trackingEvent = await prisma.emailTrackingEvent.findFirst({
        where: { emailActivityId: activityId, eventType: 'DELIVERED' },
      });
      expect(trackingEvent).toBeDefined();
    }, 30000);

    it('GET /api/v1/email-tracking/open/:activityId increments open counter and writes tracking log', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/email-tracking/open/${activityId}`)
        .expect(200)
        .expect('Content-Type', 'image/gif');

      // Verify open log created
      const openLog = await prisma.emailOpenTracking.findFirst({
        where: { emailActivityId: activityId },
      });
      expect(openLog).toBeDefined();

      // Verify event log created
      const openEvent = await prisma.emailTrackingEvent.findFirst({
        where: { emailActivityId: activityId, eventType: 'OPENED' },
      });
      expect(openEvent).toBeDefined();

      // Verify open count incremented
      const activity = await prisma.emailActivity.findUnique({
        where: { id: activityId },
      });
      expect(activity?.opensCount).toBe(1);
    }, 30000);

    it('GET /api/v1/email-tracking/click/:activityId?url=... redirects recipient and writes click tracking event', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/email-tracking/click/${activityId}?url=${encodeURIComponent('http://destination.com/verify')}`)
        .expect(302);

      expect(res.headers.location).toBe('http://destination.com/verify');

      // Verify click log created
      const clickLog = await prisma.emailClickTracking.findFirst({
        where: { emailActivityId: activityId, url: 'http://destination.com/verify' },
      });
      expect(clickLog).toBeDefined();

      // Verify event log created
      const clickEvent = await prisma.emailTrackingEvent.findFirst({
        where: { emailActivityId: activityId, eventType: 'CLICKED' },
      });
      expect(clickEvent).toBeDefined();
    }, 30000);

    it('POST /api/v1/email-tracking/webhook/resend processes bounced state and updates status to FAILED in DB', async () => {
      const mockResendWebhookBody = {
        type: 'email.bounced',
        data: {
          email_id: 'mock-smtp-sent-id-123',
        },
      };

      await request(app.getHttpServer())
        .post('/api/v1/email-tracking/webhook/resend')
        .send(mockResendWebhookBody)
        .expect(200);

      // Verify DB activity status set to FAILED
      const activity = await prisma.emailActivity.findUnique({
        where: { id: activityId },
      });
      expect(activity?.status).toBe('FAILED');

      // Verify bounce event logged
      const bounceEvent = await prisma.emailTrackingEvent.findFirst({
        where: { emailActivityId: activityId, eventType: 'BOUNCED' },
      });
      expect(bounceEvent).toBeDefined();
    }, 30000);
  });
});
