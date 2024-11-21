import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulosModule } from './Segurity/modulos/modulos.module';
import { RolModule } from './Segurity/rol/rol.module';
import { ViewsModule } from './Segurity/views/views.module';
import { AuthModule } from './auth/auth/auth.module';
import { DepartamentsModule } from './Parametrization/departaments/departaments.module';
import { TrainingCentersModule } from './parametrization/training-centers/training-centers.module';
import { CityModule } from './Parametrization/city/city.module';
import { DependeceModule } from './Parametrization/dependece/dependece.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { CategoriesModule } from './maintenance/categories/categories.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:4040/sena'),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        secure: false,
        auth: {
          user: 'xzenzi259@gmail.com',
          pass: 'zpbj cngz oxch nthe',
        },
      },
      defaults: {
        from: '"No Reply" <xzenzi259@gmail.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    UsersModule,
    ModulosModule,
    RolModule,
    ViewsModule,
    AuthModule,
    DepartamentsModule,
    TrainingCentersModule,
    CityModule,
    DependeceModule,
    CategoriesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}