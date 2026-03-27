import React, {useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import {Fonts} from '../../Constants/Fonts';
import {FontsSize} from '../../Constants/FontsSize';
import {Colors} from '../../Constants/themeColors';
import CustomButton from '../Buttons/customButton';

const TxtInput = ({
  style,
  rightIcon,
  placeholder,
  rightIconSize,
  rightIconColor,
  keyboardType,
  onChangeText,
  value,
  onBlur,
  multiline,
  leftIcon,
  leftIconSize,
  leftIconColor,
  secureTextEntry,
  onFocus,
  onPress,
  error,
  placeholderTextColor,
  rightIconPress,
  rightIconContainerStyle,
  isEmoji,
  containerStyle,
  svg,
  rightIconFocusColor,
  selectableColor,
  inputStyle,
  leftSvg,
  btnText,
  leftBtnStyle,
  leftBtnPress,
  editable,
  focusedStyle,
  maxLength,
  numberOfLines,
  rightSvg,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [isFocused, setFocused] = useState(false);
  const {isDarkMode} = useSelector(store => store.theme);

  const themeColors = isDarkMode ? Colors.darkTheme : Colors.lightTheme;

  return (
    <View style={style}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: wp('4%'),
            borderWidth: wp('0.3%'),
            borderRadius: wp(3),
            borderColor: error ? 'red' : themeColors.BorderGrayColor,
            backgroundColor: error ? '#fee2e2' : 'transparent',
            marginBottom: !error ? hp(1) : 1,
          },
          containerStyle,
          isFocused && {
            borderColor: themeColors.primaryColor,
            backgroundColor: `${themeColors.primaryColor}20`,
          },
          isFocused && focusedStyle,
        ]}>
        {/* Left Icon / SVG */}
        {(leftSvg || leftIcon) && (
          <CustomButton
            svg={leftSvg}
            icon={leftIcon}
            iconColor={leftIconColor}
            iconSize={leftIconSize}
            containerStyle={leftBtnStyle}
            onPress={leftBtnPress}
          />
        )}

        {/* Inline SVG if passed */}
        {svg && svg}

        {/* TextInput */}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: FontsSize.size15,
              fontFamily: Fonts.PoppinsMedium,
              color: themeColors.primaryTextColor,
              paddingVertical: wp('2.2%'),
            },
            inputStyle,
            (leftIcon || leftSvg) && {marginLeft: wp(2)},
          ]}
          placeholder={placeholder}
          placeholderTextColor={
            placeholderTextColor || themeColors.QuaternaryText
          }
          selectionColor={selectableColor || `${themeColors.primaryColor}40`}
          keyboardType={keyboardType}
          onFocus={() => (onFocus ? onFocus() : setFocused(true))}
          onBlur={e => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          onChangeText={onChangeText}
          value={value}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          onPress={onPress}
          editable={editable}
          maxLength={maxLength}
          numberOfLines={numberOfLines}
          autoCapitalize={secureTextEntry ? null : 'none'}
        />

        {/* Password toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            {isPasswordVisible ? (
              <Svgs.passwordEyeOpenL />
            ) : (
              <Svgs.passwordEyeL />
            )}
          </TouchableOpacity>
        )}

        {/* Right Icon / Button */}
        {(rightIcon || rightSvg) && (
          <CustomButton
            icon={rightIcon}
            iconSize={rightIconSize}
            iconColor={rightIconColor}
            svg={rightSvg}
            onPress={rightIconPress}
            containerStyle={
              rightIconContainerStyle
                ? rightIconContainerStyle
                : {
                    backgroundColor: 'transparent',
                  }
            }
            text={btnText}
            textStyle={{
              fontSize: RFPercentage(2.2),
              fontFamily: Fonts.PoppinsRegular,
              color: themeColors.primaryTextColor,
              marginLeft: wp('2%'),
            }}
          />
        )}
      </View>

      {error && (
        <Text
          style={{
            color: '#dc2626',
            fontFamily: Fonts.PoppinsRegular,
            fontSize: RFPercentage(1.5),
            minHeight: hp(1.5),
            marginLeft: 5,
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default TxtInput;
