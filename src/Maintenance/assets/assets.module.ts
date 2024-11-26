import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assets, AssetsSchema } from './entities/asset.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Assets.name, schema: AssetsSchema }])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports:[AssetsService, MongooseModule]
})
export class AssetsModule {}
