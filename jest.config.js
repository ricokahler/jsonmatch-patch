/**
 * @type {import('@jest/types').Config.ProjectConfig}
 */
const jestConfig = {
  snapshotFormat: {
    printBasicPrototype: false,
  },
  testMatch: ['**/src/*.test.ts'],
  coveragePathIgnorePatterns: ['/(lib|dist|node_modules)/'],
  transformIgnorePatterns: ['/(lib|dist|node_modules)/'],
};

module.exports = jestConfig;
