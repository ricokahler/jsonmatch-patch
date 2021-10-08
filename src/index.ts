export type { JSONMatchEntry, MatchOptions } from './match';
export { match } from './match';

export type {
  IncDecOptions,
  InsertOptions,
  SetIfMissingOptions,
  SetOptions,
  UnsetOptions,
} from './patch-operations';
export { dec, inc, insert, set, setIfMissing, unset } from './patch-operations';

export type {
  GetDeepOptions,
  SetDeepOptions,
  UnsetDeepOptions,
} from './helpers';
export { getDeep, setDeep, unsetDeep } from './helpers';
