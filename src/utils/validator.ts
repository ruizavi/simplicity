import { ZodOptional, ZodString, z } from 'zod';

export const generateSchemaValidator = (schema: unknown[]) => {
  let schemaShape = {};

  schema.forEach((s) => {
    if (s['type'] === 'text') {
      let fieldValidator: ZodString | ZodOptional<ZodString> = z.string();

      if (s['options']['min'] !== undefined)
        fieldValidator = fieldValidator.min(s['options']['min']);

      if (s['options']['max'] !== undefined)
        fieldValidator = fieldValidator.max(s['options']['max']);

      if (s['options']['regex'] !== undefined)
        fieldValidator = fieldValidator.regex(
          new RegExp(s['options']['regex']),
        );

      if (s['options']['required']) {
        fieldValidator = fieldValidator.nonempty();
      } else {
        fieldValidator = fieldValidator.optional();
      }

      schemaShape[s['name']] = fieldValidator;
    }
  });

  return z.object(schemaShape);
};
