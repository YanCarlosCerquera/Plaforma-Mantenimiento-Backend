import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Assets } from './entities/asset.entity';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
@Public()
@Controller('assets')
export class AssetsController extends GenericController<Assets , CreateAssetDto , UpdateAssetDto> {
  constructor(private readonly assetsService: AssetsService) {
    super(assetsService)
  }
  @Post()
  @Public()
  @UseInterceptors(FileInterceptor('image', {
    dest: './uploads',
  }))
  async create(@Body() asset: CreateAssetDto , @UploadedFile() file : Express.Multer.File): Promise<Assets> {
    if (file) {
      asset.image =  path.join('/uploads', file.filename);
    }
    return this.assetsService.create(asset);  
  }
  @Get('count-by-category')
  async getAssetCountByCategory() {
    return this.assetsService.getAssetCountByCategory();
  }

}