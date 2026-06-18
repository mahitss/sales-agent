# Beacon AI Sales Agent

Production-ready AI-powered sales agent for websites with lead qualification, knowledge base, and multi-channel support.

## Quick Start (Development)

```bash
# Install all dependencies
npm run install:all

# Terminal 1: Start PostgreSQL & Redis (Docker)
docker-compose up -d postgres redis

# Terminal 2: Start backend
npm run dev:backend

# Terminal 3: Start AI service
npm run dev:ai

# Terminal 4: Start frontend
npm run dev:frontend
```

## Production Deployment (Docker)

```bash
# Set production environment variables
cp .env.example .env
# Edit .env with real credentials

# Deploy full stack
docker-compose up -d
```

## Production Checklist

### Critical Configuration
- [ ] `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/)
- [ ] `SMTP_HOST/PORT/USER/PASS` - For email verification & password reset (use SendGrid/Mailgun)
- [ ] `JWT_SECRET` - Generate secure random string (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- [ ] `DATABASE_URL` - PostgreSQL in production (default is SQLite dev)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking (optional)
- [ ] `LAUNCHDARKLY_SDK_KEY` - Feature flags (optional)
- [ ] `WEBHOOK_SECRET` - Secure random string for channel integrations

### Email Service Setup
For production, configure SMTP credentials:
- SendGrid: `SMTP_HOST=smtp.sendgrid.net`, port 587
- Gmail: `SMTP_HOST=smtp.gmail.com`, port 587
- AWS SES: `SMTP_HOST=email-smtp.us-east-1.amazonaws.com`

### SSL/TLS
- Use reverse proxy (nginx/Caddy) with Let's Encrypt
- Or set `FRONTEND_URL` and allowed CORS origins to HTTPS

### Scaling
The stack is pre-configured for horizontal scaling:
- 2 backend instances in docker-compose
- Redis for shared cache/session storage
- PM2 clustering config in `backend/pm2.config.js`

Scale with:
```bash
docker-compose up -d --scale backend-node-1=3 --scale backend-node-2=3
```

## Architecture

```
frontend (Next.js) → backend (NestJS) → ai-service (FastAPI)
                            ↓
                    PostgreSQL + Redis
```

## API Endpoints

### Auth
- `POST /auth/register` - Create account (sends verification email)
- `POST /auth/login` - Sign in
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Revoke refresh token
- `POST /auth/verify-email` - Email verification
- `POST /auth/request-password-reset` - Send reset link
- `POST /auth/reset-password` - Set new password
- `POST /auth/visitor-token` - Anonymous visitor token

### Chat
- `POST /chat` - Send message (JSON response)
- `POST /chat/stream` - Streaming SSE response
- `POST /chat/operator-reply` - Human reply during takeover
- `POST /chat/simulate-incoming` - Test multi-channel messages

### Business
- `GET /business/:id` - Get business profile
- `POST /business` - Create profile (onboarding)
- `POST /business/:id/faq` - Add FAQ
- `POST /business/:id/scrape` - Auto-learn from website
- `POST /business/:id/competitor-analysis` - Analyze competitor

### Leads & Conversations
- `GET /leads/business/:id` - List leads
- `GET /leads/stats/:id` - Lead statistics
- `GET /conversations/business/:id` - List conversations
- `PUT /conversations/:id/takeover` - Toggle human takeover

## Monitoring

- `/health` - Database, Redis, AI service status
- `/metrics` - Prometheus metrics endpoint

## Security Features

- JWT access + refresh token rotation
- Refresh token reuse detection (revokes all sessions)
- Rate limiting per endpoint (5-200 req/min based on operation)
- CSRF protection for state-changing operations
- Webhook signature verification (HMAC-SHA256)
- XSS sanitization with sanitize-html
- Password hashing with bcrypt (10 rounds)