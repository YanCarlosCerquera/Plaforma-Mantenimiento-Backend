import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre del usuario' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
