import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Switch,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Colors} from '../../Constants/themeColors';
import {Fonts} from '../../Constants/Fonts';
import {Svgs} from '../../assets/Svgs/Svgs';
import StackHeader from '../../components/Header/StackHeader';
import {navigationRef} from '../../utils/navigationRef';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {Images} from '../../assets/Images/Images';
import CustomSwitch from '../../components/Buttons/CustomSwitch';

const mediaData = {
  today: [
    'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  ],
  yesterday: [
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=988&q=80',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=962&q=80',
    'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  ],
};

const ChatProfileScreen = ({navigation}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'darkTheme' : 'lightTheme'];
  const {t} = useTranslation();
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const [MuteNotification, setMuteNotification] = useState(false);

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <StackHeader
        title={t('Chat Details')}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.2),
          fontFamily: Fonts.PoppinsMedium,
        }}
        headerStyle={styles.headerStyle}
        onBackPress={() => navigation.goBack()}
      />

      {/* Profile Card */}
      <View style={[styles.profileCard]}>
        <View style={styles.avatarPlaceholder}>
          <Image source={Images.placeholderImg} style={styles.avatar} />
        </View>
        <Text style={[styles.nameText, {color: theme.primaryTextColor}]}>
          John Doe
        </Text>
        <View style={styles.emailRow}>
          <Text style={[styles.emailText, {color: theme.secondryTextColor}]}>
            Johndoe@gmail.com
          </Text>
          <TouchableOpacity style={{marginLeft: wp(2)}}>
            <Svgs.copyL />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options */}
      <View style={[styles.card]}>
        <View style={styles.row}>
          <Svgs.MuteNotificationL />
          <Text style={[styles.optionText, {color: theme.primaryTextColor}]}>
            {t('Mute Notification')}
          </Text>
          <View style={{flex: 1}} />
          <CustomSwitch
            value={MuteNotification}
            onValueChange={setMuteNotification}
          />
        </View>

        <View style={[styles.row, {marginTop: hp(2)}]}>
          <Svgs.galleryBlack />
          <Text style={[styles.optionText, {color: theme.primaryTextColor}]}>
            {t('Media')}
          </Text>
          <View style={{flex: 1}} />
          <Text style={[styles.countText, {color: theme.primaryTextColor}]}>
            152
          </Text>
        </View>

        {/* Media Grid */}
        <Text style={[styles.sectionTitle, {color: theme.secondryTextColor}]}>
          {t('Today')}
        </Text>
        <FlatList
          horizontal
          data={mediaData.today}
          keyExtractor={(_, index) => 'today-' + index}
          renderItem={({item}) => (
            <Image source={{uri: item}} style={styles.mediaImage} />
          )}
          showsHorizontalScrollIndicator={false}
        />

        <Text style={[styles.sectionTitle, {color: theme.secondryTextColor}]}>
          {t('Yesterday')}
        </Text>
        <FlatList
          horizontal
          data={mediaData.yesterday}
          keyExtractor={(_, index) => 'yesterday-' + index}
          renderItem={({item}) => (
            <Image source={{uri: item}} style={styles.mediaImage} />
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerStyle: {
      paddingTop: hp(2),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderBottomWidth: 1,
    },
    profileCard: {
      borderRadius: wp(3),
      alignItems: 'center',
      paddingVertical: hp(3),
      marginBottom: hp(2.5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      margin: wp(4),
    },
    avatar: {
      width: wp(27),
      height: wp(35),
    },
    avatarPlaceholder: {
      width: wp(35),
      height: wp(35),
      borderRadius: wp(100),
      backgroundColor: '#D9D9D9',
      marginBottom: hp(1.5),
      alignItems: 'center',
    },
    nameText: {
      fontSize: RFPercentage(2.2),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(0.5),
    },
    emailText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
    },
    card: {
      borderRadius: wp(3),
      padding: wp(4),
      margin: wp(4),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      marginLeft: wp(2),
    },
    countText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
    },
    sectionTitle: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    mediaImage: {
      width: wp(18),
      height: wp(18),
      borderRadius: wp(2),
      marginRight: wp(2),
    },
  });

export default ChatProfileScreen;
