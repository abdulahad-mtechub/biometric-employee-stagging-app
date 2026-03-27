import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import CustomButton from '../../../components/Buttons/customButton';
import CustomDropDown from '../../../components/DropDown/CustomDropDown';
import StackHeader from '../../../components/Header/StackHeader';
import {Fonts} from '../../../Constants/Fonts';
import {Colors} from '../../../Constants/themeColors';
import {setLanguage} from '../../../redux/Slices/authSlice';
import i18n from '../../../Translations/i18n';
import {pxToPercentage} from '../../../utils/responsive';

const GeneralSettingsScreen = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {language} = useSelector(store => store?.auth);

  const getLanguageCode = lang => {
    if (lang === 'Español' || lang === 'Español' || lang === 'es') return 'es';
    return 'en';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(
    getLanguageCode(language),
  );
  const [currency, setCurrency] = useState('Euro');
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [Min, setMint] = useState('');
  const [Months, setMonths] = useState('');
  const [Hours, setHours] = useState('');
  const [showRefCode, setShowRefCode] = useState(false);
  const [taskDeadlineReminders, setTaskDeadlineReminders] = useState(false);
  const [autoDeleteInactiveDocuments, setAutoDeleteInactiveDocuments] =
    useState(false);
  const languageOptions = [
    {label: t('English'), value: 'en'},
    {label: t('Español'), value: 'es'},
  ];
  const styles = dynamicStyles(isDarkMode);

  const currencyOptions = ['Euro', 'USD', 'GBP', 'PKR'].map(c => ({
    label: t(c),
    value: c,
  }));
  const minutes = Array.from({length: 60}, (_, i) => ({
    label: t(`${i + 1} Min`),
    value: `${i + 1}`,
  }));
  const months = Array.from({length: 12}, (_, i) => ({
    label: t(`${i + 1} Months`),
    value: `${i + 1}`,
  }));
  const hours = Array.from({length: 24}, (_, i) => ({
    label: t(`${i + 1} Hours`),
    value: `${i + 1}`,
  }));

  const onUpdateSettings = () => {
    // Convert language code back to stored format
    const languageToStore = selectedLanguage === 'es' ? 'Español' : 'English';
    dispatch(setLanguage(languageToStore));
    i18n.changeLanguage(selectedLanguage);
    navigation.goBack();
  };
  return (
    <View style={styles.container}>
      <StackHeader
        title={t('General Settings')}
        headerTxtStyle={styles.headerTxtStyle}
        headerStyle={styles.headerStyle(isDarkMode)}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: hp(4)}}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Language')}</Text>
            <CustomDropDown
              data={languageOptions}
              selectedValue={selectedLanguage}
              onValueChange={setSelectedLanguage}
              placeholder={t('Language')}
              containerStyle={[styles.dropdownContainer, {marginBottom: hp(4)}]}
              width={'100%'}
              btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
              zIndex={3000}
            />
            {/* <Text style={styles.sectionTitle}>{t('Currency')}</Text>
            <CustomDropDown
              data={currencyOptions}
              selectedValue={currency}
              onValueChange={setCurrency}
              placeholder={t('Currency')}
              containerStyle={[styles.dropdownContainer, {marginBottom: hp(1)}]}
              width={'100%'}
              btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
              zIndex={3000}
            />
            <Text style={styles.sectionTitle}>{t('Currency')}</Text>
            <CustomDropDown
              data={currencyOptions}
              selectedValue={currency}
              onValueChange={setCurrency}
              placeholder={t('Currency')}
              containerStyle={[styles.dropdownContainer, {marginBottom: hp(1)}]}
              width={'100%'}
              btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
              zIndex={3000}
            />
          </View>

          <LabeledSwitch
            title={t('Auto logout on inactivity')}
            value={autoLogout}
            onValueChange={() => setAutoLogout(!autoLogout)}
          />

          <Text style={styles.sectionTitle}>
            {t('Session duration timeout after')}
          </Text>
          <View style={styles.rowView}>
            <NumericStepper
              value={sessionDuration}
              setValue={setSessionDuration}
              min={0}
              max={30}
              containerStyle={{width: '30%', paddingHorizontal: wp(1.5)}}
            />
            <LabeledDropdown
              data={minutes}
              value={Min}
              onChange={item => setMint(item.value)}
              placeholder={t('Min')}
              width={wp(24)}
            />
          </View>

          <LabeledSwitch
            title={t('Auto delete inactive documents')}
            value={autoDeleteInactiveDocuments}
            onValueChange={() =>
              setAutoDeleteInactiveDocuments(!autoDeleteInactiveDocuments)
            }
          />

          <LabeledCheckbox
            title={t('Auto delete inactive document')}
            value={showRefCode}
            onToggle={() => setShowRefCode(!showRefCode)}
            containerStyle={{marginBottom: 1}}
          />
          <View style={styles.rowView}>
            <Text style={styles.sectionTitle}>{t('After')}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                gap: wp(2),
              }}>
              <NumericStepper
                value={sessionDuration}
                setValue={setSessionDuration}
                min={0}
                max={30}
                containerStyle={{width: '30%', paddingHorizontal: wp(1.5)}}
              />
              <LabeledDropdown
                data={months}
                value={Months}
                onChange={item => setMonths(item.value)}
                placeholder={t('Months')}
                width={wp(24)}
              />
            </View>
          </View>

          <LabeledCheckbox
            title={t('Task deadline reminders')}
            value={taskDeadlineReminders}
            onToggle={() => setTaskDeadlineReminders(!taskDeadlineReminders)}
            containerStyle={{marginBottom: 1, marginTop: hp(2)}}
          />

          <View style={[styles.rowView, {marginBottom: hp(2)}]}>
            <Text style={styles.sectionTitle}>{t('Before')}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                gap: wp(2),
              }}>
              <NumericStepper
                value={sessionDuration}
                setValue={setSessionDuration}
                min={0}
                max={30}
                containerStyle={{width: '30%', paddingHorizontal: wp(1.5)}}
              />
              <LabeledDropdown
                data={hours}
                value={Hours}
                onChange={item => setHours(item.value)}
                placeholder={t('Hours')}
                width={wp(24)}
              />
            </View> */}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          text={t('Update')}
          onPress={onUpdateSettings}
          textStyle={styles.continueButtonText}
          containerStyle={styles.continueButton}
        />
      </View>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    headerStyle: isDark => ({
      paddingVertical: hp(2),
      backgroundColor: isDark
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    }),
    scrollContainer: {
      flex: 1,
      paddingHorizontal: wp(5),
      paddingTop: hp(3),
    },
    content: {
      borderRadius: 10,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(4),
      paddingTop: hp(1),
    },
    sectionTitle: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(0.5),
      marginTop: hp(1),
    },
    rowView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    buttonContainer: {
      paddingVertical: hp(2),
      paddingHorizontal: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderTopWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    continueButton: {
      // backgroundColor: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.BtnColor
      //   : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
    },
    continueButtonText: {
      fontSize: RFPercentage(1.9),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
  });

export default GeneralSettingsScreen;
