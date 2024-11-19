import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DepartamentsService } from './departaments.service';
import { CreateDepartamentDto } from './dto/create-departament.dto';
import { UpdateDepartamentDto } from './dto/update-departament.dto';

@Controller('departaments')
export class DepartamentsController {
  constructor(private readonly departamentsService: DepartamentsService) {}

  @Post()
  create(@Body() createDepartamentDto: CreateDepartamentDto) {
    return this.departamentsService.create(createDepartamentDto);
  }

  @Get()
  findAll() {
    return this.departamentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departamentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartamentDto: UpdateDepartamentDto) {
    return this.departamentsService.update(+id, updateDepartamentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departamentsService.remove(+id);
  }
}
