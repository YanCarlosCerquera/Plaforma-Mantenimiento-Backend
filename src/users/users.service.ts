import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model, RootFilterQuery } from 'mongoose';
import { GenericService } from 'src/Generic/generic.service';
import { RolService } from 'src/security/rol/rol.service';

@Injectable()
export class UsersService extends GenericService<User, CreateUserDto, UpdateUserDto> {

  constructor(@InjectModel(User.name) private UserModel: Model<User>,
    private rolService: RolService) {
    super(UserModel)
  }

  async create(createDto: CreateUserDto): Promise<User> {
    if (createDto.password) {
      createDto.password = await bcrypt.hash(createDto.password, 10)
    }
    const createdItem = new this.UserModel(createDto);
    return await createdItem.save();
  }


  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.UserModel.findById(id).exec();
  
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
  
    if (updateDto.oldPassword && updateDto.password) {
      const isPasswordValid = await bcrypt.compare(updateDto.oldPassword, user.password);

      if (!isPasswordValid) {
        throw new Error('La contraseña anterior es incorrecta');
      }
  
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    } else if (updateDto.password) {
      throw new Error('Debes proporcionar la contraseña anterior para cambiar la contraseña');
    }
  
    return await this.UserModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  
  }

  

  async findByDocumento(typeDocument: string, numberDocument: string): Promise<User | null> {
    return this.UserModel.findOne({ typeDocument, numberDocument }).exec();
  }

  async FindByPhone(phone: string): Promise<User | null> {
    return this.UserModel.findOne({ phone }).exec();
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
      path: 'assignedRol',
      select: 'name'
    }).exec();

    return user;
  }

  
  async findAll(filters?: UpdateUserDto): Promise<User[]> {
    const users = await this.UserModel.find(filters as unknown as RootFilterQuery<User>).populate({
      path: 'assignedRol',
      select: 'name'
    }).exec();

    return users.map(user => {
      if (user.photoUrl) {
        user.photoUrl = `http://localhost:3000${user.photoUrl.replace(/\\/g, '/')}`;
      }
      return user;
    });
  }




async findALLInstructor() : Promise<User[]> {
  try {
    const RolInstructor = await this.rolService.findName("Instructor");

  if(!RolInstructor) {
    throw new Error("No se encontro Instructor")

  }
  const InstructorUsers = await this.UserModel.find({
    assignedRol: RolInstructor._id
  }).populate({
    path: 'assignedRol',
    select: 'name'

  })
  .select("-photoUrl")
  .exec();

  console.log(`Se encontraron ${InstructorUsers.length} técnicos`);
  return InstructorUsers;
} catch (error) {
  console.error('Error al buscar técnicos:', error);
  throw new Error('Error al buscar usuarios técnicos');
}
}


  async findAllTechnical(): Promise<User[]> {
    try {
      // Primero buscamos el rol de técnico
      const rolTecnico = await this.rolService.findName('técnico');
      
      if (!rolTecnico) {
        throw new Error('No se encontró el rol de técnico');
      }

      // Buscamos todos los usuarios con ese rol
      const technicalUsers = await this.UserModel.find({
        assignedRol: rolTecnico._id
      }).populate({
        path: 'assignedRol',
        select: 'name'
      }).exec();

      console.log(`Se encontraron ${technicalUsers.length} técnicos`);
      return technicalUsers;
    } catch (error) {
      console.error('Error al buscar técnicos:', error);
      throw new Error('Error al buscar usuarios técnicos');
    }
  }
}
