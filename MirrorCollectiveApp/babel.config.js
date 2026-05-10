module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@theme': './src/theme',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@constants': './src/constants',
          '@types': './src/types',
          '@context': './src/context',
          '@i18n': './src/i18n',
          '@features': './src/features',
        },
      },
    ],
    '@babel/plugin-transform-class-static-block',
    // react-native-reanimated/plugin MUST be the LAST plugin in this array.
    // The plugin's worklet transform expects to run after all other syntax
    // transforms; placing it earlier causes runtime errors in dev/release.
    'react-native-reanimated/plugin',
  ],
};
