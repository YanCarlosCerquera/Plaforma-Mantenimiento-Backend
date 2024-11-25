import { Controller, Get, Post, Body, Patch, Param, Delete, SetMetadata } from '@nestjs/common';
import { Document } from 'mongoose';
import { GenericService } from './generic.service';
import { defaultRoles, Roles } from 'src/auth/auth/decorators/rol.decorator';

@Roles(...defaultRoles)
export class GenericController<T extends Document, I, U> {

  constructor(private readonly genericService: GenericService<T, I, U>) {}

  @Post()
  create(@Body() createDto: I) {
    return this.genericService.create(createDto);
  }

  @Get()
  findAll() {
    return this.genericService.findAll();
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
}

