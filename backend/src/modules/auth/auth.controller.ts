import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';
import { AuthRateLimit } from './auth-rate-limit.decorator';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { VerifyLoginMfaDto } from './dto/verify-login-mfa.dto';
import { SetupLoginMfaDto, VerifyLoginMfaSetupDto } from './dto/setup-login-mfa.dto';
import { CookieOptions, Response } from 'express';
import {
  getAuthCookieDomain,
  getAuthCookieMaxAgeMs,
  getAuthCookieName,
  getAuthCookieSameSite,
  getAuthCookieSecure,
} from '../../common/env';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private getCookieName() {
    return getAuthCookieName();
  }

  private getCookieDomain() {
    return getAuthCookieDomain();
  }

  private getCookieMaxAge() {
    return getAuthCookieMaxAgeMs();
  }

  private getCookieSameSite(): CookieOptions['sameSite'] {
    return getAuthCookieSameSite();
  }

  private getCookieSecure(sameSite: CookieOptions['sameSite']) {
    return getAuthCookieSecure() || sameSite === 'none';
  }

  private getCookieOptions(): CookieOptions {
    const sameSite = this.getCookieSameSite();
    const domain = this.getCookieDomain();
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.getCookieSecure(sameSite),
      sameSite,
      path: '/',
      maxAge: this.getCookieMaxAge(),
    };

    if (domain) {
      options.domain = domain;
    }

    return options;
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie(this.getCookieName(), token, this.getCookieOptions());
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ key: 'auth:login', limit: 5, windowMs: 60_000, bodyFields: ['email'] })
  async login(@Body() loginDto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password, {
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
    });

    if ('access_token' in result) {
      this.setAuthCookie(res, result.access_token);
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  async setupMfa(@Req() req: any) {
    return this.authService.generateMfaSecret(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ key: 'auth:mfa-verify', limit: 8, windowMs: 5 * 60_000 })
  async verifyMfa(@Req() req: any, @Body() body: VerifyMfaDto) {
    return this.authService.verifyMfaCode(req.user.userId, body.code);
  }

  @Post('mfa/setup-login')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({ key: 'auth:mfa-setup-login', limit: 5, windowMs: 60_000, bodyFields: ['token'] })
  async setupLoginMfa(@Body() body: SetupLoginMfaDto, @Req() req: any) {
    return this.authService.generateLoginMfaSetup(body.token, {
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('mfa/setup-login-verify')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'auth:mfa-setup-login-verify',
    limit: 8,
    windowMs: 5 * 60_000,
    bodyFields: ['token'],
  })
  async verifyLoginMfaSetup(
    @Body() body: VerifyLoginMfaSetupDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyLoginMfaSetup(body.token, body.code, {
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
    });
    this.setAuthCookie(res, result.access_token);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('mfa/login-verify')
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit({
    key: 'auth:mfa-login-verify',
    limit: 8,
    windowMs: 5 * 60_000,
    bodyFields: ['token'],
  })
  async verifyLoginMfa(
    @Body() body: VerifyLoginMfaDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyLoginMfaCode(body.token, body.code, {
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
    });
    this.setAuthCookie(res, result.access_token);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge: _maxAge, ...clearCookieOptions } = this.getCookieOptions();
    res.clearCookie(this.getCookieName(), clearCookieOptions);

    return { success: true };
  }
}
