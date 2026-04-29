// Learn more: https://docs.expo.dev/guides/monorepos/
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withNativewind } = require("nativewind/metro");

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// pnpm stores resolved packages under <workspace-root>/node_modules/.pnpm/
// Metro must watch that directory so symlinks from apps/expo/node_modules/
// can be resolved.
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, "node_modules", ".cache", "metro"),
  }),
];

/** @type {import('expo/metro-config').MetroConfig} */
module.exports = withNativewind(config, { input: "./src/styles.css" });
