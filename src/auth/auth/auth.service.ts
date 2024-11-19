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

@Injectable()
export class AuthService {
  constructor(
    private readonly userSerice: UsersService,
    private jwtservice : JwtService
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string}> {
    const { email, password } = loginDto;
    const user = await this.userSerice.findEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidasObjectUser');
    }
    
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtservice.sign(payload),
    };
  }
}  