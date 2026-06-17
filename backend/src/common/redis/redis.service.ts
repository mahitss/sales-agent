import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT') || 6379;

    if (!host) {
      this.logger.warn('REDIS_HOST not set. Falling back to in-memory cache.');
      return;
    }

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis connection failed permanently. Falling back to in-memory cache.');
            this.client = null;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis error: ' + err.message);
      });

      this.client.on('connect', () => {
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis client. Falling back to in-memory.', error);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        // ignore
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.error(`Failed to get key "${key}" from Redis: ${err.message}`);
      }
    }
    
    // In-memory fallback
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.error(`Failed to set key "${key}" in Redis: ${err.message}`);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        this.logger.error(`Failed to delete key "${key}" from Redis: ${err.message}`);
      }
    }
    this.memoryCache.delete(key);
  }
}
