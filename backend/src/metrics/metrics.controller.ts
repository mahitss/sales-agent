import { Controller, Get, Res } from '@nestjs/common';
import * as client from 'prom-client';
import * as express from 'express';

// Exporting custom metrics
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
});

export const aiRequestDuration = new client.Histogram({
  name: 'ai_request_duration_seconds',
  help: 'AI Service request duration in seconds',
  labelNames: ['endpoint'],
  buckets: [0.5, 1, 2, 5, 10, 15, 20, 30],
});

export const dbQueryCounter = new client.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries executed',
});

// Collect standard node/process metrics
client.collectDefaultMetrics({ register: client.register });

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: express.Response) {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  }
}
