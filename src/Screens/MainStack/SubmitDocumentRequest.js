import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../../Constants/themeColors';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TxtInput from '../../components/TextInput/Txtinput';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useTranslation} from 'react-i18next';
import CustomButton from '../../components/Buttons/customButton';
import {pxToPercentage} from '../../utils/responsive';

const SubmitDocumentRequest = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const [docName, setDocName] = useState('');

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        style={styles.container}>
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

          <Text style={styles.header}>{t('Document Request')}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.heading}>{t('Request Details')}</Text>
          <Text style={[styles.label]}>
            {t('E.g. Experience Letter')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TxtInput
            value={docName}
            containerStyle={styles.txtInputContainer}
            placeholder={'Eg. Missed Punch'}
            onChangeText={setDocName}
          />
          <Text style={[styles.label]}>
            {t('Description')}
            <Text style={{color: 'red'}}> *</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.comments]}
            placeholder={t('Describe your request')}
            placeholderTextColor="#A0A0A0"
            multiline
          />
        </View>
      </ScrollView>
      <View style={styles.btnContainer}>
        <CustomButton
          text={'Send'}
          onPress={() => {}}
          textStyle={styles.continueButtonText}
          containerStyle={styles.continueButton}
        />
      </View>
    </View>
  );
};

export default SubmitDocumentRequest;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    scrollContentContainer: {
      flexGrow: 1,
      paddingBottom: hp(4),
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(2),
      paddingTop: hp(2),
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(2),
      marginBottom: hp(2),
    },
    header: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
      width: wp(80),
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsMedium,
    },
    contentContainer: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
    },
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      marginBottom: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.input
        : Colors.lightTheme.backgroundColor,
      fontSize: RFPercentage(pxToPercentage(15)),
    },
    comments: {
      height: hp(40),
      textAlignVertical: 'top',
    },
    uploadContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(1),
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    txtInputContainer: {
      backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
      marginBottom: hp(2),
    },
    marginTop1: {
      marginTop: hp(1),
    },
    labelSecondary: {
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginBottom: hp(0.5),
    },
    uploadButton: {
      padding: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : '#5E5F60',
      borderRadius: wp(10),
    },
  });
