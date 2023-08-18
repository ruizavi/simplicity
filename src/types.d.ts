export interface TextOption {
  min: number;
  max: number;
  regex?: string;
}

export interface NumberOption {
  min: number;
  max: number;
}

export type DecimalOption = NumberOption & {
  decimal: number;
};

export type OptionsType = TextOption | NumberOption | DecimalOption;

export interface Schema {
  name: string;
  type: 'text' | 'number' | 'decimal';
  options: OptionsType;
  required: boolean;
  unique: boolean;
}

export interface Collection {
  name: string;
  schema: Schema[];
}
