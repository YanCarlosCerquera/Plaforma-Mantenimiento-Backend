import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Rol } from 'src/Segurity/rol/entities/rol.entity';
import { User } from 'src/users/entities/user.entity';
import { Document } from 'mongoose';
import { LoginDto } from './dto/Login';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { RolService } from 'src/Segurity/rol/rol.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userSerice: UsersService,
    private readonly rolService: RolService,
    private jwtservice : JwtService
  ) {}

  async login(loginDto: LoginDto): Promise<object> {
    const user = await this.userSerice.authentication(loginDto.document, loginDto.typeDocument);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const rolId = user.assignedRol._id.toString();
    const menu = await this.rolService.menu(rolId)
    
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtservice.sign(payload),
      menu: menu
    };
  }
}  