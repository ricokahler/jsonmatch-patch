module.exports = (api) => {
  switch (api.env()) {
    case 'cjs': {
      const targets = 'maintained node versions';
      return {
        targets,
        presets: [
          ['@babel/preset-env', { targets }],
          '@babel/preset-typescript',
        ],
        plugins: [
          '@babel/transform-runtime',
          ['polyfill-corejs3', { method: 'usage-pure' }],
        ],
      };
    }
    default: {
      return {
        presets: [
          ['@babel/preset-env', { targets: 'maintained node versions' }],
          '@babel/preset-typescript',
        ],
      };
    }
  }
};
