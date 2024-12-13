import { IsString, IsNumber, IsBoolean, IsOptional, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateWorkReportDto {
  @IsMongoId()
  orderId: Types.ObjectId; 

  @IsNumber()
  costs: number; 

  @IsNumber()
  hours: number; 

  @IsString()
  responses: string; 

  @IsOptional()
  @IsString()
  observation?: string; 

  @IsString()
  workDone: string;

  @IsBoolean()
  status: boolean; 
}
