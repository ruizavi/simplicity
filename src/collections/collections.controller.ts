import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { Collection, Schema } from 'src/types';

@Controller('collections')
export class CollectionsController {
  constructor(private service: CollectionsService) {}

  @Post()
  async create(@Body() schema: Collection) {
    return this.service.createTable(schema);
  }

  @Get(':collection/records')
  async getRecords(@Param('collection') collection: string) {
    return this.service.getRecords(collection);
  }

  @Get(':collection/records/:id')
  async getRecord(
    @Param('collection') collection: string,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.service.getRecord(collection, id);
  }

  @Post(':collection/records')
  async createRecords(
    @Param('collection') collection: string,
    @Body() fields: unknown,
  ) {
    return this.service.createRecord(collection, fields);
  }

  @Delete(':collection/records/:id')
  async deleteRecord(
    @Param('collection') collection: string,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.service.deleteRecord(collection, id);
  }

  @Put(':collection/records/:id')
  async updateRecord(
    @Param('collection') collection: string,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() fields: unknown,
  ) {
    return this.service.updateRecord(collection, id, fields);
  }
}
