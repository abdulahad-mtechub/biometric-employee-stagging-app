import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {useState} from 'react';
import {Colors} from '../../Constants/themeColors';
import {useSelector} from 'react-redux';
import StackHeader from '../../components/Header/StackHeader';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import CustomButton from '../../components/Buttons/customButton';
import {FlatList} from 'react-native-gesture-handler';
import {DepartmentData, departmentMembers} from '../../Constants/DummyData';
import DashboardCard from '../../components/Cards/DashboardCard';
import {Svgs} from '../../assets/Svgs/Svgs';
import BarChartForWorker from '../../components/Charts/BarChartForWorker';
import CalendarSwitcher from '../../components/Calender/CalendarSwitcher';
import DepartmentMemberCard from '../../components/Cards/DepartmentMemberCard';
import DepartmentDetailsCard from '../../components/Cards/DepartmentDetailsCard';
import {Images} from '../../assets/Images/Images';
import {useTranslation} from 'react-i18next';

const DepartmentDetails = ({navigation, route}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const status = route.params?.status || 'Invited';

  const handleContinue = () => {};
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={'Design Department'}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerContainer}
        />
        <FlatList
          data={DepartmentData}
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
            />
          )}
        />

        <View style={styles.statusContainer}>
          <WorkerStatus
            name={'Status'}
            status={status}
            nameTextStyle={styles.statusText}
          />
          <View style={[styles.rowViewSB, {marginTop: hp(0.5)}]}>
            <Text style={styles.statusText}>{t('Created')}</Text>
            <Text style={styles.value}>12 May, 2025</Text>
          </View>
        </View>
        <DepartmentDetailsCard
          department={{
            fullName: 'Design',
            id: 'Dep-123-908',
            HOD: 'Brooklyn Simmons',
            image: Images.artist1,
            Members: '28',
            Projects: '12',
            Tasks: '28',
            country: 'Spain',
            province: 'Comunidad de Madrid',
            city: 'Madrid',
            postalCode: '28001',
            street: 'Calle de Alcalá, 45, Piso 3B',
          }}
        />

        <View style={[styles.tabsContainer]}>
          <Text style={[styles.reportHeading]}>
            {t('Department Performance')}
          </Text>
          <BarChartForWorker />
          <View style={styles.rowViewSB}>
            <View style={styles.rowView}>
              <View
                style={[styles.iconWrapper, {backgroundColor: '#4BCE97'}]}
              />
              <Text style={[styles.ChartText]}>{t('Task Completion')}</Text>
            </View>
            <View style={styles.rowView}>
              <View
                style={[styles.iconWrapper, {backgroundColor: '#FEA362'}]}
              />
              <Text style={[styles.ChartText]}>{t('Attendance')}</Text>
            </View>
            <View style={styles.rowView}>
              <View
                style={[styles.iconWrapper, {backgroundColor: '#9F8FEF'}]}
              />
              <Text style={[styles.ChartText]}>{t('Expense')}</Text>
            </View>
          </View>
          <CalendarSwitcher />
        </View>
        <View style={styles.tabsContainer}>
          <View style={styles.rowViewSB}>
            <Text
              style={[
                styles.reportHeading,
                {borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0},
              ]}>
              {t('Department Members')}
            </Text>
            {isDarkMode ? (
              <Svgs.searchD height={hp(2.5)} width={hp(2.5)} />
            ) : (
              <Svgs.SearchL height={hp(2.5)} width={hp(2.5)} />
            )}
          </View>
          <View>
            {departmentMembers.map((item, index) => (
              <DepartmentMemberCard item={item} key={index} />
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.btnContainer}>
        <CustomButton
          text={'Edit'}
          onPress={handleContinue}
          textStyle={styles.continueButtonText}
          containerStyle={[styles.continueButton]}
        />
      </View>
    </View>
  );
};

export default DepartmentDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    statusContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(4),
      padding: wp(2),
      marginVertical: wp(1.5),
      borderRadius: wp(2),
    },
    statusText: {
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontSize: RFPercentage(1.9),
    },
    value: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(1.9),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hp(0.5),
      marginBottom: hp(1),
    },
    listContainer: {
      paddingHorizontal: wp(5),
    },
    flatListContainer: {
      marginBottom: wp(1.5),
      marginTop: wp(3),
      // margin: wp(4),
    },
    tabsContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginBottom: hp(2),
      borderRadius: wp(2),
      padding: wp(3),
      marginHorizontal: wp(4),
      marginBottom: hp(2),
    },
    ChartText: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },

    iconWrapper: {
      height: hp(2),
      width: hp(2),
      borderRadius: hp(2.25),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },

    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,

      paddingVertical: wp(4),
      paddingHorizontal: wp(5),
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
      fontSize: RFPercentage(1.9),
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryBtn.TextColor
      //   : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    cancelBtn: {
      backgroundColor: isDarkMode ? Colors.error : Colors.error,
    },

    reportHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(1.8),
      //   width: '70%',
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      paddingBottom: hp(1),
    },
    rowView: {flexDirection: 'row', alignItems: 'center'},
  });
