import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, SchemaConfig } from './entities/config.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Config.name, schema: SchemaConfig}])],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
