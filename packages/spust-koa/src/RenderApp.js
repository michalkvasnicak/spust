// @flow

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Middleware from './Middleware';

type Base = {
  href?: string,
  target?: string,
};
type Link = {
  crossOrigin?: string,
  href?: string,
  hrefLang?: string,
  integrity?: string,
  media?: string,
  preload?: boolean,
  prefetch?: boolean,
  rel?: string,
  sizes?: string,
  title?: string,
  type?: string,
};
type Meta = { content?: string, httpEquiv?: string, charSet?: string, name?: string };
type Script = {
  async?: boolean,
  crossOrigin?: string,
  defer?: boolean,
  integrity?: string,
  script?: string,
  src?: string,
  type?: string,
};
type Stylesheet = { href?: string, media?: string, rel?: string };

type Head = {
  base?: Base,
  meta?: Array<Meta>,
  links?: Array<Link>,
  scripts?: Array<Script>,
  stylesheets?: Array<Stylesheet>,
  title?: string,
};

type Result = {
  body?: string,
  containerId?: string,
  head?: Head,
  lang?: string,
  scripts?: Array<Script>,
  status?: number,
  stylesheets?: Array<Stylesheet>,
};

export type Props = {
  render: (context: *) => Promise<Result> | Result,
};

export function renderHead(head: Head, additionalStylesheets?: Array<Stylesheet> = []): string {
  const metaTags = head.meta || [];
  const links = head.links || [];
  const scripts = head.scripts || [];
  const stylesheets = [...(head.stylesheets || []), ...additionalStylesheets];

  return renderToStaticMarkup(
    <head>
      {head.base && <base {...head.base} />}
      {metaTags.map((tag, i) => <meta key={i} {...tag} />)}
      <title>
        {head.title}
      </title>
      {links.map((linkAttrs, i) => <link key={i} {...linkAttrs} />)}
      {stylesheets.map((stylesheetAttrs, i) =>
        <link key={`s-${i}`} {...stylesheetAttrs} rel={stylesheetAttrs.rel || 'stylesheet'} />,
      )}
      {scripts.map((scriptAttrs, i) =>
        <script
          key={`scr-${i}`}
          {...scriptAttrs}
          dangerouslySetInnerHTML={{ __html: scriptAttrs.script }}
        />,
      )}
    </head>,
  );
}

export function renderFooter(scripts?: Array<Script> = []): string {
  return renderToStaticMarkup(
    <footer>
      {scripts.map((scriptAttrs, i) =>
        <script
          key={`fscr-${i}`}
          {...scriptAttrs}
          dangerouslySetInnerHTML={{ __html: scriptAttrs.script }}
        />,
      )}
    </footer>,
  ).replace(/<(\/)?footer>/g, '');
}

export default function RenderApp({ render }: Props) {
  return (
    <Middleware
      use={async ctx => {
        const {
          body = '',
          containerId = 'app',
          lang = 'en',
          head = {},
          scripts = [],
          status,
          stylesheets = [],
        } = await render(ctx);

        ctx.status = status || 200;

        ctx.body = `
<html lang="${lang}">
  ${renderHead(head, stylesheets)}
  <body>
    <div id="${containerId}">${body}</div>
    ${renderFooter(scripts)}
  </body>
</html>
    `.trim();
      }}
    />
  );
}
