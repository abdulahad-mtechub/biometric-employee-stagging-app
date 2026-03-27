import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {Colors} from '../../Constants/themeColors';
import {useSelector} from 'react-redux';
import StackHeader from '../../components/Header/StackHeader';
import UserInfoCard from '../../components/Cards/UserInfoCard';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {SCREENS} from '../../Constants/Screens';
import EmploymentDetailsCard from '../../components/Cards/EmploymentDetailsCard';
import CustomButton from '../../components/Buttons/customButton';
import {FlatList} from 'react-native-gesture-handler';
import {
  attendanceData,
  AttendanceSymbols,
  dashboardDataV2,
  documentsData,
  DocumentsSymbols,
  loanData,
  paymentsData,
  PaymentsSymbols,
  requestsData,
  RequestSymbols,
  StatusSymbols,
  Symbols,
  tasksData,
  TaskSymbols,
} from '../../Constants/DummyData';
import DashboardCard from '../../components/Cards/DashboardCard';
import TabSelector from '../../components/TabSelector/TabSelector';
import {Svgs} from '../../assets/Svgs/Svgs';
import SymbolCard from '../../components/Cards/SymbolCard';
import CalendarBtn from '../../components/Buttons/CalenderBtn';
import StatusCardItem from '../../components/Cards/StatusCardItem';
import LoanCard from '../../components/Cards/LoanCard';
import BarChartForWorker from '../../components/Charts/BarChartForWorker';
import CalendarSwitcher from '../../components/Calender/CalendarSwitcher';
import {useTranslation} from 'react-i18next';

