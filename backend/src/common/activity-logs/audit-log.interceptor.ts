import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService, extractAuditContext } from './activity-log.service';

/**
 * Maps HTTP method + URL pattern to a semantic action code + entity name.
 * Order matters — first match wins.
 */
const ROUTE_ACTION_MAP: Array<{
  method: string;
  pattern: RegExp;
  action: string;
  entity: string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  entityIdParam?: number; // index in URL segments (0-based)
}> = [
  // Auth
  { method: 'POST',   pattern: /\/auth\/login$/i,          action: 'AUTH_LOGIN',           entity: 'User',         severity: 'INFO' },
  { method: 'POST',   pattern: /\/auth\/logout$/i,         action: 'AUTH_LOGOUT',          entity: 'User',         severity: 'INFO' },
  { method: 'POST',   pattern: /\/auth\/register$/i,       action: 'AUTH_REGISTER',        entity: 'User',         severity: 'INFO' },
  { method: 'POST',   pattern: /\/auth\/2fa\/enable$/i,    action: 'AUTH_2FA_ENABLED',     entity: 'User',         severity: 'WARN' },
  { method: 'POST',   pattern: /\/auth\/2fa\/disable$/i,   action: 'AUTH_2FA_DISABLED',    entity: 'User',         severity: 'WARN' },
  { method: 'POST',   pattern: /\/auth\/reset-password$/i, action: 'PASSWORD_RESET',       entity: 'User',         severity: 'WARN' },

  // Leads
  { method: 'POST',   pattern: /\/leads$/i,                action: 'LEAD_CREATED',         entity: 'Lead',         severity: 'INFO' },
  { method: 'PATCH',  pattern: /\/leads\/[^/]+$/i,         action: 'LEAD_UPDATED',         entity: 'Lead',         severity: 'INFO', entityIdParam: -1 },
  { method: 'PUT',    pattern: /\/leads\/[^/]+$/i,         action: 'LEAD_UPDATED',         entity: 'Lead',         severity: 'INFO', entityIdParam: -1 },
  { method: 'DELETE', pattern: /\/leads\/[^/]+$/i,         action: 'LEAD_DELETED',         entity: 'Lead',         severity: 'WARN', entityIdParam: -1 },
  { method: 'POST',   pattern: /\/leads\/[^/]+\/status$/i, action: 'PIPELINE_CHANGED',     entity: 'Lead',         severity: 'INFO', entityIdParam: -2 },

  // Workflows
  { method: 'POST',   pattern: /\/workflows$/i,            action: 'WORKFLOW_CREATED',     entity: 'Workflow',     severity: 'INFO' },
  { method: 'PATCH',  pattern: /\/workflows\/[^/]+$/i,     action: 'WORKFLOW_UPDATED',     entity: 'Workflow',     severity: 'INFO', entityIdParam: -1 },
  { method: 'DELETE', pattern: /\/workflows\/[^/]+$/i,     action: 'WORKFLOW_DELETED',     entity: 'Workflow',     severity: 'WARN', entityIdParam: -1 },

  // Email
  { method: 'POST',   pattern: /\/integrations\/email\/send$/i, action: 'EMAIL_SENT',      entity: 'EmailActivity',severity: 'INFO' },
  { method: 'DELETE', pattern: /\/integrations\/email\/accounts\/[^/]+$/i, action: 'EMAIL_ACCOUNT_REMOVED', entity: 'EmailAccount', severity: 'WARN', entityIdParam: -1 },

  // Billing / Stripe
  { method: 'POST',   pattern: /\/billing\/checkout$/i,    action: 'BILLING_CHECKOUT',     entity: 'Billing',      severity: 'CRITICAL' },
  { method: 'POST',   pattern: /\/billing\/portal$/i,      action: 'BILLING_PORTAL',       entity: 'Billing',      severity: 'INFO' },

  // API Keys
  { method: 'POST',   pattern: /\/api-keys$/i,             action: 'API_KEY_CREATED',      entity: 'ApiKey',       severity: 'WARN' },
  { method: 'DELETE', pattern: /\/api-keys\/[^/]+$/i,      action: 'API_KEY_REVOKED',      entity: 'ApiKey',       severity: 'CRITICAL', entityIdParam: -1 },

  // Team / Roles
  { method: 'POST',   pattern: /\/employees$/i,            action: 'EMPLOYEE_INVITED',     entity: 'User',         severity: 'WARN' },
  { method: 'PATCH',  pattern: /\/employees\/[^/]+\/role$/i, action: 'ROLE_CHANGED',       entity: 'User',         severity: 'CRITICAL', entityIdParam: -2 },

  // AI Research
  { method: 'POST',   pattern: /\/account-research$/i,     action: 'AI_RESEARCH_STARTED',  entity: 'AccountResearch', severity: 'INFO' },

  // Knowledge Base
  { method: 'POST',   pattern: /\/knowledge-bases$/i,      action: 'KB_UPLOADED',          entity: 'KnowledgeBase',severity: 'INFO' },
];

