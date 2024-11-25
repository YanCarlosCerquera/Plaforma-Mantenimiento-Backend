import { ConflictException, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { RolService } from 'src/Segurity/rol/rol.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';
import { hash } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import { RegistroDto } from './dto/RegistroDto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly rolService: RolService,
    @InjectModel(User.name) private userModel : Model<User>
  ) { }

  async Registro(registroDto: RegistroDto): Promise<User> {
    const { email, numberDocument, password, assignedRol } = registroDto;
  
    // Verifica si el usuario ya existe
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { numberDocument }]
    });
  
    if (existingUser) {
      throw new BadRequestException('El nombre o numero Documento ya se encuentran registrados!!');
    }
  
    // Encriptar la contraseña
    const Hasst = 10;
    const hashedPassword = await bcrypt.hash(password, Hasst);
  
    const idRolTemporal = '6470f7be43fcab2f5e011151';

  const rolId = assignedRol ? assignedRol._id : idRolTemporal;

  const userToCreate = {
    ...registroDto,
    password: hashedPassword,
    state: true,
    assignedRol: rolId,
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


    const rolId = user.assignedRol._id.toString();
    const menu = await this.rolService.menu(rolId)
    
    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      menu: menu
    };

  }

  async iniciarRecuperacionContrasena(typeDocument: string, numberDocument: string): Promise<void> {
    const user = await this.userService.findByDocumento(typeDocument, numberDocument);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const token = this.jwtService.sign(
      { sub: user._id.toString() },
      { expiresIn: '15m' }
    );

    user.tokenReference = token;
    await user.save();

    const urlRecuperacion = `http://localhost:3000/reset-password/${user._id}`;
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Cuenta</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #eaeaea;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header img {
      max-width: 120px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 22px;
      color: #0056b3;
    }
    .content {
      padding: 15px;
    }
    .content p {
      margin: 15px 0;
    }
    .content a {
      display: inline-block;
      margin: 20px 0;
      padding: 12px 20px;
      background-color: #0056b3;
      color: #ffffff;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      text-align: center;
    }
    .content a:hover {
      background-color: #003d82;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666666;
      margin-top: 20px;
      border-top: 1px solid #eaeaea;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://educacionygestion.com/wp-content/uploads/2017/12/certificado-sena.jpg" alt="SENA Logo">
      <h1>Recuperación de Cuenta</h1>
    </div>
    <div class="content">
      <p>Estimado(a) <strong>${user.name}</strong>,</p>
      <p>
        Hemos recibido tu solicitud para restablecer la contraseña de tu cuenta en el SENA. Por favor, haz clic en el botón a continuación para completar el proceso:
      </p>
      <a href="${urlRecuperacion}" target="_blank">Restablecer Contraseña</a>
      <p>Nota: Este enlace será válido solo por los próximos <strong>15 minutos</strong>.</p>
      <p>Gracias por confiar en el SENA. Estamos comprometidos con brindarte un servicio oportuno y eficaz.</p>
    </div>
    <div class="footer">
      <p>Coordinación Académica Sede Industria</p>
      <p>Neiva - Huila</p>
    </div>
  </div>
</body>
</html>

`;



    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recuperación de Contraseña',
      html: htmlContent,
    });
  }



  async resetearContrasena(userId: string, nuevaContrasena: string): Promise<void> {
    const user = await this.userService.findOne(userId);

    if (!user || !user.tokenReference) {
      throw new UnauthorizedException('No se encontró un proceso de recuperación válido');
    }

    try {
      this.jwtService.verify(user.tokenReference);

      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      user.password = hashedPassword;
      user.tokenReference = null;
      await user.save();
    } catch (error) {
      throw new UnauthorizedException('El token es inválido o ha expirado');
    }
  }
}  
