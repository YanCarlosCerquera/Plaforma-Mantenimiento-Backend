import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { InfobipService } from './sms.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [InfobipService],
  exports: [InfobipService]
})
export class SmsModule {}

