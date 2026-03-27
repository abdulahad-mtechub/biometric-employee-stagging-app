import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
// import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {useSelector} from 'react-redux';
import {Colors} from '../../../../Constants/themeColors';
import {Fonts} from '../../../../Constants/Fonts';
import {Svgs} from '../../../../assets/Svgs/Svgs';
import TxtInput from '../../../../components/TextInput/Txtinput';
import {useTranslation} from 'react-i18next';
import {pxToPercentage} from '../../../../utils/responsive';
export default function Step1() {
  const {isDarkMode} = useSelector(state => state.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [name, setname] = useState('');

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleDateConfirm = date => {
    setSelectedDate(date.toLocaleDateString());
    hideDatePicker();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t('Request Details')}</Text>

      <Label text="Name" required isDarkMode={isDarkMode} />
      <TxtInput
        value={name}
        containerStyle={{
          backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
          marginBottom: hp(2),
        }}
        placeholder="E.g. Missed Punch"
        onChangeText={setname}
      />

      <Label text="Punch Date" required isDarkMode={isDarkMode} />
      <TouchableOpacity onPress={showDatePicker} style={styles.input}>
        <Text style={styles.dateText}>{selectedDate || 'MM/DD/YYYY'}</Text>
        <View style={styles.iconRight}>{<Svgs.calenderL />}</View>
      </TouchableOpacity>

      <Label text="Description" isDarkMode={isDarkMode} />
      <TextInput
        style={[styles.input, styles.comments]}
        placeholder={t('Describe your request')}
        placeholderTextColor="#A0A0A0"
        multiline
      />

      <View style={styles.marginTop1}>
        <Text style={styles.label}>
          {t('Supporting Proof')}
          <Text style={{color: Colors.error}}> *</Text>
        </Text>
        <Text style={styles.labelSecondary}>
          {t('Upload image/Document in PNG/JPG/PDF Format')}
        </Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton}>
            <Svgs.whitePlus />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const Label = ({text, required, isDarkMode}) => {
  const {t} = useTranslation();

  return (
    <Text style={[dynamicStyles(isDarkMode).label]}>
      {t(text)}
      {required && <Text style={{color: 'red'}}> *</Text>}
    </Text>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
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
      width: wp(80),
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
    },
    comments: {
      height: hp(40),
      textAlignVertical: 'top',
    },
    dateText: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    iconRight: {
      marginLeft: wp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    half: {
      width: '48%',
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
