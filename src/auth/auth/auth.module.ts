import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { RolModule } from 'src/security/rol/rol.module';
import { jwtConstant } from './auth.jwtConstants';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth/auth.guard';
import { RoleGuard } from './guards/role/role.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordResetToken, PasswordResetTokenSchema } from './PasswordResetToken';
import { WssModule } from 'src/maintenance/application-maintenance/wss.module';

@Module({
  imports: [
    UsersModule,
    RolModule,
   WssModule,
   
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