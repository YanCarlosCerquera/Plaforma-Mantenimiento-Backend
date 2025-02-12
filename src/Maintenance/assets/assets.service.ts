import { Injectable } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Assets, AssetsDocument } from './entities/asset.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/entities/category.entity';
import { GoogleCalendarService } from './service/google-calendar.service';

@Injectable()
export class AssetsService extends GenericService<Assets , CreateAssetDto , UpdateAssetDto>{
  constructor(@InjectModel(Assets.name) private AssetsModel : Model <AssetsDocument>,
  @InjectModel(Category.name) private categoryModel: Model<Category>,
  private googleCalendarService: GoogleCalendarService



){
    super(AssetsModel)
  }
  async create(createDto: CreateAssetDto): Promise<Assets> {
    try {
      const createdItem = new this.AssetsModel(createDto);
      const savedItem = await createdItem.save();

      try {
        const eventName = `Pendejo de ${savedItem.name}`;
        const eventColor = 'red'; // Puedes cambiar esto o hacerlo dinámico según tus necesidades
        const eventData = await this.googleCalendarService.createEvent(
          savedItem.name,
          savedItem.acquisitionDate.toISOString(),
          eventName,
        );
        console.log(`Evento creado en Google Calendar: ${eventData.htmlLink}`);
        
        savedItem.calendarEventLink = eventData.htmlLink;
        await savedItem.save();
      } catch (error) {
        console.error('Error al crear el evento en Google Calendar:', error);
      }

      return savedItem;
    } catch (error) {
      console.error('Error al crear el activo:', error);
      throw new Error('No se pudo crear el activo.');
    }
  }

  async findOne(id: string): Promise<Assets> {
    return await this.AssetsModel.findById(id)
      .populate({ 
        path: 'trainingCenterId',       
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
      .populate ({
        path: 'categoryId',
        select:'name operationVars  accessories  '
      })
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
