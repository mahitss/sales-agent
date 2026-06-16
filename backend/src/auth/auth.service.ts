import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, VerifyEmailDto, RequestPasswordResetDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role || 'ADMIN',
      },
    });

    // Generate token
    const token = await this.generateToken(user.id, user.email, user.role);

    // Mock Verification link logging
    console.log(`User registered: ${user.email}. Verification Token: mock-verify-token-${user.id}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      verificationToken: `mock-verify-token-${user.id}`,
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

    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // Format: mock-verify-token-{userId}
    const match = dto.token.match(/^mock-verify-token-(.+)$/);
    if (!match) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    const userId = match[1];
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    return { success: true, message: 'Email address has been successfully verified.' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    }
    const resetToken = `reset-token-${user.id}`;
    console.log(`Password reset requested for ${dto.email}. Reset Token: ${resetToken}`);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const match = dto.token.match(/^reset-token-(.+)$/);
    if (!match) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const userId = match[1];
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { success: true, message: 'Password has been reset successfully.' };
  }

  private async generateToken(userId: string, email: string, role: string): Promise<string> {
    const payload = { sub: userId, email, role };
    return this.jwtService.signAsync(payload);
  }
}
