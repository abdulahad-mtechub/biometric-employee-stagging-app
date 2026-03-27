import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import StackHeader from '../../components/Header/StackHeader';
import {Fonts} from '../../Constants/Fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useSelector} from 'react-redux';
import {Colors} from '../../Constants/themeColors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import WorkerStatus from '../../components/Cards/WorkerStatus';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import StatusCardItem from '../../components/Cards/StatusCardItem';
import {tasksData} from '../../Constants/DummyData';
import {SCREENS} from '../../Constants/Screens';
import CalendarBtn from '../../components/Buttons/CalenderBtn';
import {Images} from '../../assets/Images/Images';
import TxtInput from '../../components/TextInput/Txtinput';
import {useTranslation} from 'react-i18next';

const BulletList = ({bullets}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={{marginTop: hp(0.5)}}>
      {bullets.map((point, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: hp(0.8),
          }}>
          <Text style={[styles.value, {marginRight: wp(2)}]}>●</Text>
          <Text style={[styles.value, {flex: 1}]}>{point}</Text>
        </View>
      ))}
    </View>
  );
};

const SectionHeader = ({title}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.heading}>{t(title)}</Text>
      <Svgs.ChevronDownFilled height={wp(7)} width={wp(7)} />
    </View>
  );
};

const DetailsCard = ({data}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const styles = dynamicStyles(isDarkMode);
  const {t} = useTranslation();

  return (
    <View style={styles.cardContainer}>
      <SectionHeader title={`${t('Project')} # 1`} />

      {data.map((item, index) => (
        <View key={index} style={{marginVertical: hp(0.5)}}>
          {item.label ? <Text style={styles.key}>{t(item.label)}</Text> : null}
          {item.bullets ? (
            <BulletList bullets={item.bullets} />
          ) : (
            <Text
              style={[styles.value, item.multiline && {lineHeight: hp(2.8)}]}>
              {item.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};
const ProjectDetails = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const styles = dynamicStyles(isDarkMode);
  const progress = '33';
  const [message, setMessage] = useState('');
  const Row = ({label, value}) => (
    <View style={styles.row}>
      <Text style={styles.key}>{t(label)}</Text>

      <Text
        style={[
          styles.value,
          {
            color: isDarkMode
              ? Colors.darkTheme.primaryTextColor
              : Colors.lightTheme.primaryTextColor,
            fontFamily: Fonts.PoppinsMedium,
          },
        ]}>
        {value}
      </Text>
    </View>
  );

  const handleYearChange = newYear => {
    console.log('Selected year:', newYear);
    // You can update your calendar data based on newYear here
  };
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={false}>
        <StackHeader
          title={'PR-02-123'}
          headerTxtStyle={styles.headerTxtStyle}
          onBackPress={() => navigation.goBack()}
          headerStyle={styles.headerStyle}
        />
        <View style={{paddingHorizontal: wp(4)}}>
          <View style={styles.sectionContainer}>
            <WorkerStatus
              name={'Status'}
              status={'Ongoing'}
              nameTextStyle={styles.statusText}
              showIcon={true}
            />
          </View>
          <DetailsCard
            data={[
              {
                label: '',
                value:
                  'Develop a core component within the CodeLink Adaptive Framework Engine that enables real-time resolution and binding of code modules across distributed services. The Dynamic Module Resolver should identify, fetch, and link required modules during runtime based on predefined contracts, metadata, or contextual need—without requiring manual imports or service restarts.',
              },
              {
                label: 'Key Objectives',
                bullets: [
                  'Design the resolver architecture to support both synchronous and asynchronous module loading.',
                  'Ensure compatibility with various module types (internal, external, and third-party)',
                  'Integrate caching and fallback mechanisms for unavailable or broken modules.',
                  'Provide a logging system for tracking module resolution activity and errors.',
                  'Write unit and integration tests to validate functionality under various scenarios',
                ],
              },
            ]}
          />
          <View style={styles.sectionContainer}>
            <SectionHeader title="Task Details" />
            <Row label="Assigned On" value={'12, Jan 2025'} />
            <Row label="Open On" value={'12, Jan 2025'} />
            <Row label="Started" value={'12, Jan 2025'} />
            <Row label="Deadline" value={'12, Jan 2025'} />
            <Row label="Assigned To" value={'Team 3'} />
            <Row label="Total Tasks" value={'John Doe'} />
            <View style={styles.row}>
              <Text style={styles.key}>{t('Progress')}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[styles.progressFill, {width: `${progress}%`}]}
                  />
                </View>
                <Text style={[styles.value, styles.progressText]}>
                  {progress}%
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.sectionContainer}>
            <SectionHeader title="Documents" />
            <View style={styles.pdfContainer}>
              <TouchableOpacity style={{alignItems: 'center'}}>
                <Svgs.pdf height={wp(10)} width={wp(10)} />
                <Text style={styles.pdfText}>SRS.pdf</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pdfContainer}>
              <TouchableOpacity style={{alignItems: 'center'}}>
                <Svgs.pdf height={wp(10)} width={wp(10)} />
                <Text style={styles.pdfText}>SRS.pdf</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              text="Upload Documents"
              onPress={() => {
                navigation.navigate(SCREENS.UPLOADDOCUMENT);
              }}
              textStyle={styles.btnText}
              containerStyle={[styles.btn, {marginVertical: hp(1)}]}
              svg={<Svgs.uploadBlue />}
            />
          </View>
          <View style={styles.sectionContainer}>
            <View style={styles.listContainer}>
              <View style={styles.rowViewSB}>
                <Text style={[styles.heading]}>{`18+ ${t('Tasks')}`}</Text>
                <Svgs.filter />
              </View>
              <CalendarBtn onYearChange={handleYearChange} mode={true} />
              <View
                style={[
                  styles.rowViewSB,
                  {
                    borderBottomColor: isDarkMode
                      ? Colors.darkTheme.BorderGrayColor
                      : Colors.lightTheme.BorderGrayColor,
                    borderBottomWidth: 1,
                  },
                ]}>
                <Text style={[styles.heading, {fontSize: RFPercentage(1.8)}]}>
                  {t('All Tasks')}
                </Text>
                <Text style={[styles.heading, {fontSize: RFPercentage(1.8)}]}>
                  {t('Date - Time')}
                </Text>
              </View>

              {tasksData.map((item, index) => (
                <StatusCardItem
                  item={item}
                  key={index}
                  type={'Tasks'}
                  containerStyle={{}}
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.heading}>{t('Comments')}</Text>
            <View style={styles.commentHeader}>
              <Image source={Images.artist1} style={styles.profileImage} />
              <View style={{marginLeft: wp(2)}}>
                <Text
                  style={[
                    styles.heading,
                    {
                      fontSize: RFPercentage(1.8),
                      fontFamily: Fonts.PoppinsMedium,
                    },
                  ]}>
                  EleanorP13
                </Text>

                <View style={{flexDirection: 'row'}}>
                  <Text style={[styles.key]}>12:29 PM</Text>
                  <Text style={[styles.key]}> | 13-Dec-2024</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.value, {marginTop: hp(1)}]}>
              To ensure notifications are sent only to relevant users, you can
              use rooms in Socket.IO. Each user can join a specific room based
              on their unique user ID. For example, when a user logs in, add
              them to a room
            </Text>
            <Image style={styles.commentImage} source={Images.dummyCodeImg} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.MessageContainer}>
        <Svgs.Blueplus height={wp(8)} width={wp(8)} />
        <TxtInput
          placeholder={'Write comment...'}
          onChangeText={msg => setMessage(msg)}
          value={message}
          containerStyle={styles.input}
        />
        <Svgs.sendSvg height={wp(15)} width={wp(15)} />
      </View>
    </View>
  );
};

export default ProjectDetails;

const dynamicStyles = (isDarkMode, isTasks) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    headerTxtStyle: {
      textAlign: 'left',
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
    },
    headerStyle: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingTop: hp(2),
    },
    sectionContainer: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      paddingVertical: wp(2),
      paddingHorizontal: wp(3),
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
    cardContainer: {
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.secondryColor}`
        : `${Colors.lightTheme.backgroundColor}`,
      paddingHorizontal: wp(4),
      borderRadius: wp(2),
      paddingVertical: hp(1.5),
    },
    key: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.QuaternaryText,
      fontFamily: Fonts.PoppinsRegular,
    },
    value: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    progressBackground: {
      height: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: 4,
      width: '45%',
      overflow: 'hidden',
      alignSelf: 'center',
    },
    progressFill: {
      height: hp(1),
      backgroundColor: '#9F8FEF',
    },
    progressText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginLeft: wp(2),
    },
    pdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.backgroundColor}80`
        : '#FAFAFA',
      borderRadius: wp(2),
      height: hp(30),
      marginTop: hp(2),
    },
    pdfText: {
      fontSize: RFPercentage(2.5),
      fontFamily: Fonts.NunitoBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
    },
    btn: {
      paddingVertical: hp(1.2),
      borderRadius: 10,
      alignItems: 'center',
      // backgroundColor: isDarkMode
      //   ? `${Colors.darkTheme.primaryColor}30`
      //   : `${Colors.lightTheme.primaryColor}30`,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 1,
    },
    btnText: {
      // color: isDarkMode
      //   ? Colors.darkTheme.primaryColor
      //   : Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsSemiBold,
      fontSize: RFPercentage(2),
      marginLeft: wp(3),
    },
    rowViewSB: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: hp(1),
      marginLeft: wp(1.5),
    },
    listContainer: {
      paddingHorizontal: wp(1),
    },
    commentHeader: {
      flexDirection: 'row',
      marginTop: hp(1),
    },
    profileImage: {
      width: wp(13),
      height: wp(13),
      borderRadius: wp(10),
    },
    commentImage: {
      width: wp(85),
      height: hp(24),
      borderRadius: wp(2),
      resizeMode: 'contain',
    },
    MessageContainer: {
      marginTop: hp(2),
      paddingHorizontal: wp(3),
      paddingTop: hp(1),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      backgroundColor: isDarkMode ? Colors.darkTheme.input : 'transparent',
      width: wp(70),
      marginLeft: wp(2),
    },
    iconWrapper: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderRadius: 20,
      padding: 10,
      marginLeft: wp(2),
    },
  });
