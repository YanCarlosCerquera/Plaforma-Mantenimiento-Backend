import { Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { ActionLogController } from './action-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionLog, SchemaActionLog } from './entities/action-log.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActionLogInterceptor } from './interceptor/action-log/action-log.interceptor';
import { ViewsModule } from 'src/security/views/views.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: ActionLog.name, schema: SchemaActionLog }]), ViewsModule],
  controllers: [ActionLogController],
  providers: [
    ActionLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActionLogInterceptor
    },
  ],
})
export class ActionLogModule { }
