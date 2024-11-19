import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenericService } from './generic.service';
import { Document } from 'mongoose';

export class GenericController<T extends Document, I> {
  constructor(private readonly genericService: GenericService<T, I>) {}

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
  update(@Param('id') id: string, @Body() updateDto: I) {
    return this.genericService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genericService.remove(id);
  }
}
