import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import { getAuthCookieName, getJwtSecret } from '../../common/env';
import { AuthenticatedUser } from '../../common/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = getJwtSecret();

    const cookieExtractor = (req: { headers?: { cookie?: string } }) => {
      const cookieHeader = req?.headers?.cookie;
      if (!cookieHeader) {
        return null;
      }

      const cookieName = getAuthCookieName();
      const cookies = cookieHeader.split(';').map((part) => part.trim());
      const authCookie = cookies.find((part) => part.startsWith(`${cookieName}=`));

      if (!authCookie) {
        return null;
      }

      return decodeURIComponent(authCookie.slice(cookieName.length + 1));
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    // This payload is the decoded JWT
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      roles: payload.roles,
    };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