/** URL path segments to skip entirely — noise with no audit value */
const SKIP_PATTERNS = [
  /\/health/i,
  /\/metrics/i,
  /\/auth\/refresh/i,
  /\/track\//i,
  /\/activities/i,
  /\/audit-logs/i,
  /\/stats/i,
  /\/favicon/i,
];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method?.toUpperCase() || '';
    const url: string = req.url || req.path || '';

    // Only audit mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip noisy / internal routes
    if (SKIP_PATTERNS.some((p) => p.test(url))) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Only log on successful responses (2xx) - errors have their own handling
          this.logMutation(req, method, url, startTime).catch(() => {});
        },
      }),
    );
  }

  private async logMutation(req: any, method: string, url: string, _startTime: number) {
    // Find the first matching route rule
    const rule = ROUTE_ACTION_MAP.find(
      (r) => r.method === method && r.pattern.test(url),
    );

    if (!rule) return; // No rule configured — skip silently

    const ctx = extractAuditContext(req);
    const segments = url.split('/').filter(Boolean);

    // Extract entityId from URL path if rule specifies a segment index
    let entityId: string | null = null;
    if (rule.entityIdParam !== undefined) {
      const idx = rule.entityIdParam < 0 
        ? segments.length + rule.entityIdParam 
        : rule.entityIdParam;
      entityId = segments[idx] || null;
      // Ignore query-string contamination
      if (entityId?.includes('?')) entityId = entityId.split('?')[0];
    }

    // Also try to grab entityId from response body if it was the creation response
    if (!entityId && req._auditEntityId) {
      entityId = req._auditEntityId;
    }

    const description = this.buildDescription(rule.action, rule.entity, entityId, req);

    await this.auditService.log({
      ...ctx,
      action: rule.action,
      entity: rule.entity,
      entityId,
      description,
      severity: rule.severity || 'INFO',
      metadata: this.buildMetadata(req, rule.action),
    });
  }

  private buildDescription(action: string, entity: string, entityId: string | null, req: any): string {
    const who = req?.user?.email || req?.body?.email || 'Unknown user';
    const entityRef = entityId ? `${entity} [${entityId.substring(0, 8)}...]` : entity;

    const descMap: Record<string, string> = {
      AUTH_LOGIN:           `User signed in (${who})`,
      AUTH_LOGOUT:          `User signed out (${who})`,
      AUTH_REGISTER:        `New account registered (${who})`,
      AUTH_2FA_ENABLED:     `Two-factor authentication enabled (${who})`,
      AUTH_2FA_DISABLED:    `Two-factor authentication disabled (${who})`,
      PASSWORD_RESET:       `Password reset performed (${who})`,
      LEAD_CREATED:         `New lead captured (${who})`,
      LEAD_UPDATED:         `${entityRef} updated by ${who}`,
      LEAD_DELETED:         `${entityRef} permanently deleted by ${who}`,
      PIPELINE_CHANGED:     `${entityRef} pipeline stage changed by ${who}`,
      WORKFLOW_CREATED:     `Workflow created by ${who}`,
      WORKFLOW_UPDATED:     `${entityRef} updated by ${who}`,
      WORKFLOW_DELETED:     `${entityRef} deleted by ${who}`,
      EMAIL_SENT:           `Email sent by ${who}`,
      EMAIL_ACCOUNT_REMOVED:`Email account disconnected by ${who}`,
      BILLING_CHECKOUT:     `Billing checkout initiated by ${who}`,
      BILLING_PORTAL:       `Billing portal accessed by ${who}`,
      API_KEY_CREATED:      `New API key created by ${who}`,
      API_KEY_REVOKED:      `API key revoked by ${who}`,
      EMPLOYEE_INVITED:     `Team member invited by ${who}`,
      ROLE_CHANGED:         `User role changed by ${who}`,
      AI_RESEARCH_STARTED:  `AI account research initiated by ${who}`,
      KB_UPLOADED:          `Knowledge base document uploaded by ${who}`,
    };

    return descMap[action] || `${action.replace(/_/g, ' ')} performed by ${who}`;
  }

  private buildMetadata(req: any, action: string): Record<string, any> {
    const meta: Record<string, any> = {};

    // Selectively pull safe fields from the body — never log passwords or tokens
    const body = req.body || {};
    const SENSITIVE = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken', 'hashedKey'];

    if (action === 'LEAD_UPDATED' && body.status) {
      meta.newStatus = body.status;
    }
    if (action === 'AUTH_LOGIN' || action === 'AUTH_REGISTER') {
      meta.email = body.email;
    }
    if (action === 'EMAIL_SENT') {
      meta.to = body.to;
      meta.subject = body.subject;
    }
    if (action === 'ROLE_CHANGED') {
      meta.newRole = body.role;
    }
    if (action === 'AI_RESEARCH_STARTED') {
      meta.domain = body.domain;
    }

    // Strip all sensitive keys just to be safe
    for (const key of SENSITIVE) delete meta[key];

    return meta;
  }
}
