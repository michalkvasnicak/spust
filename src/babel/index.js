'use strict';

const env = process.env.BABEL_ENV || process.env.NODE_ENV;

const plugins = [
  [require.resolve('react-loadable/babel'), { webpack: true, babel: true }],
  require.resolve('babel-plugin-transform-class-properties'),
  [
    require.resolve('babel-plugin-transform-object-rest-spread'),
    {
      useBuiltIns: true,
    },
  ],
  [
    require.resolve('babel-plugin-transform-react-jsx'),
    {
      useBuiltIns: true,
    },
  ],
  [
    require.resolve('babel-plugin-transform-runtime'),
    {
      helpers: false,
      polyfill: false,
      regenerator: true,
    },
  ],
  require.resolve('babel-plugin-idx'),
  require.resolve('babel-plugin-syntax-dynamic-import'),
];

if (env === 'development' || env === 'test') {
  const devPlugins = [
    require.resolve('babel-plugin-transform-react-jsx-source'),
    require.resolve('babel-plugin-transform-react-jsx-self'),
  ];

  plugins.push(...devPlugins);
}

const clientEnvPresets = [
  [
    require.resolve('babel-preset-env'),
    {
      modules: false,
      targets: {
        ie: 10,
        // We currently minify with uglify
        // Remove after https://github.com/mishoo/UglifyJS2/issues/448
        uglify: true,
      },
      // Disable polyfill transforms
      useBuiltIns: false,
      // Do not transform modules to CJS
      modules: false,
    },
  ],
];

const serverEnvPresets = [
  [
    require.resolve('babel-preset-env'),
    {
      modules: false,
      targets: {
        node: 'current',
      },
      // Disable polyfill transforms
      useBuiltIns: false,
      // Do not transform modules to CJS
      modules: false,
    },
  ],
];

const serverPlugins = [require.resolve('babel-plugin-dynamic-import-node')];

module.exports = {
  env: {
    client: {
      presets: [require.resolve('babel-preset-react'), ...clientEnvPresets],
      plugins,
    },
    server: {
      presets: [require.resolve('babel-preset-react'), ...serverEnvPresets],
      plugins: [...plugins, ...serverPlugins],
    },
  },
};
