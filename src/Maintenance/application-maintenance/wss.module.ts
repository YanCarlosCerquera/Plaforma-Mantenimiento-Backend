import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UltraMsgService } from './Wss.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [UltraMsgService],
  exports: [UltraMsgService],
})
export class WssModule {}
