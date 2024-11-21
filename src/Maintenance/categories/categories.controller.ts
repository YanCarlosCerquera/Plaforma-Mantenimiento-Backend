import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController extends GenericController<Category, CreateCategoryDto, UpdateCategoryDto>{
  constructor(private readonly categoriesService: CategoriesService) {
    super(categoriesService)
  }

}
