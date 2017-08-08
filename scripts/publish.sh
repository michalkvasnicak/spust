#!/bin/bash

set -e

# test everything
yarn run lint
yarn run flow
yarn run test

# build everything
yarn run build

# publish
yarn lerna -- publish "$@"
