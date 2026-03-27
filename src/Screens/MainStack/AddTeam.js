import {StyleSheet, Text, View} from 'react-native';
import React, {useState} from 'react';
import {Colors} from '../../Constants/themeColors';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Fonts} from '../../Constants/Fonts';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TxtInput from '../../components/TextInput/Txtinput';
import CustomDropDown from '../../components/DropDown/CustomDropDown';
import CustomButton from '../../components/Buttons/customButton';
import { t } from 'i18next';

const AddTeam = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const [TeamName, setTeamName] = useState('');
  const [lead, setlead] = useState('');
  const [Members, setMembers] = useState('');

  const handleAdd = () => {};
  return (
    <View style={styles.contianer}>
        <View style={{paddingHorizontal: wp(5), flex: 3}} >

      <View style={styles.backArrowContainer}>
        <MaterialCommunityIcons
          name={'close'}
          size={RFPercentage(4)}
          color={
            isDarkMode
              ? Colors.darkTheme.secondryTextColor
              : Colors.lightTheme.iconColor
          }
          onPress={() => {
            navigation.goBack();
          }}
        />

        <Text style={[styles.heading]}>{t("Add Team")}</Text>
      </View>
      <Text
        style={[
          styles.heading,
          {textAlign: 'left', fontFamily: Fonts.PoppinsSemiBold},
        ]}>
        {t("Team Details")}
      </Text>

      <Text style={styles.label}>
        {t("Name")}<Text style={{color: Colors.error}}> *</Text>
      </Text>

      <TxtInput
        value={TeamName}
        containerStyle={styles.inputField}
        placeholder="E.g. Team # 1"
        onChangeText={setTeamName}
      />

      <Text style={styles.label}>
        {t("Team Lead")}<Text style={{color: Colors.error}}> *</Text>
      </Text>

      <CustomDropDown
        data={['John Doe']}
        selectedValue={lead}
        onValueChange={setlead}
        placeholder="Select"
        containerStyle={[styles.dropdownContainer]}
        width={'100%'}
        dropdownContainerStyle={{position: 'relative', top: 0}}
        btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
        astrik={true}
      />

      <Text style={styles.label}>
        {t("Add Members")} <Text style={{color: Colors.error}}> *</Text>
      </Text>

      <CustomDropDown
        data={['John Doe']}
        selectedValue={Members}
        onValueChange={setMembers}
        placeholder="Select"
        containerStyle={[styles.dropdownContainer]}
        width={'100%'}
        btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
        astrik={true}
      />
      {/* </View> */}
      <View
        style={{flexDirection: 'row', marginVertical: hp(1), flexWrap: 'wrap'}}>
        <Text style={styles.selectedZone}>John Doe ╳</Text>
        <Text style={styles.selectedZone}>Michelle Mikal ╳</Text>
        <Text style={styles.selectedZone}>Daniel Doe ╳</Text>
      </View>
        </View>


      <View style={styles.btnContainer}>
        <CustomButton
          text={'Save'}
          onPress={handleAdd}
          textStyle={styles.continueButtonText}
          containerStyle={[styles.continueButton]}
        />
      </View>
    </View>
  );
};

export default AddTeam;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    contianer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: hp(2),
    },
    heading: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsMedium,
      textAlign: 'center',
      width: wp(80),
    },
    label: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      //   width: wp(80),
      marginBottom: hp(0.5),
      marginTop: hp(2),
    },
    dropdownContainer: {
      zIndex: 10000,
      marginRight: wp(5),
      width: '100%',
      position: 'relative',
    },
    selectedZone: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      backgroundColor: '#579DFF',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      borderRadius: wp(1),
      marginRight: wp(2),
      marginBottom: hp(1),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      flex: 0.2,
      //   position: "absolute",
      //   bottom: hp(2.5),
      //   left: wp(0),
      //   right: wp(0),
      paddingVertical: wp(4),
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });
