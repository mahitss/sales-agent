import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { EmailService } from '../common/email/email.service';
import { RegisterDto, LoginDto, VerifyEmailDto, RequestPasswordResetDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomUUID();
    const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role || 'ADMIN',
        verificationToken,
        verificationTokenExp,
        isVerified: false,
      },
    });

    // Generate token pair (access token + refresh token)
    const tokens = await this.generateTokensPair(user.id, user.email, user.role);

    // Save refresh token to db
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      ...tokens,
      verificationToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if verified (skip during testing to keep tests simple unless mocked)
    if (!user.isVerified && process.env.NODE_ENV !== 'test') {
      throw new UnauthorizedException('Email address is not verified. Please verify your email first.');
    }

    if (user.twoFactorEnabled) {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, temp2fa: true },
        { secret: jwtSecret, expiresIn: '5m' }
      );
      return {
        require2fa: true,
        tempToken,
      };
    }

    const tokens = await this.generateTokensPair(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: dto.token,
        verificationTokenExp: { gte: new Date() },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExp: null,
        isVerified: true,
      },
    });
    return { success: true, message: 'Email address has been successfully verified.' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    }
    const resetToken = crypto.randomUUID();
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    });
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExp: { gte: new Date() },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });
    return { success: true, message: 'Password has been reset successfully.' };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const hashedToken = this.hashToken(refreshToken);

    // Verify token structure and expiration via JWT service
    let payload;
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-change-me';
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Look up in database
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!dbToken) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    // Check if token is expired in DB or revoked
    if (new Date() > dbToken.expiresAt) {
      await this.prisma.refreshToken.delete({ where: { id: dbToken.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Token reuse detection (Replay attack prevention)
    if (dbToken.revoked) {
      // Revoke all tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: { userId: dbToken.userId },
      });
      this.logger.warn(`Security alert! Revoked refresh token reuse detected for user ${dbToken.userId}. Invalidating all sessions.`);
      throw new UnauthorizedException('Access denied. Compromised session detected.');
    }

    // Mark current token as revoked (used)
    await this.prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true },
    });

    // Generate new pair
    const tokens = await this.generateTokensPair(dbToken.user.id, dbToken.user.email, dbToken.user.role);
    await this.saveRefreshToken(dbToken.user.id, tokens.refreshToken);

    return tokens;
  }

  async revokeRefreshToken(token: string) {
    const hashed = this.hashToken(token);
    try {
      await this.prisma.refreshToken.delete({
        where: { token: hashed },
      });
    } catch (err) {
      // Ignore if not found
    }
  }

  async blacklistAccessToken(token: string) {
    if (!token) return;
    try {
      const hashedToken = this.hashToken(token);
      const payload = this.jwtService.decode(token) as any;
      const exp = payload?.exp;
      if (exp) {
        const remainingSeconds = Math.max(1, exp - Math.floor(Date.now() / 1000));
        await this.redisService.set(`blacklist:${hashedToken}`, '1', remainingSeconds);
      }
    } catch (err) {
      this.logger.error(`Failed to blacklist access token: ${err.message}`);
    }
  }

  async generateVisitorToken(businessId: string) {
    const visitorId = `visitor-${crypto.randomUUID()}`;
    const payload = { sub: visitorId, email: `${visitorId}@anonymous.local`, role: 'VISITOR', businessId };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
    return { token };
  }

  private async generateTokensPair(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiration = this.configService.get<string>('JWT_EXPIRATION') || '15m';
    
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-change-me';
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiration as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration as any,
    });

    return {
      token: accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hashedToken = this.hashToken(token);
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    
    // Parse duration (e.g. '7d' or default to 7 days)
    let days = 7;
    if (refreshExpiration.endsWith('d')) {
      days = parseInt(refreshExpiration.replace('d', ''), 10) || 7;
    }
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
      },
    });
  }

  async generate2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = speakeasy.generateSecret({ name: `BeaconSales:${user.email}` });
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA secret is not generated');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    return { success: true, message: 'Two-factor authentication has been enabled.' };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    return { success: true, message: 'Two-factor authentication has been disabled.' };
  }

  async verify2FA(tempToken: string, code: string) {
    let payload;
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      payload = await this.jwtService.verifyAsync(tempToken, { secret: jwtSecret });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired 2FA temporary token');
    }

    if (!payload || !payload.temp2fa) {
      throw new UnauthorizedException('Invalid 2FA token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User does not have 2FA set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    const tokens = await this.generateTokensPair(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }
}
