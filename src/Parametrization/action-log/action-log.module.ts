import { Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { ActionLogController } from './action-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionLog, SchemaActionLog } from './entities/action-log.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: ActionLog.name, schema: SchemaActionLog}])],
  controllers: [ActionLogController],
  providers: [ActionLogService],
})
export class ActionLogModule {}