const WorkerDetails = ({navigation, route}) => {
  const {t} = useTranslation();

  const tabs = [
    'Attendance',
    'Tasks',
    'Requests',
    'Payments',
    'Documents',
    'Loans',
    'Reports & Statistics',
  ];
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const status = route.params?.status || 'Invited';
  const [selectedTab, setSelectedTab] = useState('Attendance');

  const handleContinue = () => {};
  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
    // You can update your calendar data based on newYear here
  };

  const tabHeading =
    selectedTab === 'Attendance'
      ? 'All Punches'
      : selectedTab === 'Tasks'
      ? 'All Tasks'
      : selectedTab === 'Requests'
      ? 'All Requests'
      : selectedTab === 'Payments'
      ? 'All Payments'
      : selectedTab === 'Documents'
      ? 'All Documents'
      : selectedTab === 'Loans'
      ? 'All Loans'
      : 'All Reports & Statistics';

  const SymbolsArray =
    selectedTab === 'Attendance'
      ? AttendanceSymbols
      : selectedTab === 'Tasks'
      ? TaskSymbols
      : selectedTab === 'Requests'
      ? RequestSymbols
      : selectedTab === 'Payments'
      ? PaymentsSymbols
      : DocumentsSymbols;

  const dataContainerHeading =
    selectedTab === 'Attendance'
      ? 'Monthly Punch'
      : selectedTab === 'Tasks'
      ? 'All Tasks'
      : selectedTab === 'Requests'
      ? 'Name'
      : selectedTab === 'Payments'
      ? 'Name'
      : selectedTab === 'Documents'
      ? 'Name'
      : selectedTab === 'Loans'
      ? 'Loans'
      : 'Reports & Statistics';

  const dataContainerHeading2 =
    selectedTab === 'Attendance'
      ? 'Time'
      : selectedTab === 'Tasks'
      ? 'Date - Time'
      : selectedTab === 'Requests'
      ? 'Date - Time'
      : selectedTab === 'Payments'
      ? 'Date - Time'
      : 'Time';

  const renderDataType =
    selectedTab === 'Attendance'
      ? 'Attendance'
      : selectedTab === 'Tasks'
      ? 'Tasks'
      : selectedTab === 'Requests'
      ? 'Requests'
      : selectedTab === 'Payments'
      ? 'Payments'
      : 'Documents';

  const renderArray =
    selectedTab === 'Attendance'
      ? attendanceData
      : selectedTab === 'Tasks'
      ? tasksData
      : selectedTab === 'Requests'
      ? requestsData
      : selectedTab === 'Payments'
      ? paymentsData
      : documentsData;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={'John Doe'}
          headerTxtStyle={{textAlign: 'left'}}
          onBackPress={() => navigation.goBack()}
          headerStyle={{
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
          }}
        />
        {status !== 'Invited' && (
          <FlatList
            data={dashboardDataV2}
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
        )}

        <View style={styles.statusContainer}>
          <WorkerStatus
            name={t('Status')}
            status={status}
            nameTextStyle={styles.statusText}
          />
          <View style={[styles.rowViewSB, {marginTop: hp(0.5)}]}>
            <Text style={styles.statusText}>{t('Registered')}</Text>
            <Text style={styles.value}>12 May, 2025</Text>
          </View>
        </View>
        <UserInfoCard
          user={{
            fullName: 'John Doe',
            dob: '18 Aug, 2000',
            email: 'Johndoe@gmail.com',
            phone: '+34 612 345 678',
            country: 'Spain',
            province: 'Comunidad de Madrid',
            city: 'Madrid',
            postalCode: '28001',
            street: 'Calle de Alcalá, 45, Piso 3B',
          }}
        />
        <EmploymentDetailsCard
          data={{
            workingId: 'AB-193-90',
            department: 'Construction',
            designation: 'Sr. Civil Engineer',
            employmentType: 'Permanent',
            salary: '$30K',
            hiringDate: '18 Feb, 2022',
            shift: 'Day Shift',
            zones: ['Northern Europe', 'Southern Europe'],
            countries: ['Spain', 'Italy', 'Portugal'],
            cities: ['All'],
          }}
        />
        <View style={styles.tabsContainer}>
          <TabSelector
            tabs={tabs}
            selectedTab={selectedTab}
            onTabPress={setSelectedTab}
            isScrollable={true}
          />
        </View>

        <View
          style={[
            styles.tabsContainer,
            {padding: wp(3), marginHorizontal: wp(4), marginBottom: 0},
          ]}>
          {selectedTab === 'Reports & Statistics' ? (
            <Text style={[styles.reportHeading]}>
              {t('Task Completion Vs Attendance Vs Expense Request')}
            </Text>
          ) : (
            <View style={styles.rowViewSB}>
              <Text style={styles.TabHeading}>{t(tabHeading)}</Text>
              <TouchableOpacity>
                <Svgs.filter />
              </TouchableOpacity>
            </View>
          )}

          {selectedTab !== 'Loans' && selectedTab !== 'Reports & Statistics' ? (
            <View>
              <SymbolCard heading={'Status Symbols'} array={SymbolsArray} />
              <View style={styles.cardContainer}>
                <CalendarBtn onYearChange={handleYearChange} />
                <View style={styles.rowViewSB}>
                  <Text style={[styles.title]}>{t(dataContainerHeading)}</Text>
                  <Text style={[styles.title]}>{t(dataContainerHeading2)}</Text>
                </View>
                <View style={styles.divider} />

                {renderArray.map((item, index) => (
                  <StatusCardItem
                    item={item}
                    key={index}
                    type={renderDataType}
                  />
                ))}
              </View>
            </View>
          ) : selectedTab === 'Loans' ? (
            loanData.map((loan, index) => (
              <LoanCard
                key={index}
                title={loan.title}
                date={loan.date}
                amount={loan.amount}
                installment={loan.installment}
              />
            ))
          ) : (
            <View>
              <BarChartForWorker />
              <View style={styles.rowViewSB}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[styles.iconWrapper, {backgroundColor: '#4BCE97'}]}
                  />
                  <Text
                    style={[styles.TabHeading, {fontSize: RFPercentage(1.6)}]}>
                    {t('Task Completion')}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[styles.iconWrapper, {backgroundColor: '#FEA362'}]}
                  />
                  <Text
                    style={[styles.TabHeading, {fontSize: RFPercentage(1.6)}]}>
                    {t('Attendance')}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View
                    style={[styles.iconWrapper, {backgroundColor: '#9F8FEF'}]}
                  />
                  <Text
                    style={[styles.TabHeading, {fontSize: RFPercentage(1.6)}]}>
                    {t('Expense')}
                  </Text>
                </View>
              </View>
              <CalendarSwitcher />
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.btnContainer}>
        <CustomButton
          text={status === 'Invited' ? 'Cancel Invite' : 'Edit'}
          onPress={handleContinue}
          textStyle={styles.continueButtonText}
          containerStyle={[
            styles.continueButton,
            status === 'Invited' && styles.cancelBtn,
          ]}
        />
      </View>
    </View>
  );
};

export default WorkerDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
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
      fontSize: RFPercentage(2.2),
    },
    value: {
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(0.5),
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
      borderTopLeftRadius: wp(2),
      borderTopRightRadius: wp(2),
    },
    TabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    title: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(2),
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      marginBottom: hp(2),
    },
    symbolRow: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrapper: {
      height: hp(2),
      width: hp(2),
      borderRadius: hp(2.25),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    symbolText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
    },
    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      //   position: "absolute",
      //   bottom: hp(2.5),
      //   left: wp(0),
      //   right: wp(0),
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
    cardContainer: {
      padding: wp(4),
      borderRadius: wp(3),
      borderWidth: 1,
      marginVertical: wp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    reportHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      width: '70%',
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
  });
