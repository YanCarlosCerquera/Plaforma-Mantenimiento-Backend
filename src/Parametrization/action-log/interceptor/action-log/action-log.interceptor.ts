import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { ActionLogService } from '../../action-log.service';
import { CreateActionLogDto } from '../../dto/create-action-log.dto';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/auth/decorators/public.decorator';
import { ViewsService } from 'src/security/views/views.service';
import { LOG_KEY } from 'src/auth/auth/decorators/log.decorator';

@Injectable()
export class ActionLogInterceptor implements NestInterceptor {
  constructor(
    private readonly actionLogService: ActionLogService,
    private readonly viewService: ViewsService,
    private readonly reflector: Reflector,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request: Request = httpContext.getRequest();
    const logConfig =
      this.reflector.get<{ action: string; prefix: string }>(
        LOG_KEY,
        context.getHandler(),
      ) || this.reflector.get<{ action: string; prefix: string }>(
        LOG_KEY,
        context.getClass(),
      );;

    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler())

    if (isPublic || !logConfig) {
      return next.handle();
    }

    const { user, method } = request;
    const views = await this.viewService.findByRoute(logConfig?.prefix || '');
    const commonModuloId = views.every(
      (view) => view.moduloId.equals(views[0].moduloId)
    )
      ? views[0].moduloId._id
      : null;

    const actionLogDto: CreateActionLogDto = {
      userId: user ? String(user._id) : null,
      dateTime: new Date(),
      action: this.getActionFromMethod(method, logConfig?.action),
      moduloId: commonModuloId ? String(commonModuloId) : '',
      state: true,
    };

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.actionLogService.create(actionLogDto);
        } catch (error) {
          console.error('Error al registrar el historial de acciones:', error);
        }
      }),
    );
  }

  private getActionFromMethod(method: string, action: string): string {
    switch (method) {
      case 'POST':
        return `Agregó ${action}`;
      case 'PUT':
        return `Actualizó ${action}`;
      case 'PATCH':
        return `Actualizó ${action}`;
      case 'DELETE':
        return `Eliminó ${action}`;
      case 'GET':
        return `Consultó ${action}`;
      default:
        return 'unknown';
    }
  }
}
