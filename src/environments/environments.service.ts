import { Injectable } from "@nestjs/common";
import { CreateEnvironmentDto } from "./dto/create-environment.dto";
import { UpdateEnvironmentDto } from "./dto/update-environment.dto";
import { GenericService } from "src/Generic/generic.service";
import { Environment } from "./entities/environment.entity";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class EnvironmentsService extends GenericService<
  Environment,
  CreateEnvironmentDto,
  UpdateEnvironmentDto
> {
  constructor(
    @InjectModel(Environment.name)
    private readonly environmentModel: Model<Environment>
  ) {
    super(environmentModel);
  }
  async findOne(id: string): Promise<Environment> {
    return await this.environmentModel
      .findById(id)
      .populate('trainingCenter', 'name') 
      .populate('responsibleUser', 'name') 
      .exec();
  }
  
  async findAll(): Promise<Environment[]> {
    return await this.environmentModel
      .find()
      .populate('trainingCenter', 'name')
      .populate('responsibleUser', 'name')
      .exec();
  }
  
}
