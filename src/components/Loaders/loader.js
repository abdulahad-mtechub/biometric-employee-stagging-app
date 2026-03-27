// import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import { Colors } from '../../Constants/themeColors';

// // import { BarIndicator} from 'react-native-indicators'

// const Loader = ({ color, size, loading, style }) => {
//     return (
//         loading &&
//         <ActivityIndicator
//             size={size || "small"}
//             color={color ?? Colors.darkTheme.primaryColor}
//             style={[{alignSelf: 'center', }, style]} // scale the size
//             />
//     )
// }

// export default Loader

// const styles = StyleSheet.create({})
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import React from 'react';
import {Colors} from '../../Constants/themeColors';
import {useButtonColors} from '../../Constants/colorHelper';

const Loader = ({color, size, loading}) => {
  if (!loading) return null;
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator
        size={size || 'large'}
        color={color ?? primaryButtonColors.backgroundColor}
      />
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
