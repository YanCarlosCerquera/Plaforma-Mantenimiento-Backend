import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GenericService } from 'src/Generic/generic.service';
import { Category } from './entities/category.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CategoriesService extends GenericService<Category, CreateCategoryDto, UpdateCategoryDto>{
  constructor(@InjectModel(Category.name) private categoryModule: Model<Category>){
    super(categoryModule)
  }
}
