import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CollectionsModule } from './collections/collections.module';

@Module({
  imports: [PrismaModule, CollectionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
