import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { sparePartsStatus } from "src/enum/sparePartsStatus.enum";
import { typeMaintenance } from "src/enum/typeMaintenance.enum";

export class CreateMaintenanceDto {
    @IsNotEmpty()
    @IsEnum(typeMaintenance)
    typeMaintenance: typeMaintenance;
  
    @IsNotEmpty()
    @IsString()
    description: string;
  
    @IsNotEmpty()
    @IsString()
    observation: string;
  
    @IsNotEmpty()
    @IsEnum(sparePartsStatus)
    sparePartsStatus: sparePartsStatus;
  
    @IsOptional()
    @IsString()
    sparePartsDetails?: string;
  
    @IsNotEmpty()
    @IsMongoId()
    technicalId: string;
  
    @IsNotEmpty()
    @IsString()
    technicalSignature: string;
  
    @IsOptional()
    @IsBoolean()
    state?: boolean;
}
