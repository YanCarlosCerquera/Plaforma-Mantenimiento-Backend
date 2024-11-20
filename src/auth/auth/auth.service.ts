import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { RolService } from 'src/Segurity/rol/rol.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly rolService: RolService,
  ) { }

  /**
   * Login Method
   */
  async login(loginDto: LoginDto): Promise<object> {
    const user = await this.userService.authentication(loginDto.document, loginDto.typeDocument);

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
      access_token: this.jwtService.sign(payload),
      menu: menu
    };
  }
  /**
   * Password Recovery Initialization
   */
  async iniciarRecuperacionContrasena(typeDocument: string, numberDocument: string): Promise<void> {
    try {
      // Find user by document
      const user = await this.userService.findByDocumento(typeDocument, numberDocument);
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Generate recovery token
      const token = this.jwtService.sign(
        { sub: user._id.toString(), typeDocument: user.typeDocument, numberDocument: user.numberDocument },
        { expiresIn: '1h' }
      );

      // Email recovery link
      const urlRecuperacion = `http://localhost:3000/users?token=${token}`;
      const htmlContent = `
        <h1>Hola ${user.name},</h1>
        <p>Haz clic en el enlace para restablecer tu contraseña:</p>
        <a href="${urlRecuperacion}">Restablecer Contraseña</a>
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

  /**
   * Password Reset
   */
  async resetearContrasena(token: string, nuevaContrasena: string): Promise<void> {
    try {
      // Verify token
      const payload = this.jwtService.verify(token);

      // Find user by document
      const user = await this.userService.findByDocumento(payload.typeDocument, payload.numberDocument);
      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      // Update password
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      await this.userService.updatePassword(user._id.toString(), hashedPassword);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
