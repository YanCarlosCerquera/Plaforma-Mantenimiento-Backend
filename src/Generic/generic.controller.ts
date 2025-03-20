import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { GenericService } from './generic.service';
import { defaultRoles, Roles } from 'src/auth/auth/decorators/rol.decorator';
import { PaginatedResult, PaginationDto } from './pagination.dto'; // asegúrate de la ruta

@Roles(...defaultRoles)
@Controller('generic')
export class GenericController<T extends Document, I, U> {
  constructor(private readonly genericService: GenericService<T, I, U>) {}

  @Post()
  create(@Body() createDto: I, file?: Express.Multer.File): Promise<T> {
    return this.genericService.create(createDto);
  }

  // Decoramos para que Swagger entienda los parámetros query
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página, por defecto 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de registros por página, por defecto 10' })
  async findAll(@Query() query: PaginationDto & Partial<U>): Promise<PaginatedResult<T> | T[]> {
    const { page, limit, ...filters } = query;
    // Si se proveen paginación, se usa el método paginado que devuelve meta
    if (page || limit) {
      return await this.genericService.findAllPaginated(
        filters as U,
        Number(page) || 1,
        Number(limit) || 10
      );
    }
    // Si no se indican parámetros de paginación, se devuelve el array completo
    return await this.genericService.findAll(query as U);
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

  @Post('bulk')
  createBulk(@Body() createDtos: I[]): Promise<T[]> {
    return this.genericService.createBulk(createDtos);
  }
}
