import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Config } from './entities/config.entity';

@Controller('config')
export class ConfigController extends GenericController<Config, CreateConfigDto, UpdateConfigDto>{
  constructor(private readonly configService: ConfigService) {
    super(configService)
  }
}
