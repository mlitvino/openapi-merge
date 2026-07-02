import type { MergeContext } from './types.js';

export const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

export function createContext(): MergeContext {
  return {
    rawSpecs: [],
    parsedSpecs: [],
  };
}

export function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
  return (
    (typeof value === 'object' || typeof value === 'function')
    && value !== null
    && typeof (value as Promise<T>).then === 'function'
  );
}
