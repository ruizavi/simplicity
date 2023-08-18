import { DecimalOption, NumberOption, TextOption } from 'src/types';

export function instanceOfFactory<T = unknown>(property: string) {
  return function (object: any): object is T {
    return property in object;
  };
}

export const instanceOfTextType = instanceOfFactory<TextOption>('regex');

export const instanceOfNumberType = instanceOfFactory<NumberOption>('min');

export const instanceOfDecimalType =
  instanceOfFactory<DecimalOption>('decimal');
