import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ViewsService } from './views.service';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { View } from './entities/view.entity';

@Controller('views')
export class ViewsController extends GenericController<View, CreateViewDto, UpdateViewDto>{
  constructor(private readonly viewsService: ViewsService) {
    super(viewsService)
  }

}
