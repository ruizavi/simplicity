import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { share } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Collection, Schema } from 'src/types';
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

    if (collection === null)
      throw new HttpException('Collection not exist', HttpStatus.NOT_FOUND);

    return collection;
  }

  async createTable(collection: Collection) {
    const collectionFound = await this.prisma.collection.findFirst({
      where: { name: collection.name },
    });

    if (collectionFound !== null)
      throw new HttpException('Collection already exists', HttpStatus.CONFLICT);

    const columns = assocColumnType(collection.schema);

    const executeRaw = newTableBuild(collection.name, columns);

    const schema = collection.schema.map((s, i) => ({ ...s, id: i + 1 }));

    const [collectionCreated, _] = await this.prisma.$transaction([
      this.prisma.collection.create({
        data: {
          schema: schema as unknown as Prisma.InputJsonValue,
          name: collection.name,
        },
      }),
      this.prisma.$executeRaw(Prisma.sql([executeRaw])),
    ]);

    return collectionCreated;
  }

  async updateTable(collectionId: number, collection: unknown) {
    const previousCollection = await this.prisma.collection.findUniqueOrThrow({
      where: { id: collectionId },
    });

    const prevSchema = previousCollection.schema as unknown as Schema[];

    let schema = collection as Collection;
    // Renombrar tabla
    if (collection['name'] !== previousCollection.name) {
      const query = `ALTER TABLE ${previousCollection.name} RENAME ${collection['name']}`;

      const [response, _] = await this.prisma.$transaction([
        this.prisma.collection.update({
          where: { id: collectionId },
          data: {
            name: collection['name'],
          },
        }),
        this.prisma.$executeRaw(Prisma.sql([query])),
      ]);

      schema = response as unknown as Collection;
    }

    
    // Agregar columnas
    const columnsToAdd = collection['schema']?.filter(
      (c) => c['id'] == undefined,
    );

    if (columnsToAdd.length !== 0) {
      const columns = assocColumnType(columnsToAdd);
      
      const newSchema = collection['schema']?.map((s, i) => ({
        ...s,
        id: i + 1,
      }));
      
      const [collectionUpdated, _] = await this.prisma.$transaction([
        this.prisma.collection.update({
          where: { id: collectionId },
          data: { schema: newSchema },
        }),
        this.prisma.$executeRaw(
          Prisma.sql([
            `ALTER TABLE ${collection['name']} ADD COLUMN ${columns.join(',')}`,
          ]),
          ),
        ]);

        schema = collectionUpdated as unknown as Collection;
    }
    
    // Alterar columnas
    const columnsToRenamed = collection['schema']?.filter((s) =>
    prevSchema.some((p) => s['id'] === p.id && s['name'] !== p.name),
    );
    
    if (columnsToRenamed.length !== 0) {
      const renamedColumns = columnsToRenamed.flatMap((c) => {
        const prev = prevSchema.find((p) => p.id === c['id']);

        return `RENAME COLUMN ${prev.name} TO ${c['name']}`;
      });
      
      const queryToRenamed = `ALTER TABLE ${
        collection['name']
      } ${renamedColumns.join(', ')}`;
      
      const newSchemaRenamedColumns = (
        schema.schema as unknown as Schema[]
      ).map((s) => {
        const newdata = schema.schema.find((n) => s.id === n['id']);
        
        return { ...s, name: newdata?.['name'] };
      });

      const [response, _] = await this.prisma.$transaction([
        this.prisma.collection.update({
          where: { id: collectionId },
          data: {
            schema: newSchemaRenamedColumns as unknown as Prisma.InputJsonArray,
          },
        }),
        this.prisma.$executeRaw(Prisma.sql([queryToRenamed])),
      ]);

      schema = response as unknown as Collection;
    }
 
    // Eliminar columnas
    const deletedColumns = prevSchema.filter((e) =>
      schema.schema.every((v) => v.id !== e.id),
      );
      
      if (deletedColumns.length !== 0) {
        const deleted = deletedColumns.map((d) => `DROP COLUMN ${d.name}`);
        
        const query = `ALTER TABLE ${schema.name} ${deleted.join(', ')}`;
        
        const newSchema = schema.schema
        .filter((s) => deletedColumns.every((f) => f.id !== s.id))
        .map((r, i) => ({ ...r, id: i + 1 }));
        
      const [response, _] = await this.prisma.$transaction([
        this.prisma.collection.update({
          where: { id: collectionId },
          data: {
            schema: newSchema as unknown as Prisma.InputJsonArray,
          },
        }),
        this.prisma.$executeRaw(Prisma.sql([query])),
      ]);

      schema = response as unknown as Collection;
    }

    return schema;
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
