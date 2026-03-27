import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {Svgs} from '../../assets/Svgs/Svgs';
import {
  workers,
  DashboardRequestsData,
  // documentsGlobalSearchData,
} from '../../Constants/DummyData';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import {useTranslation} from 'react-i18next';
import { pxToPercentage } from '../../utils/responsive';

const GlobalSearch = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const storedSearches = await AsyncStorage.getItem('recentSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  };

  const updateRecentSearches = async search => {
    let updatedSearches = [
      search,
      ...recentSearches.filter(item => item !== search),
    ];
    if (updatedSearches.length > 3) {
      updatedSearches = updatedSearches.slice(0, 3);
    }
    await AsyncStorage.setItem(
      'recentSearches',
      JSON.stringify(updatedSearches),
    );
    setRecentSearches(updatedSearches);
  };

  const handleSearch = text => {
    setSearchText(text);
    if (text.trim().length === 0) return;
    updateRecentSearches(text);
  };

  const clearRecentSearches = async () => {
    await AsyncStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  const lowerSearch = searchText.toLowerCase();

 
  const filteredDocuments = DashboardRequestsData.filter(item =>
    item.Request.toLowerCase().includes(lowerSearch),
  );

  const filteredClients = workers.filter(item =>
    item.name.toLowerCase().includes(lowerSearch),
  );

  const filteredCommission = DashboardRequestsData.filter(item =>
    item.Request.toLowerCase().includes(lowerSearch),
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          {isDarkMode ? (
            <Svgs.searchD height={hp(2.8)} />
          ) : (
            <Svgs.SearchL height={hp(2.8)} />
          )}
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search"
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchText.length === 0 && recentSearches.length > 0 && (
        <View style={styles.recentSearchContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Icon
                name="close"
                size={18}
                color={isDarkMode ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          </View>
          {recentSearches.map((item, index) => (
            <Text key={index} style={styles.recentItem}>
              {item}
            </Text>
          ))}
        </View>
      )}

      {searchText.length > 0 &&
      filteredDocuments.length === 0 &&
      filteredClients.length === 0 &&
      filteredCommission.length === 0 ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={styles.noResultContainer}>
          <Svgs.NoResult />
          <Text style={styles.noResultTitle}>No Result Found!</Text>
          <Text style={styles.noResultSubtitle}>
            Please try searching using alternative keywords.
          </Text>
        </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{paddingBottom: hp(2)}}>
          
          {filteredDocuments.length > 0 && (
            <SectionBlock
              title={t('Documents')}
              data={filteredDocuments}
              nameKey="Request"
              statusKey="status"
              styles={styles}
            />
          )}
          {filteredClients.length > 0 && (
            <SectionBlock
              title={t('Client Acquisition')}
              data={filteredClients}
              nameKey="name"
              statusKey="status"
              styles={styles}
            />
          )}
          {filteredCommission.length > 0 && (
            <SectionBlock
              title={t('Commission')}
              data={filteredCommission}
              nameKey="Request"
              statusKey="status"
              styles={styles}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const SectionBlock = ({title, data, nameKey, statusKey, styles}) => (
  <View style={styles.logsContainer}>
    <View style={styles.rowSb}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <TouchableOpacity>
        <Svgs.ChevronFilled />
      </TouchableOpacity>
    </View>
    <View style={[styles.rowSb, styles.workerStatusContainer]}>
      <Text style={styles.SubHeading}>Name</Text>
      <Text style={styles.SubHeading}>Status</Text>
    </View>
    {data.map((item, index) => (
      <WorkerStatus
        key={index.toString()}
        name={item[nameKey]}
        status={item[statusKey]}
        containerStyle={{borderBottomWidth: 0}}
      />
    ))}
  </View>
);

export default GlobalSearch;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      marginBottom: hp(2),
      paddingVertical: hp(2),

      backgroundColor: isDarkMode? Colors.darkTheme.secondryColor : Colors.lightTheme.backgroundColor
    },
    backButton: {
      marginRight: wp(3),
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      borderRadius: wp(2),
      paddingHorizontal: wp(3),
      height: hp(6),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    searchInput: {
      flex: 1,
      fontSize: RFPercentage(2),
      color: isDarkMode ? '#fff' : '#000',
      fontFamily: Fonts.PoppinsRegular,
    },
    recentSearchContainer: {
      paddingHorizontal: wp(4),
      marginBottom: hp(2),
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    recentTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode ? '#fff' : '#000',
    },
    recentItem: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode ? '#fff' : '#000',
      marginBottom: hp(0.5),
    },
    sectionHeading: {
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2.2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    SubHeading: {
      fontFamily: Fonts.PoppinsMedium,
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    rowSb: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    workerStatusContainer: {
      marginTop: hp(2),
      paddingBottom: hp(0.5),
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      marginBottom: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    noResultContainer: {
      // flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
        alignSelf:'center',
        paddingVertical: hp(5),
        borderRadius: wp(3),
    },
    logsContainer: {
      paddingTop: hp(2),
      paddingHorizontal: wp(5),
      paddingBottom: hp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: wp(5),
      marginHorizontal: wp(5),
      marginBottom: hp(2),
    },
    noResultTitle: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsBold,
      color: isDarkMode ? Colors.darkTheme.primaryTextColor : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      marginTop: hp(3),
    },
    noResultSubtitle: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode ? Colors.darkTheme.secondryTextColor : Colors.lightTheme.secondryTextColor,
      textAlign: 'center',
      paddingHorizontal: wp(10),
      width: wp(90),
    },
  });
