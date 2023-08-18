import { Schema } from 'src/types';
import {
  instanceOfDecimalType,
  instanceOfNumberType,
  instanceOfTextType,
} from './instanceOf';
import { Collection, Prisma } from '@prisma/client';
import { generateSchemaValidator } from './validator';
import { HttpException, HttpStatus } from '@nestjs/common';
import { format } from 'date-fns';

export function assocColumnType(schema: Schema[]) {
  return schema.map((s) => {
    let type = '';

    if (s.type === 'text' && instanceOfTextType(s.options)) {
      type = `VARCHAR(${s.options.max || 255})`;
    }

    if (s.type === 'number' && instanceOfNumberType(s.options)) {
      type = `INT`;
    }

    if (s.type === 'decimal' && instanceOfDecimalType(s.options)) {
      type = `FLOAT`;
    }

    if (s.required) type += ' NOT NULL';

    if (s.unique) type += ' UNIQUE';

    return `${s.name} ${type}`;
  });
}

export function newTableBuild(name: string, columns: string[]) {
  return `CREATE TABLE ${name} (collectionId INT NOT NULL, id INT AUTO_INCREMENT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted TIMESTAMP, ${columns.join(
    ',',
  )}, 
  PRIMARY KEY (id),FOREIGN KEY (collectionId) REFERENCES _collections(id));`;
}

export function getRecordsBuild(collection: Collection) {
  const schema = collection.schema as Prisma.JsonArray;

  const columns = schema.map((s) => `${collection}.${s['name']}`);

  return `SELECT collectionId, id, created, updated, deleted, ${columns.join(
    ',',
  )} FROM ${collection.name} AS ${collection}`;
}

export function getRecordBuild(collection: Collection, id: number) {
  const schema = collection.schema as Prisma.JsonArray;

  const columns = schema.map((s) => `${collection}.${s['name']}`);

  return `SELECT collectionId, id, created, updated, deleted, ${columns.join(
    ',',
  )} FROM ${collection.name} AS ${collection} WHERE ${
    collection.name
  }.id = ${id}`;
}

export function createRecordBuild(collection: Collection, fields: unknown) {
  const schema = collection.schema as unknown as Schema[];

  const validate = generateSchemaValidator(schema, false);
  try {
    const data = validate.parse(fields);

    const columns = Object.keys(data);

    const values = Object.values(data).map((v) => {
      if (typeof v === 'number') return v;

      return `'${v}'`;
    });

    return `
    INSERT INTO ${collection.name} (collectionId, ${columns.join(',')})
    VALUES
    (${collection.id},${values.join(',')})`;
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export function getLastRecordBuild(collection: Collection) {
  return `SELECT * FROM ${collection.name} ORDER BY created DESC LIMIT 1`;
}

export function deleteRecordBuild(collection: Collection, id: number) {
  return `UPDATE ${collection.name} as ${
    collection.name
  } SET deleted = '${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}' WHERE ${
    collection.name
  }.id = ${id}`;
}

export function updateRecordBuild(
  collection: Collection,
  id: number,
  fields: unknown,
) {
  const schema = collection.schema as unknown as Schema[];

  const validator = generateSchemaValidator(schema, true);

  try {
    const data = validator.parse(fields);

    const fieldsUpdated = Object.keys(data).map((key) => {
      return typeof data[key] === 'number'
        ? `${collection.name}.${key} = ${data[key]}`
        : `${collection.name}.${key} = '${data[key]}'`;
    });

    return `
    UPDATE ${collection.name} as ${collection.name} SET ${fieldsUpdated.join(
      ', ',
    )}, ${collection.name}.updated = '${format(
      new Date(),
      'yyyy-MM-dd HH:mm:ss',
    )}' WHERE ${collection.name}.id = ${id}`;
  } catch (error) {
    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
