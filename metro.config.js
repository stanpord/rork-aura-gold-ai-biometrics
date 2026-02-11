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
  "mp3", // if you have audio files
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

module.exports = enhancedConfig;
```__
