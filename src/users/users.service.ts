  import { Injectable } from '@nestjs/common';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import * as bcrypt from 'bcrypt';
  import { InjectModel } from '@nestjs/mongoose';
  import { User } from './entities/user.entity';
  import { Model } from 'mongoose';
import { GenericService } from 'src/Generic/generic.service';

  @Injectable()
  export class UsersService extends GenericService<User, CreateUserDto, UpdateUserDto	>{

    constructor(@InjectModel(User.name) private UserModel: Model<User>){
      super(UserModel)
    }

    async create(createDto: CreateUserDto): Promise<User> {
      if(createDto.password){
        createDto.password = await bcrypt.hash(createDto.password, 10)
      }
      const createdItem = new this.UserModel(createDto);
      return await createdItem.save(); 
    }

    async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    if(updateDto.password){
      updateDto.password = await bcrypt.hash(updateDto.password, 10)
    }
    return await this.UserModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    }

    async findEmail(email: string): Promise<User> {
      return await this.UserModel.findOne({email}).exec()
    }
  }
