// @flow

// this is hack for assets helper to have access to this path during runtime
// because it is sourced from node_modules so webpack will not include this variable
process.env.__ASSETS_JSON_PATH = process.env.ASSETS_JSON_PATH;
