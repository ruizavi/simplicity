import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  generateSchemaCreatValidator,
  generateSchemaUpdateValidator,
} from 'src/utils/validator';
import { format } from 'date-fns';
import { Collection } from 'src/types';
import {
  assocColumnType,
  createRecordBuild,
  deleteRecordBuild,
  getLastRecordBuild,
  getRecordBuild,
  getRecordsBuild,
  newTableBuild,
  updateRecordBuild,
} from 'src/utils/sql';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  private async findCollection(name: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { name: name },
    });

    if (!collection)
      throw new HttpException('Already exist collection', HttpStatus.CONFLICT);

    return collection;
  }

  async createTable(collection: Collection) {
    await this.findCollection(collection.name);

    const columns = assocColumnType(collection.schema);

    const executeRaw = newTableBuild(collection.name, columns);

    await this.prisma.$transaction([
      this.prisma.collection.create({
        data: {
          schema: collection.schema as unknown as Prisma.InputJsonValue,
          name: collection.name,
        },
      }),
      this.prisma.$executeRaw(Prisma.sql([executeRaw])),
    ]);
  }

  async getRecords(collection: string) {
    const collectionFound = await this.findCollection(collection);

    const query = getRecordsBuild(collectionFound);

    return await this.prisma.$queryRaw(Prisma.sql([query]));
  }

  async getRecord(collection: string, id: number) {
    const collectionFound = await this.findCollection(collection);

    const query = getRecordBuild(collectionFound, id);

    const row = await this.prisma.$queryRaw(Prisma.sql([query]));

    if (Array.isArray(row) && row.length === 0)
      throw new HttpException(
        `Element in ${collection} not found`,
        HttpStatus.NOT_FOUND,
      );

    return row[0];
  }

  async createRecord(collection: string, fields: unknown) {
    const collectionFound = await this.findCollection(collection);

    const execute = createRecordBuild(collectionFound, fields);

    const query = getLastRecordBuild(collectionFound);

    await this.prisma.$executeRaw(Prisma.sql([execute]));

    const row = await this.prisma.$queryRaw(Prisma.sql([query]));

    return row[0];
  }

  async deleteRecord(collection: string, id: number) {
    const collectionFound = await this.findCollection(collection);

    const remove = deleteRecordBuild(collectionFound, id);

    await this.prisma.$executeRaw(Prisma.sql([remove]));

    const query = getRecordBuild(collectionFound, id);

    const row = await this.prisma.$queryRaw(Prisma.sql([query]));

    return row[0];
  }

  async updateRecord(collection: string, id: number, fields: unknown) {
    const collectionFound = await this.findCollection(collection);

    const findRecord = getRecordBuild(collectionFound, id);

    const queryResult = await this.prisma.$queryRaw(Prisma.sql([findRecord]));

    if (Array.isArray(queryResult) && queryResult.length === 0)
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);

    const execute = updateRecordBuild(collectionFound, id, fields);

    await this.prisma.$executeRaw(Prisma.sql([execute]));

    const query = getRecordBuild(collectionFound, id);

    const row = await this.prisma.$queryRaw(Prisma.sql([query]));

    return row[0];
  }
}
