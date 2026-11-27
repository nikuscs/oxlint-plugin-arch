import type { NamingCaptureOptions } from './naming.types.ts'
import type { OptionsPattern } from './options.types.ts'
import type { SourceIndent } from './source.types.ts'

export interface EffectLayersGroup {
  callees?: string[];
  min?: number;
}

export interface EffectLayersOptions {
  merge?: EffectLayersGroup;
  provide?: EffectLayersGroup;
  indent?: SourceIndent;
}

export interface EffectMergePipeOptions {
  merge?: string[];
  pipe?: string[];
  methods?: string[];
}

export interface EffectValuesFirstOptions {
  builders?: string[];
  pinned?: OptionsPattern;
}

export interface EffectLayerFileOptions {
  layer?: string;
  make?: string;
  prefix?: string;
  suffix?: string;
  builders?: string[];
  layers?: OptionsPattern;
  services?: OptionsPattern;
  constructors?: string[];
}

export interface EffectSchemaFirstRows {
  types?: string[];
  suffix?: string;
}

export type EffectSchemaFirstSection = 'values' | 'interfaces' | 'modules' | 'aliases';

export interface EffectSchemaFirstDerived {
  first?: boolean;
  sorted?: boolean;
}

export interface EffectSchemaFirstOptions {
  member?: string;
  keep?: OptionsPattern;
  allow?: OptionsPattern;
  runtime?: string[];
  rows?: EffectSchemaFirstRows;
  order?: (EffectSchemaFirstSection | EffectSchemaFirstSection[])[];
  derived?: EffectSchemaFirstDerived;
}

export interface EffectYieldNameOptions {
  names?: Record<string, string | string[]>;
  allow?: OptionsPattern;
  message?: string;
}

export interface EffectYieldsFirstOptions {
  allow?: OptionsPattern;
  services?: OptionsPattern;
  message?: string;
}

export interface EffectLayerKeysOptions extends NamingCaptureOptions {
  service: string;
  callees?: string[];
  declaration?: string;
  missing?: 'error' | 'skip';
  message?: string;
}

export interface EffectLayerKeysFrame {
  open: string;
  key?: string;
  members: number;
}

export interface EffectServiceParamsOptions extends NamingCaptureOptions {
  name?: OptionsPattern;
  allow?: OptionsPattern;
  declaration?: string;
  values?: OptionsPattern;
  params?: number;
  message?: string;
}

export interface EffectConfigKeysOptions extends NamingCaptureOptions {
  prefix?: OptionsPattern;
  allow?: string[];
  callees?: string[];
  message?: string;
}
