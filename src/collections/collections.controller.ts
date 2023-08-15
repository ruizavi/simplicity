import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private service: CollectionsService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(@Body() schema: any) {
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
    return this.service.getRecord(collection, id)
  }

  @Post(':collection/records')
  async createRecords(
    @Param('collection') collection: string,
    @Body() fields: unknown,
  ) {
    return this.service.createRecord(collection, fields);
  }
}
