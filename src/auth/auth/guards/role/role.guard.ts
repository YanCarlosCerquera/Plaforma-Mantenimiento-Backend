import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RolService } from 'src/Segurity/rol/rol.service';
import { ROLES_KEY } from '../../decorators/rol.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rolService: RolService,
  ) { }

  async canActivate(context: ExecutionContext,): Promise<boolean> {
    try {
      const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

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
    }catch{
      throw new UnauthorizedException();
    }
  }
}
