import { isRecord, jsonType, getDeep, setDeep, unsetDeep } from './helpers';

describe('isRecord', () => {
  it('returns whether or not something is a record (not including arrays)', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('str')).toBe(false);
  });
});

describe('jsonType', () => {
  it('is like typeof but with array and null included', () => {
    expect(jsonType(null)).toBe('null');
    expect(jsonType(undefined)).toBe('undefined');
    expect(jsonType({})).toBe('object');
    expect(jsonType([])).toBe('array');
    expect(jsonType('str')).toBe('string');
  });
});

describe('getInObject', () => {
  it('reaches into objects and returns the values at that path', () => {
    expect(
      getDeep({
        input: { foo: { bar: 'baz' } },
        path: ['foo', 'bar'],
      }),
    ).toBe('baz');
  });

  it("returns undefined if it hits a path that doesn't exist", () => {
    expect(
      getDeep({
        input: { foo: 'bar' },
        path: ['foo', 'this', 'no', 'exist'],
      }),
    ).toBe(undefined);
  });

  it('returns undefined if it hits a path hit null', () => {
    expect(
      getDeep({
        input: { foo: null },
        path: ['foo', 'this', 'no', 'exist'],
      }),
    ).toBe(undefined);
  });
});

describe('setInObject', () => {
  it('sets a value deep inside of an object given a path and a value', () => {
    expect(
      setDeep({
        input: { foo: { bar: 'baz' } },
        path: ['foo', 'beep'],
        value: 'boop',
      }),
    ).toEqual({
      foo: { bar: 'baz', beep: 'boop' },
    });
  });

  it('sets a value deep inside of an array given a path and a value', () => {
    expect(
      setDeep({
        input: {
          foo: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
        },
        path: ['foo', 1, 'extra'],
        value: true,
      }),
    ).toEqual({
      foo: [{ name: 'one' }, { extra: true, name: 'two' }, { name: 'three' }],
    });
  });

  it("creates a new array in an object if it doesn't exists", () => {
    expect(
      setDeep({
        input: { foo: { bar: 'baz' }, hello: 'world' },
        path: ['foo', 'newArray', 1, 'newObjectInArray'],
        value: true,
      }),
    ).toEqual({
      foo: {
        bar: 'baz',
        newArray: [null, { newObjectInArray: true }],
      },
      hello: 'world',
    });
  });

  it("will augment new array values (filling with null) if the path doesn't exist", () => {
    expect(
      setDeep({
        input: { foo: { arr: ['a', 'b'] } },
        path: ['foo', 'arr', 4],
        value: 'e',
      }),
    ).toEqual({
      foo: {
        arr: ['a', 'b', null, null, 'e'],
      },
    });
  });
});

describe('unsetDeep', () => {
  it('unsets values deep inside of objects', () => {
    expect(
      unsetDeep({
        input: { foo: { bar: { baz: 'value', stays: true } } },
        path: ['foo', 'bar', 'baz'],
      }),
    ).toEqual({
      foo: { bar: { stays: true } },
    });
  });

  it('unsets values deep inside of arrays', () => {
    expect(
      unsetDeep({
        input: {
          foo: { bar: { myArray: [{ value: 'one' }, { value: 'two' }] } },
        },
        path: ['foo', 'bar', 'myArray', 0],
      }),
    ).toEqual({
      foo: { bar: { myArray: [{ value: 'two' }] } },
    });
  });
});
