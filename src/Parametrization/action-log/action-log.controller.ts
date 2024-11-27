import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { CreateActionLogDto } from './dto/create-action-log.dto';
import { UpdateActionLogDto } from './dto/update-action-log.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { ActionLog } from './entities/action-log.entity';

@Controller('action-log')
export class ActionLogController extends GenericController<ActionLog, CreateActionLogDto, UpdateActionLogDto>{
  constructor(private readonly actionLogService: ActionLogService) {
    super(actionLogService)
  }

}
