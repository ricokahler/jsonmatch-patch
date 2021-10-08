import { JSONMatch } from '@ricokahler/jsonmatch-js';
import { getDeep, jsonType, isRecord } from './helpers';

export interface JSONMatchEntry {
  value: unknown;
  path: Array<string | number>;
}

const DIFF_MARKER = '___diff-marker___';

export interface MatchOptions {
  input: unknown;
  pathExpression: string;
}

/**
 * Given an object as input and an path expression, this returns a list of
 * `JSONMatchEntry`ies.
 *
 * See [here](https://github.com/sanity-io/go-jsonmatch#examples) for a full
 * list of supported syntax.
 */
export function match({
  input,
  pathExpression,
}: MatchOptions): JSONMatchEntry[] {
  const objWithDiffMarkers = JSONMatch(pathExpression, input, DIFF_MARKER);
  const diffPaths: Array<string | number>[] = [];

  function addDiffMarkerPaths(obj: unknown, path: Array<string | number>) {
    if (obj === DIFF_MARKER) {
      diffPaths.push(path);
      return;
    }

    if (typeof obj !== 'object' || !obj) {
      return;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        addDiffMarkerPaths(obj[i], [...path, i]);
      }
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      addDiffMarkerPaths(value, [...path, key]);
    }
  }

  function diff(
    original: unknown,
    modified: unknown,
    path: Array<string | number>,
  ) {
    if (modified === DIFF_MARKER) {
      diffPaths.push(path);
      return;
    }

    if (original === modified) {
      return;
    }

    if (jsonType(original) !== jsonType(modified)) {
      addDiffMarkerPaths(modified, path);
      return;
    }

    if (Array.isArray(original) && Array.isArray(modified)) {
      const length = Math.max(original.length, modified.length);
      for (let i = 0; i < length; i++) {
        diff(original[i], modified[i], [...path, i]);
      }
      return;
    }

    if (isRecord(original) && isRecord(modified)) {
      const keys = new Set([
        ...Object.keys(original),
        ...Object.keys(modified),
      ]);

      for (const key of keys) {
        diff(original[key], modified[key], [...path, key]);
      }
      return;
    }

    // TODO: remove this (shouldn't happen but making sure)
    console.log('got here :(', { original, modified });
  }

  diff(input, objWithDiffMarkers, []);

  return diffPaths.map((path) => ({
    path,
    value: getDeep({ input, path }),
  }));
}
