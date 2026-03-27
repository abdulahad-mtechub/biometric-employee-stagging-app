import React, {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  FlatList,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import SelectableListBottomSheet from '../../components/BottomSheets/SelectableListBottomSheet';
import CalendarBtn from '../../components/Buttons/CalenderBtn';
import CustomCalendar from '../../components/Calender/CustomCalender';
import DashboardCard from '../../components/Cards/DashboardCard';
import StatusCardItem from '../../components/Cards/StatusCardItem';
import SymbolCard from '../../components/Cards/SymbolCard';
import StackHeader from '../../components/Header/StackHeader';
import TabSelector from '../../components/TabSelector/TabSelector';
import {
  projects,
  projectsData,
  TaskManagementData,
  tasksData,
  TaskSymbols,
} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useButtonColors} from '../../Constants/colorHelper';
import {pxToPercentage} from '../../utils/responsive';

const TaskManagement = ({navigation}) => {
  const {isDarkMode, getButtonColor} = useButtonColors();
  const {isDarkMode: isDarkModeTheme} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkModeTheme);
  const sheetRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('All Projects');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
  };
  const isProjects = selectedTab === 'All Projects';
  const isTasks = selectedTab === 'All Tasks';
  const isCalendar = selectedTab === 'Calendar View';
  const renderArray = isProjects ? projectsData : tasksData;
  const renderListHeading = isProjects ? 'All Projects' : 'All Tasks';
  const SelectableSheetRef = useRef(null);

  const toggleItem = id => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };
  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.key}>{t(label)}</Text>

      <Text style={[styles.value]}>{value}</Text>
    </View>
  );
  return (
    <View style={styles.container}>
      {isProjects || isTasks ? (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => sheetRef.current.open()}>
          <Svgs.whitePlus height={hp(3)} width={hp(3)} />
        </TouchableOpacity>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <StackHeader
          title={'Task Management'}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />
        <TabSelector
          tabs={['All Projects', 'All Tasks', 'Calendar View']}
          selectedTab={selectedTab}
          onTabPress={setSelectedTab}
        />
        {isProjects || isTasks ? (
          <View style={styles.contentContainerStyle}>
            <FlatList
              data={TaskManagementData}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.flatListContainer}
              renderItem={({item}) => (
                <DashboardCard
                  title={item.title}
                  value={item.value}
                  subText={item.subText}
                />
              )}
            />

            <View style={[styles.rowViewSB, {marginVertical: hp(3)}]}>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.dateRangeButton}
                  onPress={() => {}}>
                  <Ionicons
                    name="filter-outline"
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                  <Text style={styles.dateRangeButtonText}>{t('Filter')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {isProjects && (
              <CalendarBtn onYearChange={handleYearChange} mode={true} />
            )}

            <SymbolCard
              heading={'Status Symbols'}
              array={TaskSymbols}
              contianerStyle={{
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.secondryColor
                  : Colors.lightTheme.backgroundColor,
              }}
            />
            <View style={styles.listContainer}>
              <View style={styles.rowViewSB}>
                <Text style={[styles.title]}>{t(renderListHeading)}</Text>
                <Text style={[styles.title]}>{t('Date - Time')}</Text>
              </View>
              {renderArray.map((item, index) => (
                <StatusCardItem
                  item={item}
                  key={index}
                  type={'Tasks'}
                  containerStyle={{
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode
                      ? Colors.darkTheme.BorderGrayColor
                      : Colors.lightTheme.BorderGrayColor,
                    paddingVertical: hp(1),
                  }}
                  onPress={() => {
                    if (isProjects) {
                      navigation.navigate(SCREENS.PROJECTDETAILS, {
                        item: item,
                      });
                    } else {
                      navigation.navigate(SCREENS.TASKDETAILS, {
                        item: item,
                      });
                    }
                  }}
                />
              ))}
            </View>
          </View>
        ) : isCalendar ? (
          <View style={styles.contentContainerStyle}>
            <CustomCalendar />
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.heading}>{t('Task Details')}</Text>
                <Svgs.ChevronFilled height={wp(7)} width={wp(7)} />
              </View>
              <Row label="Assigned" value={'28 Apr, 2025 - 12:24 PM'} />
              <Row label="Start" value={'29 Apr, 2025 - 04:11 PM'} />
              <Row label="Deadline" value={'01 May, 2025 - 03:30 PM'} />
              <Row label="Name" value={'TK-02-123'} />
              <Row label="Project" value={'PR-029-1204'} />
              <Row label="Assigned By" value={'John Doe'} />
            </View>
          </View>
        ) : null}
      </ScrollView>
      <ReusableBottomSheet
        height={hp('20%')}
        refRBSheet={sheetRef}
        sheetTitle="Select An Option"
        options={[
          // {
          //   icon: <Svgs.addProject height={hp(4)} />,
          //   title: 'Add Project',
          //   onPress: () => {
          //     sheetRef.current?.close();
          //     SelectableSheetRef.current?.open();
          //   },
          // },
          {
            icon: <Svgs.createTask height={hp(4)} />,
            title: 'Create Task',
            onPress: () => {
              sheetRef.current?.close();
              navigation.navigate(SCREENS.CREATETASK, {
                type: 'Task',
              });
            },
          },
        ]}
      />
      <SelectableListBottomSheet
        refRBSheet={SelectableSheetRef}
        data={projects}
        selectedItems={selectedProjects}
        onItemToggle={toggleItem}
        svg={<Svgs.project height={hp(4)} />}
        onContinue={() => {
          SelectableSheetRef.current?.close();
          navigation.navigate(SCREENS.CREATETASK, {
            type: 'Project',
          });
        }}
      />
    </View>
  );
};

export default TaskManagement;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    listContainer: {
      //   paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(2),
      borderRadius: wp(4),
    },
    flatListContainer: {
      marginTop: hp(2),
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(1),
      marginLeft: wp(1.5),
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 8,
    },
    dateRangeButtonText: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(pxToPercentage(11)),
      color: '#FFF',
    },
    TabHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    contentContainerStyle: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
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
    floatingButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      width: wp(13),
      height: wp(13),
      borderRadius: wp(100),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: hp(5),
      right: wp(5),
      elevation: 10,
      zIndex: 1000,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    heading: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
    },
    value: {
      fontSize: RFPercentage(1.7),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingVertical: wp(2),
      paddingHorizontal: wp(4),
      marginVertical: wp(1.5),
      borderRadius: wp(2),
    },
  });
