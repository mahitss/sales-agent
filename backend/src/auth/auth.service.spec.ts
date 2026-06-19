import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_EXPIRATION') return '15m';
      if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
      return 'mock-secret';
    }),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new admin user', async () => {
      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const hashedPassword = 'hashedPassword123';
      const mockCreatedUser = {
        id: 'user-uuid',
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockCreatedUser);
      jest.spyOn(jwt, 'signAsync').mockResolvedValue('mock-jwt-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(dto.email);
      expect(result.user.role).toBe('ADMIN');
    });

    it('should throw ConflictException if email already registered', async () => {
      const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const existingUser = { id: 'existing-id', email: dto.email } as any;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully authenticate user with correct credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 'user-uuid',
        email: dto.email,
        name: 'Test User',
        password: 'hashedPassword123',
        role: 'ADMIN',
      } as any;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwt, 'signAsync').mockResolvedValue('mock-jwt-token');

      const result = (await service.login(dto)) as any;

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const dto = { email: 'wrong@example.com', password: 'password123' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password matches fail', async () => {
      const dto = { email: 'test@example.com', password: 'wrongpassword' };
      const mockUser = {
        id: 'user-uuid',
        email: dto.email,
        password: 'hashedPassword123',
      } as any;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
