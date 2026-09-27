// apps/native/metro.config.js
//
// Monorepo Metro config. apps/native consumes @meals_client/core as a raw-TS
// workspace package symlinked under the repo-root node_modules by npm
// workspaces, so Metro is pointed at both the app's own node_modules and the
// hoisted root node_modules, with hierarchical lookup disabled to stay
// npm-hoisting safe (single React resolution). After any change run:
//   npx expo start --clear

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname; // apps/native
const workspaceRoot = path.resolve(projectRoot, '../..'); // repo root: /Users/hardinge/sandbox/meals/meals_client

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo, PLUS the contract package. The
//    @elliotJHarding/meals-api dep is symlinked from the repo-root node_modules
//    to ../../meals_model/build/typescript-package — a SIBLING repo outside this
//    workspace. Metro only resolves/serves files under a watchFolder, so the
//    symlink's real target must be watched explicitly or bundling fails with
//    "Unable to resolve @elliotJHarding/meals-api".
const contractPkg = path.resolve(
  workspaceRoot,
  '..',
  'meals_model',
  'build',
  'typescript-package',
);
config.watchFolders = [workspaceRoot, contractPkg];

// 2. Resolve packages from the app's node_modules first, then the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve only from nodeModulesPaths (npm-hoisting safe)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
