import { z } from "zod";

export const generateSchemaValidator = (schema: unknown[]) => {
  let schemaShape = {};

  schema.forEach((s) => {
    if (s['type'] === 'text') {
      let fieldValidator = z.string();
      if (s['options']['min'] !== undefined)
        fieldValidator = fieldValidator.min(s['options']['min']);

      if (s['options']['max'] !== undefined)
        fieldValidator = fieldValidator.max(s['options']['max']);

      if (s['options']['required'] !== undefined)
        fieldValidator = fieldValidator.nonempty();

      schemaShape[s['name']] = fieldValidator;
    }
  });

  return z.object(schemaShape);
};
