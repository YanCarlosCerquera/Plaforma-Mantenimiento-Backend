  import { Module } from '@nestjs/common';
  import { MongooseModule } from '@nestjs/mongoose';
  import { ScheduleModule } from '@nestjs/schedule';
  import { MailerModule } from '@nestjs-modules/mailer';
  import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
  import { join } from 'path';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import { UsersModule } from './users/users.module';
  import { ModulosModule } from './security/modulos/modulos.module';
  import { RolModule } from './security/rol/rol.module';
  import { ViewsModule } from './security/views/views.module';
  import { AuthModule } from './auth/auth/auth.module';
  import { DepartamentsModule } from './parametrization/departaments/departaments.module';
  import { TrainingCentersModule } from './parametrization/training-centers/training-centers.module';
  import { CityModule } from './parametrization/city/city.module';
  import { DependeceModule } from './parametrization/dependece/dependece.module';
  import { CategoriesModule } from './maintenance/categories/categories.module';
  import { AssetsModule } from './maintenance/assets/assets.module';
  import { ApplicationMaintenanceModule } from './maintenance/application-maintenance/application-maintenance.module';
  import { WordOrdenModule } from './maintenance/word_orden/word_orden.module';
  import { MaintenanceModule } from './maintenance/maintenance/maintenance.module';
  import { ActionLogModule } from './parametrization/action-log/action-log.module';
  import { WorkReportModule } from './maintenance/work_report/work_report.module';
  import { HttpModule } from '@nestjs/axios';
  import { WssModule } from './maintenance/application-maintenance/wss.module';
  import { ConfigModule } from './parametrization/config/config.module';
  import { ConfigService } from './parametrization/config/config.service';
import { EnvironmentsModule } from './environments/environments.module';

  @Module({
    imports: [
      ConfigModule,
      MongooseModule.forRoot(process.env.MONGO_URI),
      ScheduleModule.forRoot(),
      MailerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
          const emailConfig = await configService.findEmailConfig();
          return {
            transport: {
              host: emailConfig.host,
              secure: false,
              auth: {
                user: emailConfig.user,
                pass: emailConfig.password,
              },
            },
            defaults: {
              from: `"No Reply" <${emailConfig.defaults}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        },
      }),

      HttpModule,

      // Módulos personalizados
      // Seguridad
      UsersModule,
      ModulosModule,
      RolModule,
      ViewsModule,
      AuthModule,

      // Parametrización
      DepartamentsModule,
      EnvironmentsModule,

      
      TrainingCentersModule,
      CityModule,
      DependeceModule,
      ActionLogModule,

      // Mantenimiento
      CategoriesModule,
      AssetsModule,
      ApplicationMaintenanceModule,
      WordOrdenModule,
      MaintenanceModule,
      WorkReportModule,
      WssModule,
      EnvironmentsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule { }