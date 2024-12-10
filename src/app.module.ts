  import { Module } from '@nestjs/common';
  import { MongooseModule } from '@nestjs/mongoose';
  import { ScheduleModule } from '@nestjs/schedule';
  import { MailerModule } from '@nestjs-modules/mailer';
  import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
  import { join } from 'path';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import { UsersModule } from './users/users.module';
  import { ModulosModule } from './Segurity/modulos/modulos.module';
  import { RolModule } from './Segurity/rol/rol.module';
  import { ViewsModule } from './Segurity/views/views.module';
  import { AuthModule } from './auth/auth/auth.module';
  import { DepartamentsModule } from './Parametrization/departaments/departaments.module';
  import { TrainingCentersModule } from './parametrization/training-centers/training-centers.module';
  import { CityModule } from './Parametrization/city/city.module';
  import { DependeceModule } from './Parametrization/dependece/dependece.module';
  import { CategoriesModule } from './maintenance/categories/categories.module';
  import { AssetsModule } from './Maintenance/assets/assets.module';
  import { ApplicationMaintenanceModule } from './Maintenance/application-maintenance/application-maintenance.module';
  import { WordOrdenModule } from './Maintenance/word_orden/word_orden.module';
  import { MaintenanceModule } from './Maintenance/maintenance/maintenance.module';
  import { ActionLogModule } from './parametrization/action-log/action-log.module';
  import { WorkReportModule } from './Maintenance/work_report/work_report.module';
  import { SmsModule } from './Maintenance/application-maintenance/sms.module';
  import { InfobipService } from './Maintenance/application-maintenance/sms.service';
  import { HttpModule } from '@nestjs/axios';
  import { WssModule } from './Maintenance/application-maintenance/wss.module';
  import { ConfigModule } from './Parametrization/config/config.module';
  import { ConfigService } from './Parametrization/config/config.service';

  @Module({
    imports: [
      ConfigModule,
      MongooseModule.forRoot('mongodb://localhost:27017/sena'),
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
      SmsModule,
      WssModule,
    ],
    controllers: [AppController],
    providers: [AppService, InfobipService],
  })
  export class AppModule { }