// apps/native/babel.config.js
//
// babel-preset-expo is the only required preset for SDK 56; expo-router's Babel
// transform is bundled inside it (no separate "expo-router/babel" plugin since
// SDK 50). If react-native-reanimated is added later, its plugin must be LAST
// in the plugins array.

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // plugins: ['react-native-reanimated/plugin'], // add only if reanimated is installed; must stay last
  };
};
