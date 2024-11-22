import { Injectable } from '@nestjs/common';
import { CreateActionLogDto } from './dto/create-action-log.dto';
import { UpdateActionLogDto } from './dto/update-action-log.dto';
import { GenericService } from 'src/Generic/generic.service';
import { ActionLog } from './entities/action-log.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ActionLogService extends GenericService<ActionLog, CreateActionLogDto, UpdateActionLogDto>{
  constructor(@InjectModel(ActionLog.name)private actionLogModel: Model<ActionLog>){
    super(actionLogModel)
  }
}
