import { Controller, Post, Body, UploadedFile, UseInterceptors, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from 'src/auth/auth/decorators/public.decorator';
import * as path from 'path';
import { User } from './entities/user.entity';
import { GenericController } from 'src/Generic/generic.controller';
import { UpdateUserDto } from './dto/update-user.dto';
import { Log } from 'src/auth/auth/decorators/log.decorator';


@Controller('users')
@Log('Usuarios', '/usu')
export class UsersController extends GenericController<User, CreateUserDto, UpdateUserDto> {
  constructor(private readonly usersService: UsersService) {
    super(usersService)
  }

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('photo', {
    dest: './uploads',
  }))
  async create(@Body() createDto: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createDto.photoUrl = path.join('/uploads', file.filename);
    }
    return this.usersService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll()
  }
}