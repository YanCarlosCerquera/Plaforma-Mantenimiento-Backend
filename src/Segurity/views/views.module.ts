import { Module } from '@nestjs/common';
import { ViewsService } from './views.service';
import { ViewsController } from './views.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemaView, View } from './entities/view.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: View.name, schema: SchemaView}])],
  controllers: [ViewsController],
  providers: [ViewsService],
  exports: [ViewsService],
})
export class ViewsModule {}
