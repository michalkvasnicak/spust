// @flow

import { assets as loadAssets } from 'spust';
import React from 'react';

import RenderApp from '../RenderApp';

type Props = {
  containerId?: string,
  lang?: string,
  title?: string,
};

function createRenderer(props: Props) {
  let assets = loadAssets();
  let scripts = assets.js.map(src => ({ src }));
  let stylesheets = assets.css.map(href => ({ href }));

  return ctx => {
    // load assets everytime during development mode
    if (process.env.NODE_ENV !== 'production') {
      assets = loadAssets();
      scripts = assets.js.map(src => ({ src }));
      stylesheets = assets.css.map(href => ({ href }));
    }

    return {
      containerId: props.containerId,
      head: {
        title: props.title,
      },
      lang: props.lang,
      scripts,
      stylesheets,
    };
  };
}

export default function ClientSideRender(props: Props) {
  return <RenderApp render={createRenderer(props)} />;
}
