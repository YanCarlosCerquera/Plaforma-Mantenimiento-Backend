import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/Login';
import { log } from 'console';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body() authDto: LoginDto) {
    try {
      const resul = await this.authService.login(authDto);
      return { messaje: "Bienvenido pepeito", resul: resul }
    } catch (error) {

    }
  }

  @Public()
  @Post('iniciar-recuperacion')
  async iniciarRecuperacionContrasena(
    @Body('typeDocument') typeDocument: string,
    @Body('numberDocument') numberDocument: string
  ) {
    try {
      await this.authService.iniciarRecuperacionContrasena(typeDocument, numberDocument);
      return { mensaje: 'Se ha enviado un correo con las instrucciones para recuperar la contraseña' };
    } catch (error) {
      throw new UnauthorizedException('No se pudo iniciar el proceso de recuperación de contraseña');
    }
  }

  @Public()
  @Post('reset-password')
  async resetearContrasena(
    @Body('userId') userId: string,
    @Body('nuevaContrasena') nuevaContrasena: string
  ): Promise<{ mensaje: string }> {
    await this.authService.resetearContrasena(userId, nuevaContrasena);
    return { mensaje: 'Contraseña actualizada correctamente' };
  
}
}