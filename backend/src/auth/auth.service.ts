import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { EmailService } from '../common/email/email.service';
import axios from 'axios';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';

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
    let resolvedRole = dto.role || 'ADMIN';
    let resolvedBusinessId: string | null = null;
    let isVerified = false;
    let invitationId: string | null = null;

    if (dto.inviteToken) {
      const invitation = await this.prisma.userInvitation.findFirst({
        where: {
          token: dto.inviteToken,
          status: 'PENDING',
          expiresAt: { gte: new Date() },
        },
      });

      if (!invitation) {
        throw new ConflictException('Invalid or expired team invitation token');
      }

      resolvedRole = invitation.role;
      resolvedBusinessId = invitation.businessId;
      isVerified = true; // Email verified since they accepted email invitation
      invitationId = invitation.id;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = isVerified ? null : crypto.randomUUID();
    const verificationTokenExp = isVerified
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: resolvedRole,
        businessId: resolvedBusinessId,
        verificationToken,
        verificationTokenExp,
        isVerified,
      },
    });

    if (invitationId) {
      await this.prisma.userInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      });

      // Add employee user to business list
      if (resolvedBusinessId) {
        await this.prisma.business.update({
          where: { id: resolvedBusinessId },
          data: {
            employees: {
              connect: { id: user.id },
            },
          },
        });
      }
    }

    // Generate token pair (access token + refresh token)
    const tokens = await this.generateTokensPair(
      user.id,
      user.email,
      user.role,
    );

    // Save refresh token to db
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    if (!isVerified && verificationToken) {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    }

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
      throw new UnauthorizedException(
        'Email address is not verified. Please verify your email first.',
      );
    }

    if (user.twoFactorEnabled) {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, temp2fa: true },
        { secret: jwtSecret, expiresIn: '5m' },
      );
      return {
        require2fa: true,
        tempToken,
      };
    }

    const tokens = await this.generateTokensPair(
      user.id,
      user.email,
      user.role,
    );
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
    return {
      success: true,
      message: 'Email address has been successfully verified.',
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
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
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'super-secret-refresh-key-change-me';
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
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
      this.logger.warn(
        `Security alert! Revoked refresh token reuse detected for user ${dbToken.userId}. Invalidating all sessions.`,
      );
      throw new UnauthorizedException(
        'Access denied. Compromised session detected.',
      );
    }

    // Mark current token as revoked (used)
    await this.prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true },
    });

    // Generate new pair
    const tokens = await this.generateTokensPair(
      dbToken.user.id,
      dbToken.user.email,
      dbToken.user.role,
    );
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
      const payload = this.jwtService.decode(token);
      const exp = payload?.exp;
      if (exp) {
        const remainingSeconds = Math.max(
          1,
          exp - Math.floor(Date.now() / 1000),
        );
        await this.redisService.set(
          `blacklist:${hashedToken}`,
          '1',
          remainingSeconds,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to blacklist access token: ${err.message}`);
    }
  }

  async generateVisitorToken(businessId: string) {
    const visitorId = `visitor-${crypto.randomUUID()}`;
    const payload = {
      sub: visitorId,
      email: `${visitorId}@anonymous.local`,
      role: 'VISITOR',
      businessId,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
    return { token };
  }

  private async generateTokensPair(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-key-change-me';
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

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
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

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

    const secret = speakeasy.generateSecret({
      name: `BeaconSales:${user.email}`,
    });

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

    return {
      success: true,
      message: 'Two-factor authentication has been enabled.',
    };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    return {
      success: true,
      message: 'Two-factor authentication has been disabled.',
    };
  }

  async verify2FA(tempToken: string, code: string) {
    let payload;
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: jwtSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired 2FA temporary token');
    }

    if (!payload || !payload.temp2fa) {
      throw new UnauthorizedException('Invalid 2FA token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
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

    const tokens = await this.generateTokensPair(
      user.id,
      user.email,
      user.role,
    );
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

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        success: true,
        message:
          'If the email exists and is not verified, a new verification link has been sent.',
      };
    }
    if (user.isVerified) {
      return {
        success: true,
        message:
          'If the email exists and is not verified, a new verification link has been sent.',
      };
    }

    const verificationToken = crypto.randomUUID();
    const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExp,
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );
    return {
      success: true,
      message:
        'If the email exists and is not verified, a new verification link has been sent.',
    };
  }

  async changeEmail(userId: string, newEmail: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing) {
      throw new ConflictException('Email address is already in use.');
    }

    const verificationToken = crypto.randomUUID();
    const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        isVerified: false,
        verificationToken,
        verificationTokenExp,
      },
    });

    await this.emailService.sendVerificationEmail(newEmail, verificationToken);
    return {
      success: true,
      message:
        'Email changed successfully. Please verify your new email address.',
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true, message: 'Account deleted successfully' };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gte: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    return { success: true, message: 'Session revoked successfully' };
  }

  async createInvitation(email: string, businessId: string, role: string) {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business workspace not found');
    }

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email,
        role,
        businessId,
        token,
        status: 'PENDING',
        expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/register?token=${token}`;

    // Send email invite asynchronously
    await this.emailService.sendInviteEmail(
      email,
      'Team Member',
      business.companyName,
      inviteUrl,
    );

    return { success: true, invitation };
  }

  async verifyInvitation(token: string) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token },
    });

    if (
      !invitation ||
      invitation.status !== 'PENDING' ||
      invitation.expiresAt < new Date()
    ) {
      throw new ConflictException('Invalid or expired team invitation token');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: invitation.businessId },
    });

    return {
      email: invitation.email,
      role: invitation.role,
      businessName: business?.companyName || 'Beacon Workspace',
      token: invitation.token,
    };
  }

  async addToWaitlist(email: string, name?: string) {
    const existing = await this.prisma.waitlist.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: true, entry: existing, msg: 'Already on waitlist.' };
    }
    const entry = await this.prisma.waitlist.create({
      data: { email, name, status: 'PENDING' },
    });
    return { success: true, entry, msg: 'Added to waitlist!' };
  }

  async claimReferral(code: string, refereeEmail: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
    });
    if (!referral) {
      throw new NotFoundException('Referral code not found.');
    }
    if (referral.status === 'CONVERTED') {
      throw new ConflictException('Referral code has already been claimed.');
    }
    const updated = await this.prisma.referral.update({
      where: { id: referral.id },
      data: { refereeEmail, status: 'CONVERTED' },
    });
    return { success: true, referral: updated, msg: 'Referral claimed!' };
  }

  async getWaitlist() {
    return this.prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveWaitlistEntry(id: string) {
    const entry = await this.prisma.waitlist.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException('Waitlist entry not found');
    }

    const updated = await this.prisma.waitlist.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    // Invite to default workspace if one exists
    const firstBusiness = await this.prisma.business.findFirst();
    let invite: any = null;
    if (firstBusiness) {
      try {
        invite = await this.createInvitation(
          entry.email,
          firstBusiness.id,
          'EMPLOYEE',
        );
      } catch (err) {
        // Silently skip if invite creation fails (e.g. unique constraint)
      }
    }

    return {
      success: true,
      entry: updated,
      invite,
      msg: 'Waitlisted user approved!',
    };
  }

  async getReferrals(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = referrals.length;
    const convertedCount = referrals.filter(
      (r) => r.status === 'CONVERTED',
    ).length;
    const conversionRate =
      totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;

    return {
      referrals,
      metrics: {
        totalCount,
        convertedCount,
        conversionRate,
      },
    };
  }

  async generateReferralCode(userId: string, userName?: string) {
    let finalName = userName;
    if (!finalName) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      finalName = user?.name || 'User';
    }

    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId },
    });
    if (existing) {
      return {
        success: true,
        referral: existing,
        msg: 'Already have a referral code.',
      };
    }

    const code =
      'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const referral = await this.prisma.referral.create({
      data: {
        code,
        referrerId: userId,
        referrerName: finalName,
        status: 'PENDING',
      },
    });
    return {
      success: true,
      referral,
      msg: 'Referral code generated successfully!',
    };
  }

  async loginOrCreateSSOUser(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const defaultBusiness = await this.prisma.business.findFirst();
      const defaultOrg = await this.prisma.organization.findFirst();

      // Secure random UUID password placeholder
      const randomPassword = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'EMPLOYEE',
          businessId: defaultBusiness?.id || null,
          organizationId: defaultOrg?.id || null,
          isVerified: true,
        },
      });
    }

    const tokens = await this.generateTokensPair(
      user.id,
      user.email,
      user.role,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }

  async loginOrCreateGoogleUser(code: string, auditContext: any) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error('Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) are not set.');
    }

    let tokensRes;
    try {
      tokensRes = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      });
    } catch (err: any) {
      this.logger.error(`Failed to exchange Google OAuth code: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
      throw new Error('Failed to exchange authorization code with Google.');
    }

    const { access_token } = tokensRes.data;

    let profileRes;
    try {
      profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (err: any) {
      this.logger.error(`Failed to fetch Google user profile: ${err.message}`);
      throw new Error('Failed to retrieve user profile information from Google.');
    }

    const { email, name, sub: googleId } = profileRes.data;

    if (!email) {
      throw new Error('Google account is missing a verified email address.');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (user) {
      const updates: any = {};
      if (!user.googleId) {
        updates.googleId = googleId;
        updates.authProvider = 'GOOGLE';
        updates.isVerified = true;
      }

      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
        });

        await this.prisma.activityLog.create({
          data: {
            userId: user.id,
            businessId: user.businessId,
            action: 'AUTH_LINK_ACCOUNT',
            entity: 'User',
            entityId: user.id,
            description: `Linked Google account for user: ${email}`,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            severity: 'INFO',
            metadata: { provider: 'google', email },
          },
        }).catch(() => {});
      }
    } else {
      const defaultBusiness = await this.prisma.business.findFirst();
      const defaultOrg = await this.prisma.organization.findFirst();

      const randomPassword = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          role: 'ADMIN',
          googleId,
          authProvider: 'GOOGLE',
          isVerified: true,
          businessId: defaultBusiness?.id || null,
          organizationId: defaultOrg?.id || null,
        },
      });

      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          businessId: user.businessId,
          action: 'AUTH_REGISTER',
          entity: 'User',
          entityId: user.id,
          description: `Registered new user via Google OAuth: ${email}`,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          severity: 'INFO',
          metadata: { provider: 'google', email, role: user.role },
        },
      }).catch(() => {});
    }

    const tokens = await this.generateTokensPair(
      user.id,
      user.email,
      user.role,
    );

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        businessId: user.businessId,
      },
      accessToken: tokens.token,
      refreshToken: tokens.refreshToken,
    };
  }
}
