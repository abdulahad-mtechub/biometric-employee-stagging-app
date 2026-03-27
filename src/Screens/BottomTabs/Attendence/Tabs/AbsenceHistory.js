import {FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Svgs} from '../../../../assets/Svgs/Svgs';
import CalendarBtn from '../../../../components/Buttons/CalenderBtn';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../../../Constants/themeColors';
import {Fonts} from '../../../../Constants/Fonts';
import {SCREENS} from '../../../../Constants/Screens';
import SymbolCard from '../../../../components/Cards/SymbolCard';
import {
  AbsenceHistoryCardsData,
  AbsenceHistoryData,
  RequestSymbols,
} from '../../../../Constants/DummyData';
import {useTranslation} from 'react-i18next';
import StatusCardItem from '../../../../components/Cards/StatusCardItem';
import {pxToPercentage} from '../../../../utils/responsive';
import DashboardCard from '../../../../components/Cards/DashboardCard';

const AbsenceHistory = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
    // You can update your calendar data based on newYear here
  };
  return (
    <View style={styles.containerStyle}>
      <FlatList
        data={AbsenceHistoryCardsData}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        style={styles.flatListContainer}
        renderItem={({item}) => (
          <DashboardCard
            title={item.title}
            value={item.value}
            subText={item.subText}
            progress={item.progress}
          />
        )}
      />
      <View
        style={[
          styles.rowSb,
          {
            paddingHorizontal: wp(3),
            paddingVertical: hp(2),
            borderRadius: wp(2),
          },
        ]}>
        <Text
          style={[
            styles.SubHeading,
            {fontSize: RFPercentage(pxToPercentage(16))},
          ]}>
          140+ {t('Punches')}
        </Text>
        <Svgs.filter />
      </View>
      <SymbolCard
        heading={'Attendence Symbols'}
        array={RequestSymbols}
        contianerStyle={{
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
      />
      <View style={styles.contentContainerStyle}>
        <CalendarBtn onYearChange={handleYearChange} mode={true} />

        <View style={[styles.listheadingContainer]}>
          <Text style={[styles.SubHeading]}>{t('Monthly Punch')}</Text>
          <Text style={[styles.SubHeading, {fontFamily: Fonts.PoppinsMedium}]}>
            {t('Time')}
          </Text>
        </View>

        {AbsenceHistoryData.map((item, index) => (
          <StatusCardItem
            item={item}
            key={index}
            type={'AbsenceHistory'}
            containerStyle={{
              marginTop: hp(1),
            }}
            onPress={() => {
              navigation.navigate(SCREENS.ABSENCEHISTORY, {requestType:'AbsenceHistory', item});
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default AbsenceHistory;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    containerStyle: {
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
      flex: 1,
      marginTop: -hp(1.4),
    },
    contentContainerStyle: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(3),
      borderRadius: wp(2),
      paddingTop: hp(2),
    },
    rowSb: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(pxToPercentage(14)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    listContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      padding: hp(2),
      borderRadius: wp(2),
    },
    listContainer: {
      // paddingHorizontal: wp(5),
    },
    flatListContainer: {
      marginTop: hp(2),
    },
    listheadingContainer: {
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      paddingBottom: hp(1),
      marginTop: hp(2),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
  });
