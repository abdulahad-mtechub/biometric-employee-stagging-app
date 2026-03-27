import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useTranslation} from 'react-i18next';

const StackHeader = ({
  title,
  rightIcon,
  onBackPress,
  showTitle = true,
  backIcon = 'chevron-left',
  backIconColor,
  headerView,
  headerStyle,
  headerTxtStyle,
  rightIconContainer,
  rightIconPress,
}) => {
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();

  const styles = StyleSheet.create({
    header: {
      justifyContent: 'center',
      paddingBottom: hp(2.5),
    },
    headerView: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
    },
    iconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: wp(8),
    },
    headerTextContainer: {
      flex: 1,
      justifyContent: 'center',
      // alignItems: 'center',
      paddingHorizontal: wp(4),
    },
    mainText: {
      fontFamily: Fonts.PoppinsMedium,
      textAlign: 'center',
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(2.5),
    },
  });

  return (
    <View style={[styles.header, headerStyle]}>
      <View style={[styles.headerView, headerView]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBackPress || (() => navigation?.goBack())}
          style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={backIcon}
            size={RFPercentage(4)}
            color={
              backIconColor
                ? backIconColor
                : isDarkMode
                ? Colors.darkTheme.primaryTextColor
                : Colors.lightTheme.primaryTextColor
            }
          />
        </TouchableOpacity>

        {/* Title */}
        {showTitle && (
          <View style={styles.headerTextContainer}>
            <Text style={[styles.mainText, headerTxtStyle]} numberOfLines={1}>
              {t(title)}
            </Text>
          </View>
        )}

        {/* Right Icon */}
        <TouchableOpacity
          onPress={rightIconPress}
          style={[styles.iconContainer, rightIconContainer]}>
          {rightIcon || null}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StackHeader;
