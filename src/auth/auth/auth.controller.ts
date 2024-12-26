import { Controller, Post, Body, UnauthorizedException, NotFoundException, InternalServerErrorException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/Login';
import { Public } from './decorators/public.decorator';
import { UsersService } from 'src/users/users.service';
import { RegistroDto } from './dto/RegistroDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService ,
    private readonly userserive: UsersService
  ) { }

  @Public()
  @Post('     ')
  async registro(@Body() registroDto: RegistroDto) {
    try {
      const registrado = await this.authService.Registro(registroDto);
      return { message: "Registro Completo", registrado: registrado };
    } catch (error) {
      console.error('Error en el registro:', error.message);
      throw error;
    }
  }

  @Public()
  @Post('login')
  async login(@Body() authDto: LoginDto) {
    try {
      const result = await this.authService.login(authDto);
      return { message: "Bienvenido", result: result };
    } catch (error) {
      console.error('Error en el login:', error.message);
      throw error;
    }
  }

  @Public()
  @Post('iniciar-recuperacion')
  async iniciarRecuperacionContrasena(
    @Body('typeDocument') typeDocument: string,
    @Body('numberDocument') numberDocument: string
  ) {
    try {
      const userId = await this.authService.iniciarRecuperacionContrasena(typeDocument, numberDocument);
      console.log(userId);
      return { 
        message: 'Se ha enviado un correo con las instrucciones para recuperar la contraseña',
        userId: userId,
      };
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error.message);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Usuario no encontrado.');
      } else if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException('Error al procesar la solicitud.');
      } else {
        throw new UnauthorizedException('No se pudo iniciar el proceso de recuperación de contraseña.');
      }
    }
  }    
  @Public()
  @Post('reset-password')
  async resetearContrasena(
    @Body('userId') userId: string,
    @Body('code') code: string,
    @Body('nuevaContrasena') nuevaContrasena: string
  ): Promise<{ message: string }> {
    await this.authService.resetearContrasena(userId, code, nuevaContrasena);
    return { message: 'Contraseña actualizada correctamente' };
  }
  @Public()
  @Post('verify-code')
  async verificarCodigo(
    @Body('userId') userId: string,
    @Body('code') code: string,

  ) {
    try {
      const isValid = await this.authService.verificarCodigoRecuperacion(userId, code);
      return { isValid };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException('Error al verificar el código');
    }
  }

@Post('enviar-codigo')
@HttpCode(HttpStatus.OK)
@Public()
async enviarCodigo(@Body() body: { userId: string; method: string }) {
  try {
    const success = await this.authService.enviarCodigoRecuperacion(body.userId, body.method);
    if (success) {
      return { message: 'Código de recuperación enviado exitosamente' };
    } else {
      throw new BadRequestException('Error al enviar el código de recuperación');
    }
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (error instanceof UnauthorizedException) {
      throw new UnauthorizedException(error.message);
    }
    throw new BadRequestException(error.message);
  }
}
}