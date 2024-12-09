import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, SchemaCategory } from './entities/category.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Category.name, schema: SchemaCategory}])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports:[MongooseModule]
})
export class CategoriesModule {}
