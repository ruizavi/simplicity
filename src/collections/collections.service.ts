import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createTable(schema: any) {
    const collection = await this.prisma.collection.findMany({
      where: { name: schema.name as string },
    });

    if (collection.length !== 0)
      throw new HttpException('Already exist collection', HttpStatus.CONFLICT);

    const columns = [];

    schema.schema.forEach((s: any) => {
      let type = '';

      if (s.type === 'text') {
        type = `VARCHAR(${s.options?.max || 255})`;
      } else if (s.type === 'number') {
        type = s.options.decimal === 0 ? 'INT' : `FLOAT`;
      }

      if (s.options.required) type += ' NOT NULL';

      if (s.options.unique) type += ' UNIQUE';

      columns.push(`${s.name} ${type}`);
    });

    const query = `
    CREATE TABLE ${schema.name} (
      collectionId INT,
      id INT AUTO_INCREMENT, 
      created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ${columns.join(',\n')},
      PRIMARY KEY (id),
      FOREIGN KEY (collectionId) REFERENCES _collections(id)
      );
      `;

    await this.prisma.$transaction([
      this.prisma.collection.create({
        data: { schema: schema.schema, name: schema.name },
      }),
      this.prisma.$executeRaw(Prisma.sql([query])),
    ]);
  }

  async getRecords(collection: string) {
    const collectionFound = await this.prisma.collection.findUnique({
      where: { name: collection },
    });

    if (!collectionFound)
      throw new HttpException('No existe perro', HttpStatus.BAD_REQUEST);

    if (
      typeof collectionFound.schema === 'object' &&
      Array.isArray(collectionFound.schema)
    ) {
      const schema = collectionFound.schema.map(
        (s) => `${collection}.${s['name']}`,
      );

      const query = `SELECT 
      collectionId, id, created, updated, 
      ${schema.join(',')} 
      FROM ${collectionFound.name} AS ${collection}`;

      return await this.prisma.$queryRaw(Prisma.sql([query]));
    }

    return 'adios';
  }
}
