import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {Colors} from '../../Constants/themeColors';
import {useButtonColors} from '../../Constants/colorHelper';

const CustomLoader = ({size = 'small', visible = false}) => {
  if (!visible) return null;
  const {isDarkMode, getButtonColor} = useButtonColors();
  const primaryButtonColors = getButtonColor('primary');

  return (
    <View style={styles.overlay}>
      <ActivityIndicator
        size={size}
        color={primaryButtonColors.backgroundColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 9999,
  },
});

export default CustomLoader;
