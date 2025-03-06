import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
import { WordOrdenService } from './word_orden.service';
import { CreateWordOrdenDto } from './dto/create-word_orden.dto';
import { UpdateWordOrdenDto } from './dto/update-word_orden.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { OrdenesTrabajo } from './entities/word_orden.entity';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import { TecnicoOrdenesResponse } from './TecnicoOrdenesResponse';
@Public()
@Controller('word-orden')
export class WordOrdenController extends GenericController <OrdenesTrabajo , CreateWordOrdenDto , UpdateWordOrdenDto>{
  constructor(private readonly wordOrdenService: WordOrdenService) {
    super(wordOrdenService);
  }
  
    @Get('statics')
    async getStatics() {
      return this.wordOrdenService.getWorkOrdenstatics();
    }
  
    @Get() // Decorador para manejar solicitudes GET
    findAllWithDetails(
      @Query('instructorId') instructorId?: string,
      @Query('tecnicoId') tecnicoId?: string,
    ) {
      return this.wordOrdenService.findAllWithDetails(instructorId, tecnicoId);
    }

  @Get(":id")
  
    ListOne(@Param('id') id: string): Promise<OrdenesTrabajo[]> {
    return this.wordOrdenService.findOn(id);
  }
  @Post('update-expired-orders')
  async updateExpiredOrders(): Promise<string> {
    await this.wordOrdenService.updateExpiredOrders(); 
    return 'Órdenes vencidas actualizadas correctamente';
  }

  @Get('tecnico/:userId')
  async findAllByTecnico(@Param('userId') userId: string): Promise<TecnicoOrdenesResponse> {
    try {
      return await this.wordOrdenService.findAllTecnico(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Error al buscar órdenes de trabajo');
    }
  }

}
