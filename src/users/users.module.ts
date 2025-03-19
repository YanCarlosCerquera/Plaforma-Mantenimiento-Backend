import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, SchemaUser } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { RolModule } from 'src/security/rol/rol.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: SchemaUser }]),
    MulterModule.register({
      dest: './uploads/users',
    }),
    RolModule,
  ],
   providers: [UsersService],
  controllers: [UsersController],
  exports:[UsersService, MongooseModule]
})
export class UsersModule {}
