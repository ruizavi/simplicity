import { Schema } from 'src/types';
import { ZodOptional, ZodString, z } from 'zod';
import { instanceOfTextType } from './instanceOf';

export const schemaTextValidator = (s: Schema, isUpdate: boolean) => {
  if (!instanceOfTextType(s.options)) return;

  let fieldValidator: ZodString | ZodOptional<ZodString> = z
    .string()
    .min(s.options.min)
    .max(s.options.max);

  if (s.options.regex !== undefined)
    fieldValidator = fieldValidator.regex(new RegExp(s.options.regex));

  if (s.required && !isUpdate) {
    fieldValidator = fieldValidator.nonempty();
  } else {
    fieldValidator = fieldValidator.optional();
  }

  return fieldValidator;
};

export const generateSchemaValidator = (
  schema: Schema[],
  isUpdate: boolean,
) => {
  let schemaShape = {};

  schema.forEach((s) => {
    let fieldValidator: unknown;

    if (s.type === 'text') fieldValidator = schemaTextValidator(s, isUpdate);

    schemaShape[s.name] = fieldValidator;
  });

  return z.object(schemaShape);
};
