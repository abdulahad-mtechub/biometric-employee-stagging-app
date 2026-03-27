import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Images} from '../../assets/Images/Images';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const DepartmentMemberCard = ({onPress, item, svg}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {svg ? svg :item?.image && <Image source={item?.image} style={styles.image} /> }
        
        

        <Text style={styles.name}>{t(item?.title)}</Text>
      </View>
      <MaterialCommunityIcons
        name={'chevron-right'}
        size={RFPercentage(4)}
        color={
          isDarkMode
            ? Colors.darkTheme.secondryTextColor
            : Colors.lightTheme.iconColor
        }
        onPress={() => {
          onPress();
        }}
      />
    </View>
  );
};

export default DepartmentMemberCard;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      paddingBottom: hp(1),
    },
    image: {
      width: wp(8),
      height: hp(4),
      borderRadius: 100,
    },
    name: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.8),
      //   width: '70%',
      // marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
    },
  });
