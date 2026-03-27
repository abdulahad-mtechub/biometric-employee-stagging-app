import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {Colors} from '../../Constants/themeColors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TxtInput from '../TextInput/Txtinput';
import CustomButton from '../Buttons/customButton';
import {useNavigation} from '@react-navigation/native';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import {useSelector} from 'react-redux';
import CountryList from 'country-list-with-dial-code-and-flag';
import { RFPercentage } from 'react-native-responsive-fontsize';

const CountryPickerBottomSheet = ({
  refRBSheet,
  location,
  setSelected,
  selectLocation,
  heading,
  showSearch,
  height,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryArray, setCountryArray] = useState(CountryList.getAll());

  const onChangeText = text => {
    setSearchQuery(text);

    if (text.length > 0) {
      const formattedDialCode = text.startsWith('+') ? text : `+${text}`;
      const filteredLocationsByDialCode =
        CountryList.findByDialCode(formattedDialCode);
      const filteredLocationsByKeyword = CountryList.findByKeyword(text);

      setCountryArray(
        filteredLocationsByKeyword || filteredLocationsByDialCode,
      );
    } else {
      setCountryArray(CountryList.getAll());
    }
  };

  const {isDarkMode} = useSelector(state => state.theme);
  const styles = dynamicStyles(isDarkMode);

  const toggleLocationSelection = location => {
    setSelected(location);
    refRBSheet.current.close();
  };

  const filteredLocations = location?.filter(location =>
    location?.Branch?.toLowerCase().includes(searchQuery?.toLowerCase()),
  );

  return (
    <RBSheet
      ref={refRBSheet}
      closeOnDragDown={true}
      closeOnPressMask={true}
      draggable={true}
      height={height || hp(90)}
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      }}>
      <View style={styles.container}>
        {/* <CustomButton
          svg={<Svgs.crossIcon />}
          containerStyle={styles.crossbtn}
          onPress={() => refRBSheet.current.close()}
        /> */}

        <View style={styles.header}>
          <Text style={styles.title}>{heading}</Text>
          {showSearch && (
            <TxtInput
              placeholder={'Search'}
            //   svg={<Svgs.search />}
              onChangeText={searchQuery => onChangeText(searchQuery)}
              rightIcon={searchQuery.length > 0 && 'close-circle-outline'}
              rightIconSize={wp(4)}
              rightBtnStyle={{width: wp(8), backgroundColor: 'transparent'}}
              rightIconPress={() => setSearchQuery('')}
              value={searchQuery}
              containerStyle={{
                height: hp(6),
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.input
                  : Colors.lightTheme.input,
              }}
            />
          )}
        </View>

        <FlatList
          data={countryArray || []}
          //   keyExtractor={(item, index) => (index*3).toString()}
          ListEmptyComponent={
            <View style={styles.ListEmptyComponent}>
              {/* <Svgs.EmptySearch /> */}
            </View>
          }
          renderItem={({item}) => {
            return (
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => toggleLocationSelection(item?.data)}>
                <View style={styles.itemInfo}>
                  <Text style={{fontSize: RFPercentage(3)}} >{item?.data?.flag} </Text>
                  <Text style={styles.locationName}>
                   {`(${item?.data?.code}) ${item?.data?.name}`}
                  </Text>
                </View>
                {selectLocation?.flag === item?.data?.flag && (
                  <Svgs.checked width={wp(6)} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </RBSheet>
  );
};

export default CountryPickerBottomSheet;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      paddingHorizontal: wp(4),
    },
    header: {
      marginTop: hp(0),
      marginBottom: hp(1.25),
    },
    title: {
      fontSize: wp(4.5),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,

      marginBottom: hp(2),
    },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(0.6),
    },
    itemInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationName: {
      fontSize: wp(4),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    ListEmptyComponent: {
      alignSelf: 'center',
      marginTop: hp(10),
      marginBottom: hp(10),
    },
    crossbtn: {
      alignSelf: 'flex-end',
      width: wp(8),
      backgroundColor: 'transparent',
      overFlow: 'hidden',
      //  position: 'absolute',
    },
  });
