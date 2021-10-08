import { match } from './match';
import { getDeep, setDeep, unsetDeep, isNonNullable } from './helpers';

export interface SetOptions {
  input: unknown;
  pathExpressionValues: Record<string, unknown>;
}

/**
 * Given an input object and a record of path expressions to values, this
 * function will set each match with the given value.
 *
 * ```js
 * const output = set({
 *   input: { name: { first: '', last: '' } },
 *   pathExpressionValues: {
 *     'name.*': 'changed',
 *   },
 * });
 *
 * // { name: { first: 'changed', second: 'changed' } }
 * console.log(output);
 * ```
 */
export function set<R>(options: SetOptions): R;
export function set({ input, pathExpressionValues }: SetOptions): unknown {
  return Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, replacementValue]) =>
      match({
        input: input,
        pathExpression,
      }).map((matchEntry) => ({
        ...matchEntry,
        replacementValue,
      })),
    )
    .reduce(
      (acc, { path, replacementValue }) =>
        setDeep({
          input: acc,
          path,
          value: replacementValue,
        }),
      input,
    );
}

export interface SetIfMissingOptions {
  input: unknown;
  pathExpressionValues: Record<string, unknown>;
}

/**
 * Given an input object and a record of path expressions to values, this
 * function will set each match with the given value if the value at the current
 * path is missing. A missing value is either `null` or `undefined`.
 *
 * ```js
 * const output = setIfMissing({
 *   input: { name: { first: 'same', last: null } },
 *   pathExpressionValues: {
 *     'name.*': 'changed',
 *   },
 * });
 *
 * // { name: { first: 'same', second: 'changed' } }
 * console.log(output);
 * ```
 */
export function setIfMissing<R>(options: SetIfMissingOptions): R;
export function setIfMissing({
  input,
  pathExpressionValues,
}: SetIfMissingOptions): unknown {
  return Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, replacementValue]) => {
      return match({ input, pathExpression }).map((matchEntry) => ({
        ...matchEntry,
        replacementValue,
      }));
    })
    .filter(
      (matchEntry) =>
        matchEntry.value === null || matchEntry.value === undefined,
    )
    .reduce(
      (acc, { path, replacementValue }) =>
        setDeep({
          input: acc,
          path,
          value: replacementValue,
        }),
      input,
    );
}

export interface UnsetOptions {
  input: unknown;
  pathExpressions: string[];
}

/**
 * Given an input object and an array of path expressions, this function will
 * remove each match from the input object.
 *
 * ```js
 * const output = unset({
 *   input: { name: { first: 'one', last: 'two' } },
 *   pathExpressions: ['name.*'],
 * });
 *
 * // { name: { } }
 * console.log(output);
 * ```
 */
export function unset<R>(options: UnsetOptions): R;
export function unset({ input, pathExpressions }: UnsetOptions): unknown {
  return pathExpressions
    .flatMap((pathExpression) => match({ input, pathExpression }))
    .reduce((acc, { path }) => unsetDeep({ input: acc, path }), input);
}

const operations = ['before', 'after', 'replace'] as const;
type Operation = typeof operations[number];
type OperationEntryObject = {
  [P in Operation]: { [K in P]: string };
}[Operation];

export type InsertOptions = {
  input: unknown;
  items: unknown[];
} & OperationEntryObject;

/**
 * Given an input object, a path expression, and an array of items, this
 * function will either insert or replace the matched items.
 *
 * ```js
 * // insert before
 * const output = insert({
 *   input: { some: { array: ['a', 'b', 'c'] } },
 *   before: 'some.array[2]',
 *   items: ['!'],
 * });
 *
 * // { some: { array: ['a', 'b', 'c', '!'] } }
 * console.log(output);
 * ```
 *
 * ```js
 * // append
 * const output = insert({
 *   input: { some: { array: ['a', 'b', 'c'] } },
 *   before: 'some.array[-1]', // negative index for add to the end
 *   items: ['!'],
 * });
 *
 * // { some: { array: ['a', 'b', 'c', '!'] } }
 * console.log(output);
 * ```
 *
 *  * ```js
 * // prepend
 * const output = insert({
 *   input: { some: { array: ['a', 'b', 'c'] } },
 *   before: 'some.array[0]',
 *   items: ['!'],
 * });
 *
 * // { some: { array: ['!', 'a', 'b', 'c'] } }
 * console.log(output);
 * ```
 *
 *  *  * ```js
 * // replace
 * const output = insert({
 *   input: { some: { array: ['a', 'b', 'c'] } },
 *   replace: 'some.array[1]',
 *   items: ['!'],
 * });
 *
 * // { some: { array: ['a', '!', 'c'] } }
 * console.log(output);
 * ```
 */
