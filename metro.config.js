const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

// Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Enhance with Rork AI toolkit
const enhancedConfig = withRorkMetro(config);

// Additional customizations
enhancedConfig.resolver.assetExts = [
  ...enhancedConfig.resolver.assetExts,
  "db",
  "sqlite",
  "hdr",
  "gltf",
  "glb",
  "mtl",
];

enhancedConfig.resolver.sourceExts = [
  ...enhancedConfig.resolver.sourceExts,
  "mjs",
  "cjs",
];

// Enable inline requires for better performance
enhancedConfig.transformer = {
  ...enhancedConfig.transformer,
  inlineRequires: {
    blockList: new Set([
      // Add modules that should not be inlined
      "react",
      "react-native",
      "@react-navigation",
    ]),
  },
};

// Add timeout and performance optimizations
enhancedConfig.server = {
  ...enhancedConfig.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add timeout headers
      res.setTimeout(300000); // 5 minutes
      req.setTimeout(300000);
      return middleware(req, res, next);
    };
  },
};

// Performance optimizations
enhancedConfig.cacheStores = [
  // Add memory cache for faster rebuilds
  require('metro-cache').getDefaultCacheStore({
    cacheDirectory: '.metro-cache',
  }),
];

module.exports = enhancedConfig;
```__
