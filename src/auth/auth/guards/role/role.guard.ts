import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolService } from 'src/security/rol/rol.service';
import { ROLES_KEY } from '../../decorators/rol.decorator';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rolService: RolService,
  ) { }

  async canActivate(context: ExecutionContext,): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    ) || this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getClass(),
    );

    if (isPublic) {
      return true;
    }
    try {
      const requiredRoles = this.reflector.get<string[]>(
        ROLES_KEY,
        context.getHandler(),
      ) || this.reflector.get<string[]>(
        ROLES_KEY,
        context.getClass(),
      );

      if (!requiredRoles || requiredRoles.length == 0) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !user.assignedRol) {
        throw new UnauthorizedException();
      }

      const userRole = await this.rolService.findOne(user.assignedRol);

      if (!userRole) {
        throw new UnauthorizedException();
      }

      return requiredRoles.includes(userRole.name);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
