// @flow

import connect from 'koa-connect';
import helmet from 'helmet';
import hpp from 'hpp';
import React from 'react';

import { serverContextType, type Context as ServerContext } from './Server';

export type Props = {
  contentSecurityPolicy?: {
    browserSniff?: boolean,
    directives?: {
      baseUri?: Array<string>,
      blockAllMixedContent?: boolean,
      connectSrc?: Array<string>,
      defaultSrc?: Array<string>,
      fontSrc?: Array<string>,
      formAction?: Array<string>,
      frameAncestors?: Array<string>,
      childSrc?: Array<string>,
      imgSrc?: Array<string>,
      manifestSrc?: Array<string>,
      mediaSrc?: Array<string>,
      objectSrc?: Array<string>,
      reportUri?: string,
      pluginTypes?: Array<string>,
      sandbox?: Array<string>,
      scriptSrc?: Array<string>,
      styleSrc?: Array<string>,
      upgradeInsecureRequests?: boolean,
      workerSrc?: Array<string>,
    },
    disableAndroid?: boolean,
    loose?: boolean,
    reportOnly?: boolean | ((req: http$ClientRequest, res: http$ServerResponse) => boolean),
    setAllHeaders?: boolean,
  },
  dnsPrefetchControl?: { allow?: boolean },
  expectCertificateTransparency?: {
    enforce?: boolean,
    maxAge?: number,
    reportUri?: string,
  },
  frameguard?: {
    action?: 'allow-from' | 'deny' | 'sameorigin',
    domain?: string,
  },
  hidePoweredBy?: boolean | { setTo?: string },
  httpParameterPollution?: {
    checkBody?: boolean,
    checkBodyOnlyForContentType?: string,
    checkQuery?: boolean,
    whitelist?: string | Array<string>,
  },
  httpPublicKeyPinning?: {
    includeSubdomains?: boolean,
    maxAge?: number,
    reportOnly?: boolean,
    reportUri?: string,
    setIf?: (req: http$ClientRequest, res: http$ServerResponse) => boolean,
    sha256s?: Array<string>,
  },
  httpStrictTransportSecurity?: {
    force?: boolean,
    includeSubDomains?: boolean,
    maxAge?: number,
    preload?: boolean,
    setIf?: (req: http$ClientRequest, res: http$ServerResponse) => boolean,
  },
  ieNoOpen?: boolean,
  noCache?: boolean,
  noSniff?: boolean,
  referrerPolicy?: {
    policy?:
      | 'no-referrer'
      | 'no-referrer-when-downgrade'
      | 'origin'
      | 'origin-when-cross-origin'
      | 'same-origin'
      | 'strict-origin'
      | 'strict-origin-when-cross-origin'
      | 'unsafe-url',
  },
  xssFilter?: {
    setOnOldIE?: boolean,
  },
};

export default class Secure extends React.Component<void, Props, void> {
  static contextTypes = serverContextType;

  context: ServerContext;

  constructor(props: Props, context: ServerContext) {
    super(props, context);

    const { httpParameterPollution, ...rest } = this.props;

    this.context.use(connect(helmet({ ...rest })));

    if (httpParameterPollution) {
      this.context.use(connect(hpp()));
    }
  }

  render() {
    return null;
  }
}
