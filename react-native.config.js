module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-screens': {
      platforms: {
        android: {
          libraryName: 'rnscreens',
          componentDescriptors: [
            'RNSScreenStackHeaderConfigComponentDescriptor',
            'RNSScreenStackHeaderSubviewComponentDescriptor',
            'RNSScreenComponentDescriptor',
            'RNSScreenStackComponentDescriptor',
            'RNSScreenContainerComponentDescriptor',
          ],
        },
      },
    },
  },
};
