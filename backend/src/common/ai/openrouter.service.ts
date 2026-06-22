import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import OpenAI from 'openai';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private openai: OpenAI | null = null;
  private defaultModel = 'deepseek/deepseek-chat-v3-0324:free';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not defined. OpenRouter research calls will fail.');
    } else {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
      this.logger.log('OpenRouter client initialized successfully.');
    }
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    if (model.includes(':free') || model.endsWith('/free')) {
      return 0.0;
    }
    
    // Known paid models fallback rates
    if (model.includes('gpt-4o')) {
      return (promptTokens * 5.0 + completionTokens * 15.0) / 1_000_000;
    }
    if (model.includes('claude-3-5-sonnet')) {
      return (promptTokens * 3.0 + completionTokens * 15.0) / 1_000_000;
    }
    
    // Default fallback rate (deepseek v3 rates: $0.14/M input, $0.28/M output)
    return (promptTokens * 0.14 + completionTokens * 0.28) / 1_000_000;
  }

  async generateStructuredCompletion<T>(
    businessId: string,
    action: string,
    systemPrompt: string,
    userPrompt: string,
    cacheKey?: string,
  ): Promise<T> {
    const model = this.configService.get<string>('OPENROUTER_MODEL') || this.defaultModel;

    // 1. Check cache first to avoid duplicate requests
    if (cacheKey) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          this.logger.log(`Cache hit for AI action "${action}" with key: ${cacheKey}`);
          return JSON.parse(cached) as T;
        }
      } catch (err: any) {
        this.logger.error(`Failed to read from cache: ${err.message}`);
      }
    }

    if (!this.openai) {
      throw new Error('OpenRouter client is not initialized due to missing API key.');
    }

    let attempts = 0;
    const maxAttempts = 3;
    const baseDelay = 1000; // 1s base

    while (attempts < maxAttempts) {
      attempts++;
      try {
        this.logger.log(
          `Requesting OpenRouter completion (Model: ${model}, Attempt: ${attempts}/${maxAttempts})`,
        );

        const completion = await this.openai.chat.completions.create(
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          },
          { timeout: 30000 },
        );

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('OpenRouter returned an empty response.');
        }

        const parsedResult = JSON.parse(responseText) as T;
        const promptTokens = completion.usage?.prompt_tokens || 0;
        const completionTokens = completion.usage?.completion_tokens || 0;
        const cost = this.calculateCost(model, promptTokens, completionTokens);

        // Record successful cost/usage log
        await this.prisma.aICostLog.create({
          data: {
            businessId,
            model,
            promptTokens,
            completionTokens,
            cost,
            action,
            status: 'SUCCESS',
          },
        });

        // Write to cache if key provided (TTL 24 hours)
        if (cacheKey) {
          try {
            await this.redisService.set(cacheKey, JSON.stringify(parsedResult), 86400);
            this.logger.log(`Cached AI action "${action}" successfully with key: ${cacheKey}`);
          } catch (err: any) {
            this.logger.error(`Failed to write to cache: ${err.message}`);
          }
        }

        return parsedResult;
      } catch (err: any) {
        this.logger.warn(
          `OpenRouter API call failed on attempt ${attempts}/${maxAttempts}: ${err.message}`,
        );

        if (attempts >= maxAttempts) {
          // Record failed cost/usage log
          await this.prisma.aICostLog.create({
            data: {
              businessId,
              model,
              promptTokens: 0,
              completionTokens: 0,
              cost: 0.0,
              action,
              status: 'FAILED',
              errorMessage: err.message || 'Unknown error',
            },
          }).catch((dbErr) => {
            this.logger.error(`Failed to log error to DB: ${dbErr.message}`);
          });

          throw err;
        }

        const delay = baseDelay * Math.pow(2, attempts - 1) + Math.random() * 500;
        this.logger.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('OpenRouter structured generation failed.');
  }
}
