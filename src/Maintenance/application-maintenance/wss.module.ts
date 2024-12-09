import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WssService } from './Wss.service';
import { ConfigModule } from 'src/Parametrization/config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WssService],
  exports: [WssService],
})
export class WssModule {}
