import { match } from './match';

describe('match', () => {
  it('returns a list of matches with paths from JSONMatch expressions', () => {
    expect(
      match({
        input: { name: { first: 'espen', last: 'knut' } },
        pathExpression: 'name.*',
      }),
    ).toEqual([
      { path: ['name', 'first'], value: 'espen' },
      { path: ['name', 'last'], value: 'knut' },
    ]);
  });

  it('returns paths that were created from a non-existent deep path', () => {
    expect(
      match({
        input: { foo: {} },
        pathExpression: 'foo.this.path.does.not.exist',
      }),
    ).toEqual([
      {
        path: ['foo', 'this', 'path', 'does', 'not', 'exist'],
        value: undefined,
      },
    ]);
  });

  it('matches values within arrays', () => {
    expect(
      match({
        input: {
          myArr: [
            { name: 'one', extra: true },
            { name: 'two', alsoExtra: true },
            { name: 'three' },
          ],
        },
        pathExpression: 'myArr.*.name',
      }),
    ).toEqual([
      { path: ['myArr', 0, 'name'], value: 'one' },
      { path: ['myArr', 1, 'name'], value: 'two' },
      { path: ['myArr', 2, 'name'], value: 'three' },
    ]);
  });

  it('selects the first and second name (union)', () => {
    expect(
      match({
        input: { name: { first: 'one', second: 'two' } },
        pathExpression: 'name[first, second]',
      }),
    ).toEqual([
      { path: ['name', 'first'], value: 'one' },
      { path: ['name', 'second'], value: 'two' },
    ]);
  });

  it('selects an employee from an array based on index', () => {
    expect(
      match({
        input: {
          employees: Array.from(Array(13)).map((_, i) => ({ id: `emp-${i}` })),
        },
        pathExpression: 'employees[5]',
      }),
    ).toEqual([
      {
        path: ['employees', 5],
        value: { id: 'emp-5' },
      },
    ]);
  });

  it('selects a subset of employees from an array according to index', () => {
    expect(
      match({
        input: {
          employees: Array.from(Array(13)).map((_, i) => ({ id: `emp-${i}` })),
        },
        pathExpression: 'employees[1,2,5,9]',
      }),
    ).toEqual([
      { path: ['employees', 1], value: { id: 'emp-1' } },
      { path: ['employees', 2], value: { id: 'emp-2' } },
      { path: ['employees', 5], value: { id: 'emp-5' } },
      { path: ['employees', 9], value: { id: 'emp-9' } },
    ]);
  });

  it('selects employees 1 through 3 using the slice operation', () => {
    expect(
      match({
        input: {
          employees: [
            { id: 'emp-0' },
            { id: 'emp-1' },
            { id: 'emp-2' },
            { id: 'emp-3' },
            { id: 'emp-4' },
          ],
        },
        pathExpression: 'employees[1:3]',
      }),
    ).toEqual([
      { path: ['employees', 1], value: { id: 'emp-1' } },
      { path: ['employees', 2], value: { id: 'emp-2' } },
    ]);
  });

  it('works with unions of two ranges of employees', () => {
    expect(
      match({
        input: {
          employees: Array.from(Array(13)).map((_, i) => ({ id: `emp-${i}` })),
        },
        pathExpression: 'employees[1:3, 9:12]',
      }),
    ).toEqual([
      { path: ['employees', 1], value: { id: 'emp-1' } },
      { path: ['employees', 2], value: { id: 'emp-2' } },
      { path: ['employees', 9], value: { id: 'emp-9' } },
      { path: ['employees', 10], value: { id: 'emp-10' } },
      { path: ['employees', 11], value: { id: 'emp-11' } },
    ]);
  });

  it('works with union of a range and a number of individual indices', () => {
    expect(
      match({
        input: {
          employees: Array.from(Array(13)).map((_, i) => ({ id: `emp-${i}` })),
        },
        pathExpression: 'employees[1:3, 9, 12]',
      }),
    ).toEqual([
      { path: ['employees', 1], value: { id: 'emp-1' } },
      { path: ['employees', 2], value: { id: 'emp-2' } },
      { path: ['employees', 9], value: { id: 'emp-9' } },
      { path: ['employees', 12], value: { id: 'emp-12' } },
    ]);
  });

  it('selects a subset of employees using a filter', () => {
    expect(
      match({
        input: {
          employees: [
            { id: 'emp-0', wage: 100 },
            { id: 'emp-1', wage: 200 },
            { id: 'emp-2', wage: 50000 },
            { id: 'emp-3', wage: 50001 },
            { id: 'emp-4', wage: 90001 },
          ],
        },
        pathExpression: 'employees[wage > 50000]',
      }),
    ).toEqual([
      { path: ['employees', 3], value: { id: 'emp-3', wage: 50001 } },
      { path: ['employees', 4], value: { id: 'emp-4', wage: 90001 } },
    ]);
  });

  it("select a subset of employees filtering based on the existence of the key 'bonus'", () => {
    expect(
      match({
        input: {
          employees: [
            { id: 'emp-0', bonus: true },
            { id: 'emp-1', wage: 200 },
            { id: 'emp-2', bonus: true },
            { id: 'emp-3', wage: 50001 },
            { id: 'emp-4', wage: 90001 },
          ],
        },
        pathExpression: 'employees[bonus?]',
      }),
    ).toEqual([
      { path: ['employees', 0], value: { id: 'emp-0', bonus: true } },
      { path: ['employees', 2], value: { id: 'emp-2', bonus: true } },
    ]);
  });

  it("recursively selects any sub-document under 'some.path' in the document matching the filter", () => {
    expect(
      match({
        input: {
          some: {
            path: {
              foo: { key: '4f5xa', fromFoo: true },
              deeper: { bar: { key: '4f5xa', fromBar: true } },
            },
          },
        },
        pathExpression: 'some.path..[key=="4f5xa"]',
      }),
    ).toEqual([
      {
        path: ['some', 'path', 'foo'],
        value: { key: '4f5xa', fromFoo: true },
      },
      {
        path: ['some', 'path', 'deeper', 'bar'],
        value: { key: '4f5xa', fromBar: true },
      },
    ]);
  });

  it.todo(
    'selects number from an array where the individual numbers match the filter. (@ == this)',
  );

  it.todo('works with unions of completely separate paths');

  it.todo(
    'encloses attribute names in single quotes (where needed), and literal strings in double quotes',
  );

  it.todo(
    'Currently filters in jsonpath2 do not support boolean operations, although , is synonymous with or/||. You could do',
  );

  it.todo(
    'There is no way to express an intersection. The following is invalid syntax, but considered for a future version',
  );

  it.todo(
    'Note: Apparently there is a way to do intersections with the current syntax. You can actually do this: employees[name.first == "John"][name.last == "Smith"]. It looks weird, but it works.',
  );

  it.todo('selects from start of array');

  it.todo('selects through end of array');

  it.todo('selects every element in array');

  it.todo('selects the last element of an array');
});
