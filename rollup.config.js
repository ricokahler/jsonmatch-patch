import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.ts', '.js'];
const targets = 'defaults and not IE 11';

const config = {
  input: './src/index.ts',
  output: {
    file: './dist/index.module.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve({ extensions, modulesOnly: true }),
    babel({
      targets,
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-env', { targets }], '@babel/preset-typescript'],
      plugins: [
        '@babel/plugin-transform-runtime',
        ['polyfill-corejs3', { method: 'usage-pure' }],
        [
          // for sanity compat
          '@babel/plugin-proposal-object-rest-spread',
          { loose: true, useBuiltIns: true },
        ],
      ],
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
  external: ['@ricokahler/jsonmatch-js', /^@babel\/runtime/, /^core-js-pure/],
};

export default config;
