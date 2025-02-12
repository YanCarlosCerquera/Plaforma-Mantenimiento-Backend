
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/Parametrization/config/config.module';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
  imports: [HttpModule, ConfigModule], // Import ZoomModule instead of ZoomService
  providers: [GoogleCalendarService], // Add ZoomService to providers
  exports: [GoogleCalendarService]
})
export class GoogleModule {}

