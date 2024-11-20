import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import { LoginDto } from './dto/Login';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Document, Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService 
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;
    const user = await this.userService.findEmail(email);

    if (!user) {
      console.log(user);
      
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async iniciarRecuperacionContrasena(typeDocument: string, numberDocument: string): Promise<void> {
    try {
      const user = await this.userService.findByDocumento(typeDocument, numberDocument);
      console.log('Usuario encontrado:', user);
  
      if (!user) throw new NotFoundException('Usuario no encontrado');
  
      const token = this.jwtService.sign(
        { sub: user._id.toString(), typeDocument: user.typeDocument, numberDocument: user.numberDocument },
        { expiresIn: '1h' }
      );
      console.log('Token generado:', token);
  
      const urlRecuperacion = `http://localhost:3000/users?token=${token}`;
  
      const htmlContent = `
        <h1>Hola ${user.name},</h1>
        <p>Haz clic en el enlace para restablecer tu contraseña:</p>
        <a href="${urlRecuperacion}">Restablecer Contraseña</a>
        <a href="${token}"></a>
        <p>Este enlace expirará en 1 hora.</p>
      `;
  
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Recuperación de Contraseña',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      if (error instanceof NotFoundException) throw error;
      throw new Error('No se pudo iniciar el proceso de recuperación de contraseña');
    }
  }
  
  async resetearContrasena(token: string, nuevaContrasena: string): Promise<void> {
    try {
      console.log('Token recibido en servicio:', token);
      const payload = this.jwtService.verify(token);
  
      console.log('Payload del token:', payload);
  
      const user = await this.userService.findByDocumento(payload.typeDocument, payload.numberDocument);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
  
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      await this.userService.updatePassword(user._id.toString(), hashedPassword);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}