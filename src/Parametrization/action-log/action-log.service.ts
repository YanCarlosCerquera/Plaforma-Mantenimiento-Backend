import { Injectable } from '@nestjs/common';
import { CreateActionLogDto } from './dto/create-action-log.dto';
import { UpdateActionLogDto } from './dto/update-action-log.dto';
import { GenericService } from 'src/Generic/generic.service';
import { ActionLog } from './entities/action-log.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedResult } from 'src/Generic/pagination.dto';

@Injectable()
export class ActionLogService extends GenericService<ActionLog, CreateActionLogDto, UpdateActionLogDto> {
  constructor(@InjectModel(ActionLog.name) private actionLogModel: Model<ActionLog>) {
    super(actionLogModel)
  }

  async findAllPaginated(
    filters: any, // Define el tipo correcto para los filtros
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<ActionLog>> {
    // Llama al método findAllPaginated del servicio genérico
    const result = await super.findAllPaginated(filters, page, limit);

    // Aplica los populates específicos para ActionLog
    result.data = await this.actionLogModel.populate(result.data, [
      {
        path: 'userId',
        select: 'name',
        populate: {
          path: 'assignedRol',
          select: 'name',
        },
      },
      {
        path: 'moduloId',
        select: 'name',
      },
    ]);

    return result;
  }

  async findAll(): Promise<ActionLog[]> {
    return await this.actionLogModel
      .find()
      .populate({
        path: 'userId',
        select: 'name',
        populate: {
          path: 'assignedRol',
          select: 'name',
        },
      })
      .populate({
        path: 'moduloId',
        select: 'name',
      })
      .exec();
  }

  async findOne(id: string): Promise<ActionLog | null> {
    return await this.actionLogModel.findById(id)
      .populate({
        path: 'userId',
        select: 'name',
        populate: {
          path: 'assignedRol',
          select: 'name',
        },
      })
      .populate({
        path: 'moduloId',
        select: 'name',
      })
      .exec();
  }
  
}
