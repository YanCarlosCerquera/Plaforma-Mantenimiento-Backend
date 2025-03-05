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
import { MaintenanceRequest } from '../application-maintenance/entities/application-maintenance.entity';

@Injectable()
export class WorkReportService extends GenericService<WorkReport, CreateWorkReportDto, UpdateWorkReportDto> {
  constructor(@InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>, @InjectModel(MaintenanceRequest.name) private readonly maintenanceModel: Model<MaintenanceRequest>) {
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

  async createFromPDF(pdfBuffer: Buffer, orderId: Types.ObjectId): Promise<WorkReport> {
    try {
      const data = await pdf(pdfBuffer);
      console.log('Texto extraído del PDF:', data.text); // Agrega este log
      const workReportData = this.extractDataFromPDF(data.text, orderId);
      return this.create(workReportData);
    } catch (error) {
      throw new BadRequestException(`Failed to process PDF: ${error.message}`);
    }
  }
  
  private extractDataFromPDF(text: string, orderId: Types.ObjectId): CreateWorkReportDto {
    const costs = this.extractNumber(text, /Costs:\s*\$?(\d+(\.\d+)?)/);
    const hours = this.extractNumber(text, /Hours:\s*(\d+(\.\d+)?)/);
    const responses = this.extractField(text, /Responses:\s*(.+)/);
    const observation = this.extractField(text, /Observation:\s*(.+)/);
    const workDone = this.extractField(text, /Work Done:\s*(.+)/);
    const status = this.extractField(text, /Status:\s*(.+)/).toLowerCase() === 'completed';
    

    return {
      costs,
      hours,
      responses,
      observation,
      workDone,
      orderId,
      status,
    };
  }

  private extractField(text: string, regex: RegExp): string {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
  
  private extractNumber(text: string, regex: RegExp): number {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }
  
  private extractBoolean(text: string, regex: RegExp): boolean {
    const match = text.match(regex);
    return match ? match[1].toLowerCase() === 'true' : false;
  }

  async maintenanceHistory(serialNumber: string) {
    const workReports = await this.workReportModel
        .find()
        .populate({
            path: 'orderId',
            select: 'radicado solicitud',
            match: { state: true },
            populate: {
                path: 'solicitud',
                select: 'serialNumber maintenanceType',
                model: 'MaintenanceRequest'
            }
        })
        .sort({ createdAt: -1 }) 
        .exec();
        
    const filteredReports = workReports.filter(workReport => 
        workReport.orderId?.solicitud && 
        workReport.orderId.solicitud.serialNumber === serialNumber
    );

    return filteredReports;
}

}  