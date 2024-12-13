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
    return match ? parseFloat(match[1]) : 0; // Retorna 0 si no encuentra coincidencia
  }
  
  private extractBoolean(text: string, regex: RegExp): boolean {
    const match = text.match(regex);
    return match ? match[1].toLowerCase() === 'true' : false;
  }

  async maintenanceHistory(serialNumber: string){
    return await this.workReportModel.find().populate({
      path: 'orderId',
      select: 'radicado',
      match: { state: true},
      populate: {
        path: 'solicitud.solicitudId',
        select: 'maintenanceType',
        match: {serialNumber: serialNumber}
      }
    }).exec().then(results => {
      return results.filter(workReport => workReport.orderId?.solicitud?.solicitudId);
  });
  }
}  