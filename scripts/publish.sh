#!/bin/bash

# build everything
yarn run build

# test everything
yarn run lint
yarn run flow
yarn run test

# publish
yarn lerna -- publish "$@"
