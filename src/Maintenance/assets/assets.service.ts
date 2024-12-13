import { Injectable } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Assets, AssetsDocument } from './entities/asset.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AssetsService extends GenericService<Assets , CreateAssetDto , UpdateAssetDto>{
  constructor(@InjectModel(Assets.name) private AssetsModel : Model <AssetsDocument>){
    super(AssetsModel)
  }
  async findOne(id: string): Promise<Assets> {
    return await this.AssetsModel.findById(id)
      .populate({ 
        path: 'trainingCenterId',       
        select: 'name',                   
      })
      .populate({
        path: 'accountHolderId',          
        select: 'name',                   
      })
      .populate ({
        path: 'categoryId',
        select:'name operationVars  accessories  '
      })
      .exec();
  }
  
  async findAll(): Promise<Assets[]> {
    return await this.AssetsModel.find()
      .populate({
        path: 'trainingCenterId',        
        select: 'name',                  
      })
      .populate({
        path: 'accountHolderId',        
        select: 'name',                  
      })
      .populate ({
        path: 'categoryId',
        select:'name operationVars  accessories  '
      })
      .exec();
  }
  
}