export function insert<R>(options: InsertOptions): R;
export function insert({
  input,
  items,
  ...restOfInsertOptions
}: InsertOptions) {
  const operation = operations.find((op) => op in restOfInsertOptions);
  if (!operation) return input;

  const pathExpression = (restOfInsertOptions as { [P in Operation]: string })[
    operation
  ];

  interface ArrayMatchEntry {
    array: unknown[];
    pathToArray: Array<string | number>;
    indexes: number[];
  }

  const arrayMatchEntries = Array.from(
    match({ input, pathExpression })
      .map(({ path }) => {
        const index = path[path.length - 1];
        if (typeof index !== 'number') return null;

        const parentPath = path.slice(0, path.length - 1);
        const parent = getDeep({ input, path: parentPath });
        if (!Array.isArray(parent)) return null;

        return {
          array: parent,
          pathToArray: parentPath,
          index,
        };
      })
      .filter(isNonNullable)
      // group all matches by their parent array, aggregating indexes
      .reduce<Map<unknown, ArrayMatchEntry>>((acc, next) => {
        const key = next.array;
        const prev = acc.get(key);

        acc.set(key, {
          array: next.array,
          indexes: [...(prev?.indexes || []), next.index],
          pathToArray: next.pathToArray,
        });

        return acc;
      }, new Map())
      .values(),
  ).map((entry) => ({
    ...entry,
    // ensure sorted
    indexes: entry.indexes.sort(),
  }));

  return arrayMatchEntries.reduce<unknown>(
    (acc, { array, indexes, pathToArray }) => {
      switch (operation) {
        case 'before': {
          const firstIndex = indexes[0];
          const indexBeforeFirstIndex = firstIndex;

          return setDeep({
            input: acc,
            path: pathToArray,
            value: [
              ...array.slice(0, indexBeforeFirstIndex),
              ...items,
              ...array.slice(indexBeforeFirstIndex),
            ],
          });
        }
        case 'after': {
          const lastIndex = indexes[indexes.length - 1] + 1;

          return setDeep({
            input: acc,
            path: pathToArray,
            value: [
              ...array.slice(0, lastIndex),
              ...items,
              ...array.slice(lastIndex),
            ],
          });
        }
        case 'replace': {
          // replace is interesting because the indexes don't have to be
          // consecutive. the behavior is then defined as:
          // 1. delete all matching items in the array
          // 2. insert the rest of the items at the first matching index
          const firstIndex = indexes[0];
          const indexSet = new Set(indexes);

          return setDeep({
            input: acc,
            path: pathToArray,
            value: [
              ...array.slice(0, firstIndex),
              ...items,
              ...array
                .slice(firstIndex)
                .filter((_, index) => !indexSet.has(index + firstIndex)),
            ],
          });
        }
        default: {
          return acc;
        }
      }
    },
    input,
  );
}

export interface IncDecOptions {
  input: unknown;
  pathExpressionValues: Record<string, number>;
}

/**
 * Given an input object and a record of path expressions to numeric values,
 * this function will increment each match with the given value.
 *
 * ```js
 * const output = inc({
 *   input: { foo: { first: 3, second: 4.5 } },
 *   pathExpressionValues: {
 *     'foo.*': 3,
 *   },
 * });
 *
 * // { foo: { first: 6, second: 7.5 } }
 * console.log(output);
 * ```
 */
export function inc<R>(options: IncDecOptions): R;
export function inc({ input, pathExpressionValues }: IncDecOptions) {
  return Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, valueToAdd]) =>
      match({
        input: input,
        pathExpression,
      }).map((matchEntry) => ({
        ...matchEntry,
        valueToAdd,
      })),
    )
    .filter(
      <T extends { value: unknown }>(
        matchEntry: T,
      ): matchEntry is T & { value: number } =>
        typeof matchEntry.value === 'number',
    )
    .reduce(
      (acc, { path, value, valueToAdd }) =>
        setDeep({
          input: acc,
          path,
          value: value + valueToAdd,
        }),
      input,
    );
}

/**
 * Given an input object and a record of path expressions to numeric values,
 * this function will decrement each match with the given value.
 *
 * ```js
 * const output = dec({
 *   input: { foo: { first: 3, second: 4.5 } },
 *   pathExpressionValues: {
 *     'foo.*': 3,
 *   },
 * });
 *
 * // { foo: { first: 0, second: 1.5 } }
 * console.log(output);
 * ```
 */
export function dec<R>(options: IncDecOptions): R;
export function dec({ pathExpressionValues, ...restOfOptions }: IncDecOptions) {
  return inc({
    ...restOfOptions,
    pathExpressionValues: Object.fromEntries(
      Object.entries(pathExpressionValues)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => [key, -value]),
    ),
  });
}
