export interface GetDeepOptions {
  input: unknown;
  path: Array<string | number>;
}

/**
 * Gets a value deep inside of an object given a path. If the path does not
 * exist in the object, `undefined` will be returned
 */
export function getDeep<R>(options: GetDeepOptions): R;
export function getDeep({ input, path }: GetDeepOptions): unknown {
  const [currentSegment, ...restOfPath] = path;
  if (currentSegment === undefined) return input;
  if (typeof input !== 'object') return undefined;
  if (input === null) return undefined;

  const nestedInput = (input as Record<string, unknown>)[currentSegment];

  return getDeep({
    input: nestedInput,
    path: restOfPath,
  });
}

export interface SetDeepOptions {
  input: unknown;
  path: Array<string | number>;
  value: unknown;
}

/**
 * Sets a value deep inside of an object given a path. If the path does not
 * exist in the object, it will be created if the path does not contain an array
 * index
 */
export function setDeep<R>(options: SetDeepOptions): R;
export function setDeep({ input, path, value }: SetDeepOptions): unknown {
  const [currentSegment, ...restOfPath] = path;
  if (currentSegment === undefined) return value;

  if (typeof input !== 'object' || input === null) {
    if (typeof currentSegment === 'string') {
      return {
        [currentSegment]: setDeep({
          input: null,
          path: restOfPath,
          value,
        }),
      };
    }

    if (typeof currentSegment === 'number' && currentSegment >= 0) {
      return [
        // fill the start of this array with null values
        ...Array.from({
          length: currentSegment,
        }).fill(null),
        // then set the index of the currentSegment with the new value
        setDeep({
          input: null,
          path: restOfPath,
          value,
        }),
      ];
    }

    // shouldn't really happen unless invalid input is given
    return input;
  }

  if (Array.isArray(input)) {
    if (
      typeof currentSegment === 'number' &&
      currentSegment >= 0 &&
      currentSegment in input
    ) {
      return input.map((nestedInput, i) =>
        currentSegment === i
          ? setDeep({
              input: nestedInput,
              path: restOfPath,
              value,
            })
          : nestedInput,
      );
    }

    if (typeof currentSegment === 'number' && currentSegment >= 0) {
      return [
        // copy the values from the current array
        ...input,
        // then fill with null values up until the `currentSegment` index
        ...Array.from({
          length: currentSegment - input.length,
        }).fill(null),
        // then set the index of the currentSegment with the new value
        setDeep({
          input: null,
          path: restOfPath,
          value,
        }),
      ];
    }

    // shouldn't really happen unless invalid input is given
    return input;
  }

  // the current segment exists in the object so reuse it
  if (currentSegment in input) {
    return Object.fromEntries(
      Object.entries(input).map(([key, nestedInput]) =>
        key === currentSegment
          ? [key, setDeep({ input: nestedInput, path: restOfPath, value })]
          : [key, nestedInput],
      ),
    );
  }

  // the current segment doesn't exist in the object so create the path
  return {
    ...input,
    [currentSegment]: setDeep({
      input: null,
      path: restOfPath,
      value,
    }),
  };
}

export interface UnsetDeepOptions {
  input: unknown;
  path: Array<string | number>;
}

/**
 * Given an object and an exact path as an array, this unsets the value at the
 * given path.
 */
export function unsetDeep<R>(options: UnsetDeepOptions): R;
export function unsetDeep({ input, path }: UnsetDeepOptions): unknown {
  const [currentSegment, ...restOfPath] = path;

  if (currentSegment === undefined) return input;
  if (typeof input !== 'object') return input;
  if (input === null) return input;
  if (!(currentSegment in input)) return input;

  if (!restOfPath.length) {
    if (Array.isArray(input)) {
      return input.filter((_nestedInput, index) => index !== currentSegment);
    }
    return Object.fromEntries(
      Object.entries(input).filter(
        ([key]) => key !== currentSegment.toString(),
      ),
    );
  }

  if (Array.isArray(input)) {
    return input.map((nestedInput, index) =>
      index === currentSegment
        ? unsetDeep({ input: nestedInput, path: restOfPath })
        : nestedInput,
    );
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) =>
      key === currentSegment
        ? [key, unsetDeep({ input: value, path: restOfPath })]
        : [key, value],
    ),
  );
}

export function isRecord(
  maybeRecord: unknown,
): maybeRecord is Record<string, unknown> {
  return (
    typeof maybeRecord === 'object' &&
    maybeRecord !== null &&
    !Array.isArray(maybeRecord)
  );
}

export function isNonNullable<T>(t: T): t is NonNullable<T> {
  return t !== null && t !== undefined;
}

export function jsonType(obj: unknown) {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) return 'array';
  return typeof obj as 'object' | 'number' | 'string' | 'boolean';
}
