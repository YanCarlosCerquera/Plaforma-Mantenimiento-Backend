import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenericService } from './generic.service';
import { Document } from 'mongoose';
import { Roles } from 'src/auth/auth/decorators/rol.decorator';

export class GenericController<T extends Document, I, U,> {
  private readonly listRoles: string

  constructor(private readonly genericService: GenericService<T, I, U>,
    roles?: string
  ) {
    this.listRoles = roles
  }
  
  @Post()
  create(@Body() createDto: I) {
    return this.genericService.create(createDto);
  }

  @Get()
  @Roles()
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
