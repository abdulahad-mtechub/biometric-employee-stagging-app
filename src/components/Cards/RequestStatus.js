import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../../Constants/themeColors';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Fonts } from '../../Constants/Fonts';
import { Svgs } from '../../assets/Svgs/Svgs';


const statusStyles = {
  Processing: { backgroundColor: '#579DFF', color: '#ffffff', icon: <Svgs.Processing height={hp(2)} /> },
  Approved: { backgroundColor: '#34D399', color: '#ffffff', icon: <Svgs.CheckOutline height={hp(2)}/> },
//   Absent: { backgroundColor: '#F87171', color: '#ffffff', icon: <Svgs.CheckOutline height={hp(2)}/> },
//   'Early Out': { backgroundColor: '#A78BFA', color: '#ffffff', icon: <Svgs.CheckOutline height={hp(2)}/> },
//   'Late Arrival': { backgroundColor: '#FB923C', color: '#000000', icon: <Svgs.CheckOutlineBlack height={hp(2)}/> },
  'Requested': { backgroundColor: '#F5CD47', color: '#000000', icon: <Svgs.halfLeave height={hp(2)}/> },
};

export default function RequestStatus({ name, status }) {
  const style = statusStyles[status];
    const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);

  return (
    <View style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <View style={[styles.statusBox, { backgroundColor: style.backgroundColor }]}>
        {style.icon}
        <Text style={[styles.statusText, { color: style.color }]}>
           {status}
        </Text>
      </View>
    </View>
  );
}

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
     row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.5),
  },
  name: {
    fontSize: RFPercentage(1.8),
    color: isDarkMode? Colors.darkTheme.QuaternaryText : Colors.lightTheme.QuaternaryText,
    fontFamily: Fonts.PoppinsRegular
  },
  statusBox: {
    borderRadius: wp(1),
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1),
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'row',
  },
  statusText: {
    fontSize: RFPercentage(1.8),
    textAlign: 'center',
    textAlignVertical: 'center',
    marginLeft: wp(1),
  },
});
