import {StyleSheet, Text, View, Pressable, Image} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Loader from '../Loaders/loader';
import {Colors} from '../../Constants/themeColors';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {useTranslation} from 'react-i18next';
import {useButtonColors} from '../../Constants/colorHelper';

const CustomButton = ({
  containerStyle,
  borderColor,
  onPress,
  mode,
  text,
  textStyle,
  txtColor,
  icon,
  iconSize,
  iconColor,
  pressedRadius,
  svg,
  img,
  imgStyle,
  isLoading,
  vertical,
  rightSvg,
  contentContainer,
  loaderColor,
  LoaderSize,
  keey,
  modeContainerStyle,
  disabled,
}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const {t} = useTranslation();
  const primaryButtonColors = getButtonColor('primary');
  const renderContent = () => {
    if (isLoading) {
      return <Loader color={loaderColor} size={LoaderSize} />;
    }

    if (icon) {
      return (
        <View style={styles.rowCenter}>
          <Icon name={icon} size={iconSize} color={iconColor} />
          {text && <Text style={[styles.text, textStyle]}>{t(text)}</Text>}
        </View>
      );
    }

    if (rightSvg) {
      return (
        <View style={[styles.rowCenter, contentContainer]}>
          {text && <Text style={[styles.text, textStyle]}>{t(text)}</Text>}
          {rightSvg}
        </View>
      );
    }

    if (text && !svg && !icon) {
      return <Text style={[styles.text, textStyle]}>{t(text)}</Text>;
    }

    if (svg) {
      return (
        <View style={[!vertical && styles.rowCenter]}>
          {svg}
          {text && <Text style={[styles.text, textStyle]}>{t(text)}</Text>}
        </View>
      );
    }

    if (img) {
      return <Image source={img} style={imgStyle} />;
    }

    return null;
  };

  const getButtonBackground = () => {
    if (mode) return 'transparent';
    return primaryButtonColors.backgroundColor;
  };

  const getBorderColor = () => {
    if (!mode) return undefined;
    return primaryButtonColors.backgroundColor;
  };

  return (
    <Pressable
      onPress={onPress}
      key={keey}
      style={({pressed}) => [
        styles.buttonBase,
        {backgroundColor: getButtonBackground()},
        mode && {
          borderColor: primaryButtonColors.backgroundColor,
          borderWidth: 1,
        },
        pressed && {opacity: 0.5, borderRadius: pressedRadius},
        containerStyle,
        modeContainerStyle,
      ]}
      disabled={disabled || isLoading}>
      {renderContent()}
    </Pressable>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  buttonBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: RFPercentage(1.8),
    fontFamily: Fonts.PoppinsSemiBold,
  },
});
