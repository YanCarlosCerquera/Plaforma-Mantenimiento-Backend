  import { BadRequestException, Injectable } from '@nestjs/common';
  import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
  import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
  import { GenericService } from 'src/Generic/generic.service';
  import { Maintenance } from './entities/maintenance.entity';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { OrdenesTrabajo } from '../word_orden/entities/word_orden.entity';

  @Injectable()
  export class MaintenanceService extends GenericService<Maintenance, CreateMaintenanceDto, UpdateMaintenanceDto>{
    constructor(
      @InjectModel(Maintenance.name) private maintenanceModel: Model<Maintenance>,
      @InjectModel(OrdenesTrabajo.name) private ordenesTrabajoModel: Model<OrdenesTrabajo>
    ) {
      super(maintenanceModel);
    }

    async create(createMaintenanceDto: CreateMaintenanceDto): Promise<Maintenance> {
      await this.ValidationMatenimiento(createMaintenanceDto);
      const createdMaintenance = await super.create(createMaintenanceDto);
      return createdMaintenance;
    }


  async ValidationMatenimiento(dto : CreateMaintenanceDto | UpdateMaintenanceDto): Promise <void>{
    const existingMaintenance = await this.maintenanceModel.findOne({ wordOrdenId: dto.wordOrdenId });
    if(existingMaintenance){
      throw new BadRequestException('Esta orden de trabajo ya tiene un mantenimiento asignado');
    }

    const workOrder = await this.ordenesTrabajoModel.findById(dto.wordOrdenId);
      if (!workOrder) {
        throw new BadRequestException('La orden de trabajo no existe');
      }
    }
   
    async findAll(): Promise<Maintenance[]> {
      return this.maintenanceModel.find({  })
      .populate('wordOrdenId', 'radicado state')
      .populate('technicalId', 'name')
        .lean()
        .exec() as Promise<[]>;
    }
    
  }

