import { Injectable } from '@nestjs/common';
import { CreateWorkReportDto } from './dto/create-work_report.dto';
import { UpdateWorkReportDto } from './dto/update-work_report.dto';
import { GenericService } from 'src/Generic/generic.service';
import { WorkReport } from './entities/work_report.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class WorkReportService extends GenericService<WorkReport , CreateWorkReportDto ,UpdateWorkReportDto> {
  constructor(@InjectModel(WorkReport.name) private WwordReportModel : Model<WorkReport>){
    super(WwordReportModel)
  }
  async findAll(): Promise<WorkReport[]> {
    return await this.WwordReportModel.find().populate({
      path: 'orderId',
      select: 'radicado state',
    }).exec()
  }

  async findOne(id: string): Promise<WorkReport> {
    return await this.WwordReportModel.findById(id).populate({
      path: 'orderId',
      select: 'radicado state',
    }).exec()
  }
}