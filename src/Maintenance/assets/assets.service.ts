import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenericService } from 'src/Generic/generic.service';
import { Category } from '../categories/entities/category.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Assets, AssetsDocument } from './entities/asset.entity';
import { WorkReportService } from '../work_report/work_report.service';

@Injectable()
export class AssetsService extends GenericService<Assets, CreateAssetDto, UpdateAssetDto> {
  constructor(@InjectModel(Assets.name) private AssetsModel: Model<AssetsDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @Inject(forwardRef(() => WorkReportService)) 
    private readonly workReportService: WorkReportService
  ) {
    super(AssetsModel)
  }

  async create(createDto: CreateAssetDto): Promise<Assets> {
    const createdItem = new this.AssetsModel(createDto);
    return await createdItem.save();
  }


  async findOne(id: string): Promise<Assets> {
    return await this.AssetsModel.findById(id)
      .populate({
        path: 'environmentId',
        select: 'name',
      })
      .populate({
        path: 'categoryId',
        select: 'name operationVars  accessories  '
      })
      .exec();
  }

  async findAll(): Promise<Assets[]> {
    const assets = await this.AssetsModel.find()
        .populate({
            path: 'environmentId',
            select: 'name',
        })
        .populate({
            path: 'categoryId',
            select: 'name operationVars accessories'
        })
        .exec();

    for (const asset of assets) {
        const historial = await this.workReportService.maintenanceHistory(asset.serialNumber);
        
        if (historial.length > 0) {
            const lastReport = historial.sort((a, b) =>
                new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()
            )[0];

            asset.lastReportDate = (lastReport as any).createdAt;
        } else {
            asset.lastReportDate = null;
        }
    }

    return assets;
}

  async InventotyCode(code: string): Promise<Assets | null> {
    return await this.AssetsModel.findOne({ inventoryCode: code }).populate('environmentId', 'name')
    .exec();
  }



  async getAssetCountByCategory(): Promise<{ category: string; count: number }[]> {
    const result = await this.AssetsModel.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category._id',
          category: { $first: '$category.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: 1,
          count: 1
        }
      }
    ]);

    return result;
  }
}
