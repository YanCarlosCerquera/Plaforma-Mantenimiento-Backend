import { Controller, Get, Post, Body, Patch, Param, Delete, SetMetadata, Query } from '@nestjs/common';
import { Document } from 'mongoose';
import { GenericService } from './generic.service';
import { defaultRoles, Roles } from 'src/auth/auth/decorators/rol.decorator';

@Roles(...defaultRoles)
export class GenericController<T extends Document, I, U> {

  constructor(private readonly genericService: GenericService<T, I, U>) {}

  @Post()
  create(@Body() createDto: I, file?: Express.Multer.File): Promise<T> {
    return this.genericService.create(createDto);
  }

  @Get()
  findAll(@Query() filters: U) {
    return this.genericService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.genericService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: U) {
    return this.genericService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genericService.remove(id);
  }
  @Get('filter')
  async filter(@Query() filters: Partial<Record<keyof T, any>>): Promise<T[]> {
    if (!filters || Object.keys(filters).length === 0) {
      throw new Error('Debe proporcionar al menos un parámetro de filtro.');
    }
    return await this.genericService.filter(filters);
  }

}

