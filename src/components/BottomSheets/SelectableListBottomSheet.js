import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useSelector} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs'; // Assuming building icon etc. come from here
import TxtInput from '../TextInput/Txtinput';
import CustomButton from '../Buttons/customButton';
import { useTranslation } from 'react-i18next';

const SelectableListBottomSheet = ({
  refRBSheet,
  data = [],
  onItemToggle,
  selectedItems = [],
  onContinue,
  sheetTitle = 'Select Project',
  searchPlaceholder = 'Search',
  svg,
}) => {
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const [search, setSearch] = useState('');

  const styles = dynamicStyles(isDarkMode);

  const filteredData = data.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );



  return (
    <RBSheet
      ref={refRBSheet}
      height={hp('60%')}
      openDuration={300}
      closeOnPressMask={true}
      draggable={true}
      closeOnPressBack={true}
      customStyles={{
        container: {
          borderTopLeftRadius: wp('6%'),
          borderTopRightRadius: wp('6%'),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.backgroundColor
            : Colors.lightTheme.backgroundColor,
          paddingBottom: hp('2%'),
        },
      }}>
      <View style={styles.sheetContent}>
        {/* Header */}
        <View style={{paddingHorizontal: wp('5%'), flex: 1}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(sheetTitle)}</Text>
            <TouchableOpacity onPress={() => refRBSheet.current.close()}>
              <MaterialCommunityIcons
                name="close"
                size={RFPercentage(3)}
                color={
                  isDarkMode
                    ? Colors.darkTheme.secondryTextColor
                    : Colors.lightTheme.secondryTextColor
                }
              />
            </TouchableOpacity>
          </View>

          <TxtInput
            placeholder={t('Search')}
            svg={
              isDarkMode ? (
                <Svgs.searchD height={hp(2.5)} width={hp(2.5)} />
              ) : (
                <Svgs.SearchL height={hp(2.5)} width={hp(2.5)} />
              )
            }
            onChangeText={searchQuery => setSearch(searchQuery)}
            rightIcon={search.length > 0 && 'close-circle-outline'}
            rightIconSize={wp(6)}
            rightBtnStyle={{width: wp(8), backgroundColor: 'transparent'}}
            rightIconPress={() => setSearch('')}
            value={search}
            containerStyle={{
              backgroundColor: isDarkMode
                ? Colors.darkTheme.input
                : Colors.lightTheme.input,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{flex: 1}}
            contentContainerStyle={{paddingTop: hp('2%'), flexGrow: 1}}>
            {filteredData.map((item, index) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => onItemToggle(item.id)}>
                  {isSelected ? (
                    <Svgs.checked
                      height={hp(2.5)}
                      width={hp(2.5)}
                      style={{marginTop: hp(0.6)}}
                    />
                  ) : (
                    <Svgs.check
                      height={hp(3)}
                      width={hp(3)}
                      style={{marginTop: hp(0.6)}}
                    />
                  )}
                  {/* <MaterialCommunityIcons
                    name={
                      isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
                    }
                    size={RFPercentage(3)}
                    color={
                      isSelected ? Colors.darkTheme.primaryColor : '#B5B5B5'
                    }
                    style={!svg && {marginRight: wp(4)}}
                  /> */}

                  {svg && <View style={styles.iconWrapper}>{svg}</View>}

                  <Text style={styles.itemText}>{t(item.title)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Continue Button */}
        <View style={styles.btnContainer}>
          <CustomButton
            containerStyle={styles.continueButton}
            text={'Continue'}
            textStyle={styles.continueButtonText}
            onPress={onContinue}
          />
        </View>
      </View>
    </RBSheet>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    sheetContent: {
      paddingTop: hp('2%'),
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp('1.5%'),
      paddingHorizontal: wp('5%'),
    },
    title: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
      borderRadius: 10,
      paddingHorizontal: wp('3%'),
      marginBottom: hp('2%'),
      height: hp('5.5%'),
    },
    searchInput: {
      flex: 1,
      marginLeft: wp('2%'),
      fontFamily: Fonts.PoppinsRegular,
      fontSize: RFPercentage(2),
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
      paddingVertical: hp('1.5%'),
    },
    iconWrapper: {
      marginHorizontal: wp(2),
    },
    itemText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    btnContainer: {
      paddingHorizontal: wp('5%'),
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
    },
    continueButton: {
      backgroundColor: Colors.darkTheme.primaryColor,
      paddingVertical: hp('1.2%'),
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp('2%'),
    },
    continueButtonText: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
    },
  });

export default SelectableListBottomSheet;
