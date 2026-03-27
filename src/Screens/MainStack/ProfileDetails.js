import {t} from 'i18next';
import React, {useEffect, useState} from 'react';
import {
  Image,
  Linking,
  Modal,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {getMySchedule} from '../../Constants/api';
import {Svgs} from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import StatusBox from '../../components/Cards/StatusBox';
import StackHeader from '../../components/Header/StackHeader';
import MapComponent from '../../components/Maps/LeafLetMap';
import {statusStyles} from '../../Constants/DummyData';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {pxToPercentage} from '../../utils/responsive';

const ProfileDetails = ({navigation}) => {
  const {isDarkMode} = useSelector(store => store.theme);
  const {user} = useSelector(store => store.auth);
  const styles = dynamicStyles(isDarkMode);
  const userData = useSelector(state => state?.auth?.user?.worker);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  console.log('userData', JSON.stringify(userData, null, 2));
  const fetchSchedule = async () => {
    try {
      setScheduleLoading(true);
      const response = await getMySchedule(user?.token);
      if (response?.error === false && response?.data) {
        setScheduleData(response.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  if (!userData) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Profiles Details')}
          headerTxtStyle={{
            textAlign: 'left',
            fontSize: RFPercentage(2.6),
            fontFamily: Fonts.PoppinsSemiBold,
          }}
          headerStyle={{
            paddingVertical: hp(2),
            backgroundColor: isDarkMode
              ? Colors.darkTheme.secondryColor
              : Colors.lightTheme.backgroundColor,
          }}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User data not available</Text>
          <CustomButton
            text={'Go Back'}
            onPress={() => navigation.goBack()}
            containerStyle={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  // Get status style based on user status
  const getUserStatusStyle = () => {
    const status = userData?.status?.toLowerCase() || 'active';
    return (
      statusStyles[status.charAt(0).toUpperCase() + status.slice(1)] ||
      statusStyles['Active']
    );
  };

  const statusStyle = getUserStatusStyle();

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Get full name
  const getFullName = () => {
    const firstName = userData?.first_name
      ? userData?.first_name?.charAt(0)?.toUpperCase() +
        userData?.first_name?.slice(1)
      : '';
    const lastName = userData?.last_name
      ? userData?.last_name?.charAt(0)?.toUpperCase() +
        userData?.last_name?.slice(1)
      : '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  // Get display value with fallback
  const getDisplayValue = (value, fallback = 'N/A') => {
    return value || fallback;
  };

  const formatTime = time => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayAbbreviation = day => {
    const dayMap = {
      Mon: t('Monday'),
      Tue: t('Tuesday'),
      Wed: t('Wednesday'),
      Thu: t('Thursday'),
      Fri: t('Friday'),
      Sat: t('Saturday'),
      Sun: t('Sunday'),
    };
    return dayMap[day] || day;
  };

  return (
    <View style={styles.container}>
      <StackHeader
        title={'Profile Details'}
        headerTxtStyle={{
          textAlign: 'left',
          fontSize: RFPercentage(2.6),
          fontFamily: Fonts.PoppinsSemiBold,
        }}
        headerStyle={{
          paddingVertical: hp(2),
          backgroundColor: isDarkMode
            ? Colors.darkTheme.secondryColor
            : Colors.lightTheme.backgroundColor,
        }}
        onBackPress={() => navigation.goBack()}
      />

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.8}>
            <MaterialIcons name="close" size={36} color="#fff" />
          </TouchableOpacity>

          {userData?.profile_image && !imageError && (
            <Image
              source={{uri: userData?.profile_image}}
              style={styles.fullscreenImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}

          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          />
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{paddingBottom: hp(5)}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.statusLabel}>{t('Status')}</Text>
            <View style={{alignSelf: 'flex-end'}}>
              <StatusBox
                status={
                  userData?.status === 'active' ? t('Active') : t('Inactive')
                }
                backgroundColor={statusStyle.backgroundColor}
                color={statusStyle.color}
                icon={statusStyle.icon}
              />
            </View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.statusLabel}>{t('Registered')}</Text>
            <Text style={styles.statusValue}>
              {formatDate(userData?.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          {userData?.profile_image && !imageError ? (
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              activeOpacity={0.8}
              style={{alignSelf: 'center', marginBottom: hp(2)}}>
              <Image
                source={{uri: userData?.profile_image}}
                style={styles.profileImage}
                onError={() => setImageError(true)}
              />
            </TouchableOpacity>
          ) : (
            <MaterialIcons
              name="account-circle"
              size={wp(20)}
              color="#999"
              style={{alignSelf: 'center', marginBottom: hp(2)}}
            />
          )}

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>{t('Personal Details')}</Text>
            {[
              ['Full Name', getFullName()],
              ['Email', getDisplayValue(userData?.email)],
              ['Phone No.', getDisplayValue(userData?.phone)],
              ['Date of Birth', formatDate(userData?.dob)],
            ].map(([label, value]) => (
              <View style={styles.row} key={label}>
                <Text style={styles.label}>{t(label)}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}

            {/* National ID Document */}
            {userData?.document_url && (
              <>
                <Text style={styles.sectionTitle}>{t('National ID')}</Text>
                <TouchableOpacity
                  style={styles.documentLinkContainer}
                  onPress={() => {
                    if (userData?.document_url) {
                      Linking.openURL(userData.document_url);
                    }
                  }}>
                  <View style={styles.documentIconContainer}>
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={wp(6)}
                      color="#d32f2f"
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentLabel}>
                      {t('National ID Document')}
                    </Text>
                    <Text style={styles.documentLink}>{t('Tap to view')}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={wp(6)}
                    color="#999"
                  />
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.sectionTitle}>{t('Address')}</Text>
            {[
              ['Country', getDisplayValue(userData?.country)],
              ['Province', getDisplayValue(userData?.province)],
              ['City', getDisplayValue(userData?.city)],
              ['Postal Code', getDisplayValue(userData?.postal_code)],
              ['Street Address', getDisplayValue(userData?.street_address)],
            ].map(([label, value]) => (
              <View style={styles.row} key={label}>
                <Text style={styles.label}>{t(label)}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
            <CustomButton
              text={'Edit'}
              onPress={() => navigation.navigate(SCREENS.EDITPROFILE)}
              textStyle={styles.continueButtonText}
              containerStyle={styles.continueButton}
              svg={<Svgs.edit height={wp(6)} width={wp(6)} />}
            />
          </View>
        </View>

        <View style={[styles.profileCard, {marginTop: 10}]}>
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>{t('Employment Details')}</Text>
            {[
              ['Employee ID', getDisplayValue(userData?.worker_id)],
              [
                'Department',
                getDisplayValue(userData?.department_id?.toString()),
              ], // You might want to map this to department name
              ['Designation', getDisplayValue(userData?.designation)],
              ['Employment Type', getDisplayValue(userData?.employee_type)],
              ['Shift Schedule', getDisplayValue(userData?.shift_schedule)],
              ['Hiring Date', formatDate(userData?.hire_date)],
              // ['Assign Zone', getDisplayValue(userData?.assign_zone)],
              // ['Assign Region', getDisplayValue(userData?.assign_region)],
            ].map(([label, value]) => (
              <View style={styles.row} key={label}>
                <Text style={styles.label}>{t(label)}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>{t('Location Data')}</Text>
            {[
              ['Latitude', getDisplayValue(userData?.latitude)],
              ['Longitude', getDisplayValue(userData?.longitude)],
              ['Continent', getDisplayValue(userData?.continent)],
            ].map(([label, value]) => (
              <View style={styles.row} key={label}>
                <Text style={styles.label}>{t(label)}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Biometric Data Section */}
        {userData?.face_data && (
          <View style={[styles.profileCard, {marginTop: 10}]}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>{t('Biometric Data')}</Text>
              {[
                [
                  'Face Quality',
                  getDisplayValue(
                    userData.face_data.quality_metrics?.quality_rating,
                  ),
                ],
                [
                  'Confidence Score',
                  getDisplayValue(
                    userData.face_data.confidence_score?.toString(),
                  ),
                ],
                [
                  'Last Updated',
                  formatDate(userData.face_data.face_updated_at),
                ],
              ].map(([label, value]) => (
                <View style={styles.row} key={label}>
                  <Text style={styles.label}>{t(label)}</Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {scheduleData?.hasSettings && (
          <View style={[styles.profileCard, {marginTop: 10}]}>
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>{t('Work Schedule')}</Text>

              {scheduleData?.schedule?.days && (
                <View style={styles.scheduleSubSection}>
                  <View
                    style={[
                      styles.row,
                      {
                        justifyContent: 'flex-start',
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="calendar-check"
                      size={hp(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <Text style={styles.subSectionTitle}>
                      {t('Working Days')}
                    </Text>
                  </View>
                  <View style={styles.daysContainer}>
                    {scheduleData.schedule.days.map((day, index) => (
                      <View key={index} style={styles.dayChip}>
                        <Text style={styles.dayChipText}>
                          {getDayAbbreviation(day)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {userData?.latitude && userData?.longitude && (
                <View style={styles.mapContainer}>
                  <MapComponent
                    initialLat={parseFloat(userData.latitude)}
                    initialLng={parseFloat(userData.longitude)}
                    initialZoom={15}
                    markers={[
                      {
                        lat: parseFloat(userData.latitude),
                        lng: parseFloat(userData.longitude),
                        title: `${userData.first_name} ${userData.last_name}`,
                        description:
                          userData.street_address || userData.city || '',
                      },
                    ]}
                    height={180}
                    showSearch={false}
                    showCurrentLocationButton={false}
                    editable={false}
                  />
                </View>
              )}

              {scheduleData?.schedule && (
                <View style={styles.scheduleSubSection}>
                  <View
                    style={[
                      styles.row,
                      {
                        justifyContent: 'flex-start',
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={hp(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <Text style={styles.subSectionTitle}>
                      {t('Working Hours')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Start Time:')}</Text>
                    <Text style={styles.infoValue}>
                      {formatTime(scheduleData.schedule?.start)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('End Time:')}</Text>
                    <Text style={styles.infoValue}>
                      {formatTime(scheduleData.schedule?.end)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Daily Hours:')}</Text>
                    <Text style={styles.infoValue}>
                      {scheduleData.schedule?.dailyHours || 0} {t('hours')}
                    </Text>
                  </View>
                </View>
              )}

              {scheduleData?.schedule?.breakPolicy?.unpaid && (
                <View style={styles.scheduleSubSection}>
                  <View
                    style={[
                      styles.row,
                      {
                        justifyContent: 'flex-start',
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="coffee-outline"
                      size={hp(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <Text style={styles.subSectionTitle}>
                      {t('Break Policy')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Unpaid Break:')}</Text>
                    <Text style={styles.infoValue}>
                      {scheduleData.schedule.breakPolicy.unpaid} {t('minutes')}
                    </Text>
                  </View>
                </View>
              )}

              {scheduleData?.schedule?.graceMinutes !== undefined && (
                <View style={styles.scheduleSubSection}>
                  <View
                    style={[
                      styles.row,
                      {
                        justifyContent: 'flex-start',
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="timer-sand"
                      size={hp(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <Text style={styles.subSectionTitle}>
                      {t('Grace Period')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Grace Minutes:')}</Text>
                    <Text style={styles.infoValue}>
                      {scheduleData.schedule.graceMinutes} {t('minutes')}
                    </Text>
                  </View>
                </View>
              )}

              {scheduleData?.location && (
                <View style={styles.scheduleSubSection}>
                  <View
                    style={[
                      styles.row,
                      {
                        justifyContent: 'flex-start',
                      },
                    ]}>
                    <MaterialIcons
                      name="location-on"
                      size={hp(2.5)}
                      color={
                        isDarkMode
                          ? Colors.darkTheme.primaryColor
                          : Colors.lightTheme.primaryColor
                      }
                    />
                    <Text style={styles.subSectionTitle}>
                      {t('Work Location')}
                    </Text>
                  </View>
                  <Text style={styles.locationText}>
                    {scheduleData.location.locationName ||
                      t('Location name not available')}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('Allowed Radius:')}</Text>
                    <Text style={styles.infoValue}>
                      {scheduleData.location.radiusMeters} {t('meters')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileDetails;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseButton: {
      position: 'absolute',
      top: hp(6),
      right: wp(5),
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 4,
      zIndex: 1001,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000,
    },
    fullscreenImage: {
      width: '100%',
      height: '80%',
      resizeMode: 'contain',
      zIndex: 1002,
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.secondryColor,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(5),
    },
    errorText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(2),
      textAlign: 'center',
    },
    errorButton: {
      backgroundColor: Colors.darkTheme.primaryColor,
      paddingHorizontal: wp(8),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
    },
    statusContainer: {
      paddingHorizontal: wp(5),
      margin: 10,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(5),
      borderRadius: wp(3),
      padding: wp(4),
      paddingVertical: hp(2),
    },
    statusLabel: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    statusBadge: {
      backgroundColor: '#E0F7E9',
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      borderRadius: wp(3),
      marginTop: hp(0.5),
    },
    statusText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      color: 'green',
    },
    statusValue: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginTop: hp(0.5),
    },
    profileCard: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(5),
      borderRadius: wp(3),
      padding: wp(4),
    },
    profileImage: {
      width: wp(20),
      height: wp(20),
      borderRadius: wp(10),
      alignSelf: 'center',
      marginBottom: hp(2),
    },
    detailsSection: {},
    sectionTitle: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(1),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    documentLinkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? Colors.darkTheme.card : '#f5f5f5',
      padding: wp(3),
      borderRadius: wp(2),
      marginBottom: hp(1),
    },
    documentIconContainer: {
      marginRight: wp(3),
    },
    documentInfo: {
      flex: 1,
    },
    documentLabel: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    documentLink: {
      fontSize: RFPercentage(pxToPercentage(12)),
      color: '#2196f3',
      marginTop: hp(0.5),
    },
    listContainer: {
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      flexDirection: 'row',
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    value: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'right',
      flexShrink: 1,
    },
    tag: {
      fontFamily: Fonts.PoppinsRegular,
      backgroundColor: '#579DFF',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      borderRadius: wp(1),
      marginRight: wp(2),
      marginBottom: hp(1),
      flexDirection: 'row',
      gap: 4,
    },
    tagText: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
    },
    editButton: {
      backgroundColor: Colors.darkTheme.primaryColor,
      marginHorizontal: wp(5),
      marginTop: hp(3),
      paddingVertical: hp(1.5),
      borderRadius: wp(2),
      alignItems: 'center',
    },
    editButtonText: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsMedium,
      color: '#fff',
    },
    crossIcon: {
      position: 'absolute',
      top: 3,
      right: 4,
      zIndex: 1,
    },
    btnContainer: {
      marginTop: hp(2),
      paddingTop: hp(2),
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
    },
    continueButton: {
      backgroundColor: isDarkMode
        ? `${Colors.darkTheme.primaryColor}20`
        : `${Colors.lightTheme.primaryColor}60`,
      paddingVertical: hp(1.2),
      borderRadius: wp(3),
      alignItems: 'center',
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 1,
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      fontFamily: Fonts.PoppinsSemiBold,
      marginLeft: wp(2),
    },
    // Work Schedule styles
    scheduleSubSection: {
      marginBottom: hp(1),
      paddingTop: hp(1),
    },
    subSectionTitle: {
      fontSize: RFPercentage(2),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginLeft: wp(2),
    },
    daysContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
      marginTop: hp(1),
      marginBottom: hp(1),
    },
    dayChip: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: wp(2),
    },
    dayChipText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: '#FFFFFF',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    infoLabel: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    infoValue: {
      fontSize: RFPercentage(1.9),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    locationText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      marginBottom: hp(1),
      lineHeight: hp(2.8),
    },
    mapContainer: {
      borderRadius: 10,
      overflow: 'hidden',
    },
  });
