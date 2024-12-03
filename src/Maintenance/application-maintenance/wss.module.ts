import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WssService } from './Wss.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WssService],
  exports: [WssService],
})
export class WssModule {}
