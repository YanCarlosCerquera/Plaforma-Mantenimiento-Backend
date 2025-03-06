import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkReport } from './entities/work_report.entity';
import { CreateWorkReportDto } from './dto/create-work_report.dto';
import { UpdateWorkReportDto } from './dto/update-work_report.dto';
import { GenericService } from 'src/Generic/generic.service';
import * as pdf from 'pdf-parse';
import path from 'path';
import { match } from 'assert';

@Injectable()
export class WorkReportService extends GenericService<WorkReport, CreateWorkReportDto, UpdateWorkReportDto> {
  constructor(@InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>) {
    super(workReportModel);
  }

  async findAll(): Promise<WorkReport[]> {
    return await this.workReportModel.find().populate({
      path: 'orderId',
      select: 'radicado state',
    }).exec();
  }

  async findOne(id: string): Promise<WorkReport> {
    return await this.workReportModel.findById(id).populate({
      path: 'orderId',
      select: 'radicado state',
    }).exec();
  }

  async obtenerInformesConDetalles(): Promise<any[]> {
    const informes = await this.workReportModel
      .find()
      .populate({
        path: 'orderId',
        populate: [
          {
            path: 'solicitud',
            model: 'MaintenanceRequest',
            select: 'InventoryCode',
          },
          {
            path: 'tecnicoId',
            model: 'User',
            select: 'name',
          },
        ],
      })
      .select('Informe costs hours workDone orderId')
      .lean();
  
    return informes.map((informe) => ({
      Informe: informe.Informe,
      'CodigoInventario': informe.orderId?.solicitud
        ? (informe.orderId.solicitud as any).InventoryCode
        : null,
      Horas: informe.hours,
      Costos: informe.costs,
      'TrabajoRealizado': informe.workDone,
      'Ejecutado Por': informe.orderId?.tecnicoId?.name || null,
    }));
  }
  


  async maintenanceHistory(serialNumber: string){
    return await this.workReportModel.find().populate({
      path: 'orderId',
      select: 'radicado',
      match: { state: true},
      populate: {
        path: 'solicitud  ',
        select: 'maintenanceType',
        match: {serialNumber: serialNumber}
      }
    }).exec().then(results => {
      return results.filter(workReport => workReport.orderId?.solicitud);
  });
  }
}  