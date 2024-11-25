import { PartialType } from '@nestjs/swagger';
import { CreateApplicationMaintenanceDto } from './create-application-maintenance.dto';

export class UpdateApplicationMaintenanceDto extends PartialType(CreateApplicationMaintenanceDto) {}
