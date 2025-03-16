import { forwardRef, Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assets, AssetsSchema } from './entities/asset.entity';
import { MulterModule } from '@nestjs/platform-express';
import { CategoriesModule } from '../categories/categories.module';
import { WorkReportModule } from '../work_report/work_report.module';
import { EnvironmentsModule } from 'src/environments/environments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assets.name, schema: AssetsSchema }]),
    MulterModule.register({
      dest: './uploads/assets',
    }),
    CategoriesModule,
    EnvironmentsModule,
    forwardRef(() => WorkReportModule), 
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService, MongooseModule],
})
export class AssetsModule {}
