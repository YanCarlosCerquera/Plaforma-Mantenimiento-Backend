import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UltraMsgService } from './Wss.service';
import { ConfigModule } from 'src/Parametrization/config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [UltraMsgService],
  exports: [UltraMsgService],
})
export class WssModule {}
