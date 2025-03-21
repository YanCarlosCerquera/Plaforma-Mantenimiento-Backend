import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import { GenericController } from 'src/Generic/generic.controller';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Assets } from './entities/asset.entity';
import { Log } from 'src/auth/auth/decorators/log.decorator';
@Public()
@Log('bienes', '/assets')
@Controller('assets')
export class AssetsController extends GenericController<Assets, CreateAssetDto, UpdateAssetDto> {
  constructor(private readonly assetsService: AssetsService) {
    super(assetsService)
  }
  @Post()
  @Log('Bienes', '/assets/new')
  @Public()
  @UseInterceptors(FileInterceptor('image', {
    dest: './uploads',
  }))
  async create(@Body() asset: CreateAssetDto, @UploadedFile() file: Express.Multer.File): Promise<Assets> {
    if (file) {
      asset.image = path.join('/uploads', file.filename);
    }
    return this.assetsService.create(asset);
  }
  @Get('count-by-category')
  async getAssetCountByCategory() {
    return this.assetsService.getAssetCountByCategory();
  }

  @Get('InventoryCode/:code')
  async getAssetByInventoryCode(@Param('code') code: string): Promise<Assets | null> {
    return this.assetsService.InventotyCode(code);
  }
}  