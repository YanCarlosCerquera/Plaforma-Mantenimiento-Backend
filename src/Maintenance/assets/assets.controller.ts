import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { Assets } from './entities/asset.entity';
import { Public } from 'src/auth/auth/decorators/public.decorator';
@Public()
@Controller('assets')
export class AssetsController extends GenericController<Assets , CreateAssetDto , UpdateAssetDto> {
  constructor(private readonly assetsService: AssetsService) {
    super(assetsService)
  }
}