import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { RolModule } from 'src/Segurity/rol/rol.module';
import { jwtConstant } from './auth.jwtConstants';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth/auth.guard';
import { RoleGuard } from './guards/role/role.guard';

@Module({
  imports: [
    UsersModule,
    RolModule,
    JwtModule.register({
      secret: jwtConstant.secret,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, 
    {
      provide: APP_GUARD,
      useClass: AuthGuard, 
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard, 
    },
  ],
})
export class AuthModule {}