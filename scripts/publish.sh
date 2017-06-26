#!/bin/bash

# build everything
yarn run build

# test everything
yarn run test

# publish
yarn lerna -- publish "$@"
