  import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import * as bcrypt from 'bcrypt';
  import { InjectModel } from '@nestjs/mongoose';
  import { User } from './entities/user.entity';
  import { Model } from 'mongoose';
import { GenericService } from 'src/Generic/generic.service';
import { RolService } from 'src/Segurity/rol/rol.service';

  @Injectable()
  export class UsersService extends GenericService<User, CreateUserDto, UpdateUserDto	>{

    constructor(@InjectModel(User.name) private UserModel: Model<User>,
    private rolService: RolService){
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

    async findByDocumento(typeDocument: string, numberDocument: string): Promise<User | null> {
      return this.UserModel.findOne({ typeDocument, numberDocument }).exec();
    }
    
    async updatePassword(userId: string, newPassword: string): Promise<void> {
      const user = await this.UserModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      user.password = newPassword;
      await user.save();
    }
  

    async authentication(document: string, typeDocument: string): Promise<User> {
      return await this.UserModel.findOne({
        numberDocument: document,
        typeDocument: typeDocument,
        state: true
      }).exec()
    }

    async findOne(id: string): Promise<User> {
      const user = await this.UserModel.findById(id).populate({
        path:'assignedRol',
        select:'name'
      }).exec();
    
      return user;
    }

    async findAll(): Promise<User[]> {
      const users = await this.UserModel.find().populate({
        path:'assignedRol',
        select:'name'
      }).exec();
  
      return users.map(user => {
        if (user.photoUrl) {
          user.photoUrl = `http://localhost:3000${user.photoUrl.replace(/\\/g, '/')}`;
        }
        return user;
      });
    }

    async findAllTecnhnical(): Promise<User[]> {
      const rol = await this.rolService.findName('técnico')
      return await this.UserModel.find({ assignedRol: rol }).populate({
        path:'assignedRol',
        select:'name'
      }).exec();
    }
  
  }
