import React, {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import StackHeader from '../../components/Header/StackHeader';
import {pxToPercentage} from '../../utils/responsive';

const DocumentRequestDetails = ({route, navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const theme = isDarkMode ? Colors.darkTheme : Colors.lightTheme;
  const item = route.params?.item;

  const btmSheetRef = useRef(null);

  const styles = dynamicStyles(isDarkMode, theme);

  const InformationRequestsDetails = [
    {
      label: 'Description',
      value: [
        'I have changed the hous and now my new address is "Calle de Alcalá, 32, 28009 Madrid, Spain"',
      ],
    },
  ];

  const status = item?.status;

  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.label}>{t(label)}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={{flex: 1}}>
        <StackHeader
          title={item?.name}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
          rightIcon={
            status === 'Requested' ? (
              <TouchableOpacity onPress={() => btmSheetRef.current?.open()}>
                <Svgs.menuDots />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => btmSheetRef.current?.open()}>
                <Svgs.Delete />
              </TouchableOpacity>
            )
          }
        />
        <View style={styles.statusContainer}>
          <WorkerStatus
            name={'Status'}
            status={t(item?.status)}
            nameTextStyle={styles.statusText}
          />
          <View style={styles.rowSb}>
            <Text style={[styles.statusText]}>{t('Requested')}</Text>
            <Text
              style={[
                styles.statusText,
                {
                  fontFamily: Fonts.PoppinsRegular,
                  fontSize: RFPercentage(pxToPercentage(14)),
                },
              ]}>
              {t('12 May, 2025')}
            </Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Description')}</Text>
            <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
          </View>

          <Text
            style={[styles.value, {textAlign: 'left', marginBottom: hp(1)}]}>
            {'I need to upload my letter to my linked-in account'}
          </Text>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Requested')}</Text>
            <Text style={[styles.value, {textAlign: 'right'}]}>
              {t('12 May, 2025')}
            </Text>
          </View>
        </View>
        {/* Action Details */}
        <View style={styles.cardContainer}>
          <View style={styles.rowSb}>
            <Text style={styles.title}>{t('Action Details')}</Text>
            <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
          </View>
          <Row label={'Action on'} value={'13 May, 2025'} />
          <Row
            label={'Admin Comment'}
            value={
              'Your letter is create emailed you on your personal email. Also if you want a printable copy with stamp you can collect it tomorrow from HR office. '
            }
          />
        </View>
      </ScrollView>

      <ReusableBottomSheet
        height={hp('26%')}
        refRBSheet={btmSheetRef}
        sheetTitle={'Select An Option'}
        options={[
          {
            icon: <Svgs.edit height={hp(4)} />,
            title: 'Edit',
            description: 'Select edit to edit the invite.',

            onPress: () => {
              btmSheetRef.current?.close();
            },
          },
          {
            icon: <Svgs.deleteBlueOutline height={hp(4)} />,
            title: 'Delete',
            description: 'Select delete to delete invite.?',

            onPress: () => {
              btmSheetRef.current?.close();
            },
          },
        ]}
      />
    </View>
  );
};

export default DocumentRequestDetails;

const dynamicStyles = (isDarkMode, theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(pxToPercentage(18)),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
      marginTop: wp(2),
      borderRadius: wp(2),
      marginBottom: hp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: theme.primaryTextColor,
      fontSize: RFPercentage(pxToPercentage(16)),
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(0.5),
    },
    cardContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(3),
      padding: wp(4),
      marginHorizontal: wp(4),
      marginBottom: hp(2),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    label: {
      fontFamily: Fonts.NunitoRegular,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      flex: 1,
    },
    valueContainer: {
      flex: 1.2,
      alignItems: 'flex-end',
    },
    value: {
      fontFamily: Fonts.NunitoMedium,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
    },
    title: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlignVertical: 'center',
    },
    pdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.backgroundColor}70`
        : Colors.lightTheme.secondryColor,
      borderRadius: wp(2),
      height: hp(30),
      marginTop: hp(2),
    },
    pdfText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
    },
  });
