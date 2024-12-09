import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InfobipService } from './sms.service';
import { ConfigModule } from 'src/Parametrization/config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [InfobipService],
  exports: [InfobipService]
})
export class SmsModule {}

