import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import axios from 'axios';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  @Get()
  async checkHealth() {
    const healthStatus: any = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      details: {},
    };

    let isHealthy = true;

    // 1. Database Health Check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.details.database = { status: 'UP' };
    } catch (err: any) {
      isHealthy = false;
      healthStatus.details.database = { status: 'DOWN', error: err.message };
    }

    // 2. Redis Health Check
    try {
      await this.redisService.set('health-check', 'OK', 5);
      const val = await this.redisService.get('health-check');
      if (val === 'OK') {
        healthStatus.details.redis = { status: 'UP' };
      } else {
        isHealthy = false;
        healthStatus.details.redis = { status: 'DOWN', error: 'Redis write/read mismatch' };
      }
    } catch (err: any) {
      isHealthy = false;
      healthStatus.details.redis = { status: 'DOWN', error: err.message };
    }

    // 3. AI Service Health Check
    try {
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (aiServiceUrl && !aiServiceUrl.startsWith('http://') && !aiServiceUrl.startsWith('https://')) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }
      const response = await axios.get(aiServiceUrl, { timeout: 2000 });
      healthStatus.details.aiService = { status: 'UP', statusCode: response.status };
    } catch (err: any) {
      // Reporting AI state but not crashing core backend
      healthStatus.details.aiService = { status: 'DOWN', error: err.message };
    }

    if (!isHealthy) {
      healthStatus.status = 'DOWN';
      throw new HttpException(healthStatus, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthStatus;
  }
}
