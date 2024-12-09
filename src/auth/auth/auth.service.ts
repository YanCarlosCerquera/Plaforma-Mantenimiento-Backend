import { ConflictException, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { RolService } from 'src/Segurity/rol/rol.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { hash, randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import { RegistroDto } from './dto/RegistroDto';
import { InfobipService } from 'src/Maintenance/application-maintenance/sms.service';
import { UltraMsgService } from 'src/Maintenance/application-maintenance/Wss.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly rolService: RolService,
    private readonly smsService : InfobipService,
    private readonly wssserive : UltraMsgService,
    @InjectModel(User.name) private userModel : Model<User>
  ) { }

  async Registro(registroDto: RegistroDto): Promise<User> {
    const { email, numberDocument, password, assignedRol } = registroDto;
  
    // Verificar si el usuario ya existe
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { numberDocument }],
    });
  
    if (existingUser) {
      throw new BadRequestException('El email o número de documento ya están registrados!');
    }
  
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const defaultRolId = '674894abd8a183de563a2f48';
    const defaultCargo = 'Developer';
  
    const userToCreate = {
      ...registroDto,
      password: hashedPassword,
      assignedRol: defaultRolId,
    };
  
    const newUser = new this.userModel(userToCreate);
    return newUser.save();
  }
  


  async login(loginDto: LoginDto): Promise<object> {
    const user = await this.userService.authentication(loginDto.document, loginDto.typeDocument);
  
    if (!user) {
      throw new UnauthorizedException('El documento o tipo de documento no existe');
    }
  
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }
  
    let menu ={}
    if (user.assignedRol && user.assignedRol) {
      const rolId = user.assignedRol.toString();
      menu = await this.rolService.menu(rolId);
    } else {
      console.warn(`User ${user._id} does not have an assigned role or role ID.`);
    }
    
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      menu: menu
    };
  }

  async iniciarRecuperacionContrasena(typeDocument: string, numberDocument: string ): Promise<String> {
    const user = await this.userService.findByDocumento(typeDocument, numberDocument);
    console.log(user);
    
  
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  
    const code = randomBytes(3).toString('hex');  // Generates a random 6 character code
    user.resetCode = code;  // Save the code to the user model
    user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);  // Expiry time: 15 minutes
    await user.save();
  
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 5px; overflow: hidden;">
            <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #39a900;">
                    <h1 style="color: #ffffff; margin: 0;">Recuperación de Contraseña</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 30px 20px;">
                    <p style="margin-bottom: 20px;">Estimado(a) ${user.name},</p>
                    <p style="margin-bottom: 20px;">Has solicitado restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 15px 30px; background-color: #39a900; border-radius: 5px; animation: pulse 2s infinite;">
                            <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 5px;">${code}</span>
                        </div>
                    </div>
                    <p style="margin-bottom: 20px; font-weight: bold;">Este código expirará en 15 minutos.</p>
                    <p style="margin-bottom: 20px;">Si no has solicitado este cambio, por favor ignora este correo o contacta a soporte técnico.</p>
                    <p>Gracias,<br>El equipo de Tecnoparque Nodo Neiva</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px; text-align: center; background-color: #f0f0f0; font-size: 12px; color: #666;">
                    <p>&copy; 2023 Tecnoparque Nodo Neiva. Todos los derechos reservados.</p>
                </td>
            </tr>
        </table>
        <style>
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        </style>
    </body>
    </html>
    `;  
  
    await this.enviarNotificacionSMS(user, user.phone, user.name, false);
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recuperación de Contraseña',
      html: htmlContent,
    });
  
    return user._id.toString(); 
  }
  

  async resetearContrasena(userId: string, code: string, nuevaContrasena: string): Promise<void> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.resetCode !== code) {
      throw new UnauthorizedException('Código incorrecto');
    }

    if (user.resetCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('El código ha expirado');
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    user.password = hashedPassword;
    user.replaceOne = null;  
    user.resetCode = null;
    user.resetCodeExpiresAt = null; 
    await user.save();

  }
  async verificarCodigoRecuperacion(userId: string, code: string): Promise<boolean> {
    const user = await this.userService.findOne(userId);
  
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  
    if (user.resetCode !== code) {
      return false;
    }
  
    if (user.resetCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('El código ha expirado');
    }
    return true;
  }
  
  private async enviarNotificacionSMS(user: User, phone: string, name: string, isRequester: boolean) {
    const mensaje =  `Hola ${user.name}, su solicitud para el cambio de contrasela ha sido recibida 
    Codigo:${user.resetCode}
    .
       `;


    try {
      await this.smsService.sendSms(phone, mensaje);
      console.log(`Cambair contrseña ${user.resetCode}`);
    } catch (error) {
      console.error(`Error al enviar notificación  ${user.resetCode}:`, error);
    }
  }
  private async enviarPorwSS(user: User, phone: string, name: string, isRequester: boolean) {
    const mensaje =  `Hola ${user.name}, su solicitud para el cambio de contrasela ha sido recibida 
    Codigo:${user.resetCode}
    .
       `;


    try {
      await this.wssserive.sendMessage(phone, mensaje);
      console.log(`Cambair contrseña ${user.resetCode}`);
    } catch (error) {
      console.error(`Error al enviar notificación  ${user.resetCode}:`, error);
    }
  }
}