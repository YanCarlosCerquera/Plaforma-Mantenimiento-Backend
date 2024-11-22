import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { jwtConstant } from '../../auth.jwtConstants';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector, private userService: UsersService){}
  
  async canActivate( context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if(!token) {
      throw new UnauthorizedException();
    }
    try{
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstant.secret
        }
      )

      const userId = payload.sub
      if(!userId){
        throw new UnauthorizedException('Token invalido: userId faltante');
      }

      const user = await this.userService.findOne(userId)
      if(!user){
        throw new UnauthorizedException('Usario no registrado.');
      }

      request.user = user
    }catch{
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
