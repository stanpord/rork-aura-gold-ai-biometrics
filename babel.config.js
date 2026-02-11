module.exports = function (api) {
  api.cache(true);
  
  const isProd = process.env.NODE_ENV === "production";
  
  const plugins = [
    // Essential plugins first
    ["-module-extension-resolver", {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    }],
    
    // Path alias resolver
    [
      "module-resolver",
      {
        root: ["./src"],
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        alias: {
          "@": "./src",
          "@/components": "./src/components",
          "@/utils": "./src/utils",
          "@/hooks": "./src/hooks",
          "@/constants": "./src/constants",
          "@/contexts": "./src/contexts",
          "@/lib": "./src/lib",
          "@/types": "./src/types",
          "@/assets": "./src/assets",
        },
      },
    ],
  ];

  // Add production-specific optimizations
  if (isProd) {
    plugins.push(
      ["transform-remove-console", { exclude: ["error", "warn", "info"] }],
      "transform-remove-debugger",
      "@babel/plugin-transform-react-inline-elements",
      "@babel/plugin-transform-react-constant-elements"
    );
  }

  // Reanimated MUST be last
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [
      ["babel-preset-expo", {
        unstable_transformImportMeta: true,
        jsxRuntime: "automatic",
        lazyImports: isProd,
      }]
    ],
    plugins,
  };
};
