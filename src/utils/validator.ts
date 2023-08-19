import { Schema } from 'src/types';
import { ZodNumber, ZodOptional, ZodString, z } from 'zod';
import { instanceOfNumberType, instanceOfTextType } from './instanceOf';

export const schemaTextValidator = (s: Schema, isUpdate: boolean) => {
  if (!instanceOfTextType(s.options)) return;

  let fieldValidator: ZodString | ZodOptional<ZodString> = z
    .string()
    .min(s.options.min)
    .max(s.options.max);

  if (s.options.regex !== null)
    fieldValidator = fieldValidator.regex(new RegExp(s.options.regex));

  if (s.required && !isUpdate) {
    fieldValidator = fieldValidator.nonempty();
  } else {
    console;
    fieldValidator = fieldValidator.optional();
  }

  return fieldValidator;
};

export const schemaNumberValidator = (s: Schema, isUpdate: boolean) => {
  if (!instanceOfNumberType(s.options)) return;

  let fieldValidator: ZodNumber | ZodOptional<ZodNumber> = z
    .number()
    .int()
    .min(s.options.min)
    .max(s.options.max);

  if (isUpdate) {
    fieldValidator = fieldValidator.optional();
  }

  return fieldValidator;
};

export const generateSchemaValidator = (
  schema: Schema[],
  isUpdate: boolean,
) => {
  let schemaShape = {};

  for (let s of schema) {
    let fieldValidator: unknown;

    if (s.type === 'text') fieldValidator = schemaTextValidator(s, isUpdate);
    if (s.type === 'number')
      fieldValidator = schemaNumberValidator(s, isUpdate);

    schemaShape[s.name] = fieldValidator;
  }

  return z.object(schemaShape);
};
