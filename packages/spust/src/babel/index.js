'use strict';

const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const useBabili = !!parseInt(process.env.SPUST_USE_BABILI || '0', 10);

let supportReactLoadable = false;
let supportStyledComponents = false;

// detect if we have react-loadable, babel-plugin-import-inspector and import-inspector
// if one of them is missing, throw an error, if all of them are missing, user doesn't want
// to use it
let reactLoadableAvailable = false;
let importInspectorAvailable = false;
let babelImportInspectorAvailable = false;

// detect if we have styled-components and babel-plugin-styled-components
// if one of them is missing, throw an error
let styledComponentsAvailable = false;
let babelStyledComponentsAvailable = false;

try {
  require.resolve('react-loadable');
  reactLoadableAvailable = true;
  require.resolve('babel-plugin-import-inspector');
  babelImportInspectorAvailable = true;
  require.resolve('import-inspector');
  importInspectorAvailable = true;
  supportReactLoadable = true;
} catch (e) {
  // do not throw if all of them are missing
  if (
    !supportReactLoadable &&
    (reactLoadableAvailable || importInspectorAvailable || babelImportInspectorAvailable)
  ) {
    throw new Error(
      `
  Please install react-loadable, babel-plugin-import-inspector and import-inspector.
  You have to provide all of these dependencies in order to make it work correctly.
    `,
    );
  }
}

try {
  require.resolve('styled-components');
  styledComponentsAvailable = true;
  require.resolve('babel-plugin-styled-components');
  babelStyledComponentsAvailable = true;
  supportStyledComponents = true;
} catch (e) {
  if (!supportStyledComponents && (styledComponentsAvailable || babelStyledComponentsAvailable)) {
    throw new Error(
      `
  Please install styled-components and babel-plugin-styled-components.
  You have to provide both in order to support styled-components v2.
    `,
    );
  }
}

const plugins = [
  supportReactLoadable
    ? [
        require.resolve('babel-plugin-import-inspector'),
        {
          serverSideRequirePath: true,
          webpackRequireWeakId: true,
        },
      ]
    : null,
  supportStyledComponents
    ? [
        require.resolve('babel-plugin-styled-components'),
        { displayName: env === 'test' || env === 'development' },
      ]
    : null,
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
].filter(Boolean);

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
      targets: {
        ...(useBabili ? { browsers: '> 2%' } : {}),
        ...(!useBabili
          ? {
              ie: 10,
              // We currently minify with uglify
              // Remove after https://github.com/mishoo/UglifyJS2/issues/448
              uglify: true,
            }
          : {}),
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
      targets: {
        node: 'current',
      },
      // Disable polyfill transforms
      useBuiltIns: false,
      // Do not transform modules to CJS in non test env
      modules: env === 'test' ? undefined : false,
    },
  ],
];

const serverPlugins = [require.resolve('babel-plugin-dynamic-import-node')];

module.exports = {
  env: {
    client: {
      presets: [require.resolve('babel-preset-react'), ...clientEnvPresets],
      plugins: [
        ...plugins,
        [require.resolve('babel-plugin-transform-regenerator'), { async: false }],
      ],
    },
    server: {
      presets: [require.resolve('babel-preset-react'), ...serverEnvPresets],
      plugins: [...plugins, ...serverPlugins],
    },
  },
};
