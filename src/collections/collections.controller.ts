import { Body, Controller, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private service: CollectionsService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(@Body() schema: any) {
    return this.service.createTable(schema);
  }
}
