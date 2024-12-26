import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assets, AssetsSchema } from './entities/asset.entity';
import { MulterModule } from '@nestjs/platform-express';
import { Category } from '../categories/entities/category.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Assets.name, schema: AssetsSchema }]),
MulterModule.register({
  dest: './uploads/assets',
}),
 CategoriesModule
],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports:[AssetsService, MongooseModule]
})
export class AssetsModule {}
