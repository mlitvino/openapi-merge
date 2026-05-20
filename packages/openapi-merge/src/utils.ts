import { MergeContext } from "./types";

export function createContext(): MergeContext {
  return {
    rawSpecs: [],
    parsedSpecs: [],
  };
}

export function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
  return typeof (value as Promise<T>).then === 'function';
}
