import React, {useRef, useState} from 'react';
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
import {
  departments,
  Departments,
  Teams,
  workerData,
} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import ReusableBottomSheet from '../../components/BottomSheets/ReusableBottomSheet';
import SelectableListBottomSheet from '../../components/BottomSheets/SelectableListBottomSheet';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import TabSelector from '../../components/TabSelector/TabSelector';

const Worker = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const [selectedDep, setSelectedDep] = useState([]);
  const SelectableSheetRef = useRef(null);
  const btmSheetRef = useRef(null);
  const {t} = useTranslation();
  const [selectedTab, setSelectedTab] = useState('Workers');

  const toggleItem = id => {
    setSelectedDep(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  // const workerData = [
  //   {name: 'Brooklyn Simmons', status: t('Invited')},
  //   {name: 'Zenith Retail Group Pty. Ltd.', status: t('Request')},
  //   {name: 'Esther Howard', status: t('Invited')},
  //   {name: 'Jane Cooper', status: t('Active')},
  //   {name: 'Jacob Jones', status: t('Inactive')},
  //   {name: 'Robert Fox', status: t('Active')},
  //   {name: 'John Doe', status: t('Request')},
  // ];

  // const Departments = [
  //   {name: t('Design Department'), status: t('Active')},
  //   {name: t('Service Department'), status: t('Active')},
  //   {name: t('Marketing Department'), status: t('Active')},
  //   {name: t('HR Department'), status: t('Active')},
  //   {name: t('Development Department'), status: t('Inactive')},
  //   {name: t('Departamento de Desarrollot'), status: t('Active')},
  // ];

  // const onFloatingButtonPress = () => {
  //  selectedTab === 'Workers' ? navigation.navigate(SCREENS.ADDWORKER)
  //  :selectedTab === 'Departments' ? navigation.navigate(SCREENS.ADDDEPARTMENT)
  //  :selectedTab === 'Teams' ? SelectableSheetRef.current?.open():null
  // };

  //   const Teams = [
  //   {name: 'Teams 3', Dep: t('Design Development'), status: t('Active')},
  //   {name: 'Team 2',Dep: t('Design Development'), status: t('Active')},
  //   {name: 'Team 4',Dep: t('Design Development'), status: t('Active')},
  //   {name: 'Team 3', Dep: t('Design Development'),status: t('Active')},
  //   {name: 'Team 1',Dep: t('Design Development'), status: t('Inactive')},
  //   {name: 'Team 2', Dep: t('Design Development'),status: t('Active')},
  // ];
  return (
    <ScrollView style={styles.container} contentContainerStyle={{flexGrow: 1}}>
      <View style={styles.headerContainer}>
        <Text style={[styles.ScreenHeading]}>{t('Worker Management')}</Text>
        <View style={styles.iconContainer}>
          {isDarkMode ? <Svgs.searchD /> : <Svgs.SearchL />}
          <TouchableOpacity>
            {isDarkMode ? (
              <Svgs.BellD height={hp(4)} />
            ) : (
              <Svgs.BellL height={hp(4)} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <TabSelector
        tabs={['Workers', 'Departments', 'Teams']}
        selectedTab={selectedTab}
        onTabPress={setSelectedTab}
      />

      {selectedTab === 'Workers' ? (
        <View style={{paddingHorizontal: wp(3)}}>
          <View style={[styles.workerStatusContainer, {borderBottomWidth: 0}]}>
            <Text style={styles.SubHeading}>{t('Worker Name')}</Text>
            <Text style={styles.SubHeading}>{t('Status')}</Text>
          </View>
          {workerData.map((item, index) => (
            <WorkerStatus
              key={index.toString()}
              name={item.name}
              status={item.status}
              onPress={() => {
                navigation.navigate(SCREENS.WORKERDETAILS, {
                  status: item.status,
                });
              }}
              showIcon={true}
            />
          ))}
        </View>
      ) : selectedTab === 'Departments' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.rowSb}>
            <Text
              style={[
                styles.SubHeading,
                {fontFamily: Fonts.PoppinsSemiBold, fontSize: RFPercentage(2)},
              ]}>
              {t('All Departments')}
            </Text>
            <Svgs.filter />
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.workerStatusContainer}>
              <Text style={styles.SubHeading}>{t('Department Name')}</Text>
              <Text style={styles.SubHeading}>{t('Status')}</Text>
            </View>
            {Departments.map((item, index) => (
              <WorkerStatus
                key={index.toString()}
                name={item.name}
                status={item.status}
                showIcon={true}
                onPress={() => {
                  navigation.navigate(SCREENS.DEPARTMENTDETAILS, {
                    status: item.status,
                  });
                }}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.sectionContainer}>
          <View style={styles.rowSb}>
            <Text
              style={[
                styles.SubHeading,
                {fontFamily: Fonts.PoppinsSemiBold, fontSize: RFPercentage(2)},
              ]}>
              {t('All Teams')}
            </Text>
            <Svgs.filter />
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.workerStatusContainer}>
              <Text style={styles.SubHeading}>{t('Teams Name')}</Text>
              <Text style={styles.SubHeading}>{t('Status')}</Text>
            </View>
            {Teams.map((item, index) => (
              <WorkerStatus
                key={index.toString()}
                name={item.name}
                Dep={item.Dep}
                status={item.status}
                nameTextStyle={{
                  fontFamily: Fonts.PoppinsSemiBold,
                  color: isDarkMode
                    ? Colors.darkTheme.primaryTextColor
                    : Colors.lightTheme.primaryTextColor,
                }}
                showIcon={true}
                onPress={() => {
                  navigation.navigate(SCREENS.TEAMDETAILS, {
                    status: item.status,
                  });
                }}
              />
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => btmSheetRef.current?.open()}>
        <Svgs.whitePlus />
      </TouchableOpacity>

      <ReusableBottomSheet
        height={hp('33%')}
        refRBSheet={btmSheetRef}
        sheetTitle={'Select An Option'}
        options={[
          {
            icon: <Svgs.WorkerActive />,
            title: 'Worker',

            onPress: () => {
              btmSheetRef.current?.close();
              navigation.navigate(SCREENS.ADDWORKER);
            },
          },
          {
            icon: <Svgs.DepartmentBlue height={hp(4)} />,
            title: 'Departments',

            onPress: () => {
              btmSheetRef.current?.close();
              navigation.navigate(SCREENS.ADDDEPARTMENT);
            },
          },
          {
            icon: <Svgs.Teams height={hp(4)} />,
            title: 'Teams',

            onPress: () => {
              btmSheetRef.current?.close();
              SelectableSheetRef.current?.open();
            },
          },
        ]}
      />

      <SelectableListBottomSheet
        refRBSheet={SelectableSheetRef}
        data={departments}
        selectedItems={selectedDep}
        onItemToggle={toggleItem}
        sheetTitle={'Select Project'}
        onContinue={() => {
          SelectableSheetRef.current?.close();
          navigation.navigate(SCREENS.ADDTEAM, {
            selectedDep: selectedDep,
          });
        }}
        svg={<Svgs.DepartmentBlue height={hp(3)} width={wp(6)} />}
      />
    </ScrollView>
  );
};

export default Worker;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      justifyContent: 'space-between',
      marginBottom: hp(3),
    },
    ScreenHeading: {
      paddingTop: hp(1.5),
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },

    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(5),
    },
    workerStatusContainer: {
      marginTop: hp(2),

      marginBottom: hp(1),

      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    floatingButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      width: wp(15),
      height: wp(15),
      borderRadius: wp(100),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: hp(5),
      right: wp(5),
      elevation: 10,
    },
    rowSb: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(4),
      marginTop: hp(2),
      borderRadius: wp(2),
    },
    contentContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      padding: wp(3),
      borderRadius: wp(2),
      marginTop: hp(2),
    },
    sectionContainer: {
      paddingHorizontal: wp(3),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
      flex: 1,
    },
  });
