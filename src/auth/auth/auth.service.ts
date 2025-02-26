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
import { UltraMsgService } from 'src/Maintenance/application-maintenance/Wss.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly rolService: RolService,
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
    let rolId;
    if (assignedRol && assignedRol) {
      rolId = assignedRol;
    } else {
      rolId = defaultRolId;
    }
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
console.log(rolId);


      
    } else {
      console.warn(`User ${user._id} does not have an assigned role or role ID.`);
    }
    
    const payload =  {sub: user._id, email: user.email };
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
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f2f2f2;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #000000;
            color: #fff;
            text-align: center;
            padding: 30px 20px;
        }
        .header img {
            max-width: 120px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px 20px;
        }
        .content p {
            margin-bottom: 20px;
        }
        .code-box {
            text-align: center;
            margin: 30px 0;
        }
        .code-box span {
            display: inline-block;
            padding: 15px 30px;
            background-color: #000000;
            border-radius: 5px;
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            animation: pulse 2s infinite;
        }
        .footer {
            text-align: center;
            background-color: #f0f0f0;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @media (max-width: 600px) {
            .header, .content, .footer {
                padding: 20px 15px;
            }
            .code-box span {
                font-size: 20px;
                padding: 10px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png" alt="Logo">
            <h1>Recuperación de Contraseña</h1>
        </div>
        <div class="content">
            <p>Estimado(a) <strong>${user.name}</strong>,</p>
            <a>Con el Estado ${user.state}</a>
            <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
            <div class="code-box">
                <span>${code}</span>
            </div>
            <p><strong>Este código expirará en 15 minutos.</strong></p>
            <p>Si no has solicitado este cambio, por favor ignora este correo o contacta a soporte técnico.</p>
            <p>Gracias,<br>El equipo de Tecnoparque Nodo Neiva</p>
        </div>
        <div class="footer">
            &copy; 2023 Tecnoparque Nodo Neiva. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
    `;  
  
/*     await this.enviarNotificacionSMS(user, user.phone, user.name, false);
 */    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recuperación de Contraseña',
      html: htmlContent,
    });
  
    return user._id.toString(); 
  }
  
   async CodigoWss(user: User, phone: string, name: string, isRequester: boolean) {
const messaje = await this.userService.FindByPhone(phone);
    if (!messaje) {
      throw new NotFoundException('Usuario no encontrado');
    }
    
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
  

async enviarCodigoRecuperacion(userId: string, method: string): Promise<boolean> {
  const user = await this.userService.findOne(userId);
  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (!user.resetCode || !user.resetCodeExpiresAt) {
    throw new BadRequestException('No se ha iniciado el proceso de recuperación de contraseña');
  }

  if (user.resetCodeExpiresAt < new Date()) {
    throw new UnauthorizedException('El código ha expirado');
  }

  try {
    switch (method) {
      case 'email':
        await this.iniciarRecuperacionContrasena(user.typeDocument, user.numberDocument);
        break;
      case 'whatsapp':
        await this.CodigoWss(user, user.phone, user.name, false);
        break;
      default:
        throw new BadRequestException('Método de envío no válido');
    }
    return true;
  } catch (error) {
    console.error(`Error al enviar código de recuperación: ${error.message}`);
    return false;
  }
}
}