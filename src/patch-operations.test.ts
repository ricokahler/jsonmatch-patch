import { set, setIfMissing, unset, insert, inc, dec } from './patch-operations';

describe('set', () => {
  it('takes in an input and path expression values and sets the value for each expression', () => {
    expect(
      set({
        input: { foo: { bar: 'baz' } },
        pathExpressionValues: {
          'foo.bar': 'changed',
          'foo.someValue': true,
          'foo.someOtherValue': true,
        },
      }),
    ).toEqual({
      foo: {
        bar: 'changed',
        someOtherValue: true,
        someValue: true,
      },
    });
  });
});

describe('setIfMissing', () => {
  it('takes in an input and path expression values and sets the value for each expression if null or undefined', () => {
    expect(
      setIfMissing({
        input: { foo: { bar: 'baz', wasNull: null, wasUndefined: undefined } },
        pathExpressionValues: {
          'foo.bar': "won't change",
          'foo.someValue': true,
          'foo.someOtherValue': true,
          'foo.wasNull': 'changed',
          'foo.wasUndefined': 'changed',
        },
      }),
    ).toEqual({
      foo: {
        bar: 'baz',
        someOtherValue: true,
        someValue: true,
        wasNull: 'changed',
        wasUndefined: 'changed',
      },
    });
  });
});

describe('unset', () => {
  it('takes in an array of path expressions and deletes the matches', () => {
    expect(
      unset({
        input: {
          foo: {
            myArray: [{ value: 'one' }, { value: 'two' }, { value: 'three' }],
            stays: true,
            thisGetsDeleted: 'beep',
          },
        },

        pathExpressions: ['foo.myArray[1]', 'foo.thisGetsDeleted'],
      }),
    ).toEqual({
      foo: {
        myArray: [{ value: 'one' }, { value: 'three' }],
        stays: true,
      },
    });
  });
});

describe('insert', () => {
  it('inserts items before a matching array item expression', () => {
    expect(
      insert({
        input: {
          some: { array: ['a', 'b', 'c'] },
        },
        before: 'some.array[0]',
        items: ['!'],
      }),
    ).toEqual({
      some: { array: ['!', 'a', 'b', 'c'] },
    });
  });

  it('inserts items after a matching array item expression', () => {
    expect(
      insert({
        input: {
          some: { array: ['a', 'b', 'c'] },
        },
        after: 'some.array[0]',
        items: ['!'],
      }),
    ).toEqual({
      some: { array: ['a', '!', 'b', 'c'] },
    });
  });

  it('replaces items matching array item expression', () => {
    expect(
      insert({
        input: {
          some: { array: ['a', 'b', 'c'] },
        },
        replace: 'some.array[0]',
        items: ['!'],
      }),
    ).toEqual({
      some: { array: ['!', 'b', 'c'] },
    });
  });

  it('replaces ranges of items matching array item expression', () => {
    expect(
      insert({
        input: {
          some: { array: ['a', 'b', 'c', 'd', 'e'] },
        },
        replace: 'some.array[2:]',
        items: ['!', '~'],
      }),
    ).toEqual({
      some: { array: ['a', 'b', '!', '~'] },
    });
  });

  it('replaces non-consecutive items matching array item expression', () => {
    expect(
      insert({
        input: {
          some: { array: ['a', 'b', 'c', 'd', 'e', 'f'] },
        },
        replace: 'some.array[1,3,5]',
        items: ['!', '~'],
      }),
    ).toEqual({
      some: { array: ['a', '!', '~', 'c', 'e'] },
    });
  });

  it('works with advanced JSON selections', () => {
    expect(
      insert({
        input: {
          some: { array: [{ key: 'abc-123' }, { key: 'last' }] },
        },

        after: 'some.array[key == "abc-123"]',
        items: ['!', '~'],
      }),
    ).toEqual({
      some: {
        array: [{ key: 'abc-123' }, '!', '~', { key: 'last' }],
      },
    });
  });
});

describe('inc', () => {
  it('takes in an input and path expression values and increments the value at each expression', () => {
    expect(
      inc({
        input: {
          some: {
            foo: 2,
            bar: 8.5,
            baz: -3,
          },
        },
        pathExpressionValues: {
          'some.*': 1,
        },
      }),
    ).toEqual({
      some: { foo: 3, bar: 9.5, baz: -2 },
    });
  });
});

describe('dec', () => {
  it('takes in an input and path expression values and increments the value at each expression', () => {
    expect(
      dec({
        input: {
          some: {
            foo: 2,
            bar: 8.5,
            baz: -3,
          },
        },
        pathExpressionValues: {
          'some.*': 1,
        },
      }),
    ).toEqual({
      some: { foo: 1, bar: 7.5, baz: -4 },
    });
  });
});
