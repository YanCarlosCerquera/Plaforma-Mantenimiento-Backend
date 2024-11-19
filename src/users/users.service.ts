  import { Injectable } from '@nestjs/common';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { InjectModel } from '@nestjs/mongoose';
  import { User } from './entities/user.entity';
  import { Model } from 'mongoose';
import { GenericService } from 'src/Generic/generic.service';

  @Injectable()
  export class UsersService extends GenericService<User, CreateUserDto>{

    constructor(@InjectModel(User.name) private UserModel: Model<User>){
      super(UserModel)
    }

  }
