import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/Login';
import { log } from 'console';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() authDto: LoginDto) {
    try{
      const resul =  this.authService.login(authDto);

return {messaje :"Bienvido pepeito" , resul}
    } catch(error){

    }
  }

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

  @Post('reset-password')
  async resetearContrasena(
    @Body('token') token: string,
    @Body('nuevaContrasena') nuevaContrasena: string
  ): Promise<void> {
    console.log('Token recibido:', token); 
    await this.authService.resetearContrasena(token, nuevaContrasena);
  }
}