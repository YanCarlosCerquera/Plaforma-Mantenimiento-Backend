import { Module } from '@nestjs/common';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { Rol, SchemaRol } from './entities/rol.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Rol.name, schema: SchemaRol}])],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService , MongooseModule],
})
export class RolModule {}
