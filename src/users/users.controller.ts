import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GenericController } from 'src/Generic/generic.controller';
import { User } from './entities/user.entity';
import { Public } from 'src/auth/auth/decorators/public.decorator';

@Controller('users')
export class UsersController extends GenericController<User, CreateUserDto, UpdateUserDto>{
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  @Public()
  @Post()
  create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

}
