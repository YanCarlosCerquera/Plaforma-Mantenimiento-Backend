import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { CreateActionLogDto } from './dto/create-action-log.dto';
import { UpdateActionLogDto } from './dto/update-action-log.dto';

@Controller('action-log')
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) {}

}
