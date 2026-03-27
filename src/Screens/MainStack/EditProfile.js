import CountryList from 'country-list-with-dial-code-and-flag';
import {t} from 'i18next';
import React, {useEffect, useRef, useState} from 'react';
import {GetCountries} from 'react-country-state-city';
import {
  Image,
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {Svgs} from '../../assets/Svgs/Svgs';
import CameraBottomSheet from '../../components/BottomSheets/CameraBottomSheet';
import CustomButton from '../../components/Buttons/customButton';
import StackHeader from '../../components/Header/StackHeader';
import MapComponent from '../../components/Maps/LeafLetMap';
import CustomLoader from '../../components/Loaders/CustomLoader';
import CInputWithCountryCode from '../../components/TextInput/CInputWithCountryCode';
import TxtInput from '../../components/TextInput/Txtinput';
import CustomDateTimePicker from '../../components/DateTimeModal/CustomDateTimePicker';
import {uploadImage, uploadDocument} from '../../Constants/api';
import {useButtonColors} from '../../Constants/colorHelper';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import useOfflineProfile from '../../hooks/useOfflineProfile';
import {useAlert} from '../../Providers/AlertContext';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';
import {pxToPercentage} from '../../utils/responsive';

const EditProfile = ({navigation}) => {
  const {user, profile} = useSelector(store => store.auth);
  const token = user?.token;
  const userId = user?.worker?.id || user?.id;
  const {isDarkMode, getButtonColor} = useButtonColors();
  const {showAlert} = useAlert();
  const localizedAlert = useLocalizedAlert();
  const {saveProfile, syncStatus, pendingUpdate, isOnline} = useOfflineProfile(
    token,
    userId,
    user,
  );
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'US',
    currency: 'US Dollar',
    currency_code: 'USD',
    currency_symbol: '$',
    dial_code: '+1',
    flag: '🇺🇸',
    local_name: 'United States',
    name: 'United States',
    preferred: true,
  });
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [countries, setCountries] = useState([]);
  const [DOB, setDOB] = useState('');
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [deleteImg, setDeleteImg] = useState(false);
  const [error, setError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const cameraSheet_ref = useRef();
  const primaryButtonColors = getButtonColor('primary');
  const styles = dynamicStyles(isDarkMode);

  // National ID document states
  const [nationalIdFrontImage, setNationalIdFrontImage] = useState(null);
  const [nationalIdBackImage, setNationalIdBackImage] = useState(null);
  const nationalIdSheet_ref = useRef();

  useEffect(() => {
    GetCountries().then(result => {
      setCountries(result.map(c => c.name));
    });
  }, []);

  useEffect(() => {
    const userData = user?.worker;

    if (userData && !dataLoaded) {
      populateFormData(userData);
      setDataLoaded(true);
    }
  }, [user?.worker, dataLoaded]);

  useEffect(() => {
    const userData = user?.worker;

    if (userData && dataLoaded) {
      updateAddressFields(userData);
    }
  }, [user?.worker]);

  const populateFormData = userData => {
    setFirstName(userData?.first_name || '');
    setMiddleName(userData?.middle_name || '');
    setLastName(userData?.last_name || '');
    setEmail(userData?.email || '');
    setPostalCode(userData?.postal_code || '');
    setAddress(userData?.street_address || userData?.address || '');
    setCity(userData?.city || '');
    setState(userData?.province || '');
    setCountry(userData?.country || '');
    setRegion(userData?.region || '');
    setImage(userData?.profile_image || userData?.profile_picture || null);

    // Load existing DOB if available
    if (userData?.dob) {
      const dobDate = new Date(userData.dob);
      if (!isNaN(dobDate.getTime())) {
        setDOB(formatDate(dobDate));
      }
    }

    // Load existing national ID documents if available
    // First check for document_url (used as front document)
    if (userData?.document_url) {
      const isPdf = userData.document_url.toLowerCase().includes('.pdf');
      setNationalIdFrontImage({
        path: userData.document_url,
        type: isPdf ? 'document' : 'image',
        name: isPdf ? 'national_id_front.pdf' : 'national_id_front.jpg',
      });
    }
    // Also check for document_url_front for backward compatibility
    else if (userData?.document_url_front) {
      const isPdf = userData.document_url_front.toLowerCase().includes('.pdf');
      setNationalIdFrontImage({
        path: userData.document_url_front,
        type: isPdf ? 'document' : 'image',
        name: isPdf ? 'national_id_front.pdf' : 'national_id_front.jpg',
      });
    }

    if (userData?.document_url_back) {
      // Check if it's a PDF or image based on the URL
      const isPdf = userData.document_url_back.toLowerCase().includes('.pdf');
      setNationalIdBackImage({
        path: userData.document_url_back,
        type: isPdf ? 'document' : 'image',
        name: isPdf ? 'national_id_back.pdf' : 'national_id_back.jpg',
      });
    }

    if (userData?.phone) {
      const phoneString = userData.phone.toString().trim();
      if (phoneString.startsWith('+')) {
        const spaceIndex = phoneString.indexOf(' ');
        if (spaceIndex > -1) {
          const code = phoneString.substring(0, spaceIndex);
          setCountryCode(code);
          setPhoneNumber(phoneString.substring(spaceIndex + 1));
          const countryData = CountryList.findByDialCode(code);
          if (countryData && countryData.length > 0) {
            setSelectedCountry(countryData[0].data);
          } else {
            setSelectedCountry(prev => ({...prev, dial_code: code}));
          }
        } else {
          if (phoneString.length > 10) {
            const code = '+' + phoneString.substring(1, 3);
            setCountryCode(code);
            setPhoneNumber(phoneString.substring(3));
            const countryData = CountryList.findByDialCode(code);
            if (countryData && countryData.length > 0) {
              setSelectedCountry(countryData[0].data);
            } else {
              setSelectedCountry(prev => ({...prev, dial_code: code}));
            }
          } else {
            setCountryCode('+1');
            setPhoneNumber(phoneString);
            const countryData = CountryList.findByDialCode('+1');
            if (countryData && countryData.length > 0) {
              setSelectedCountry(countryData[0].data);
            } else {
              setSelectedCountry(prev => ({...prev, dial_code: '+1'}));
            }
          }
        }
      } else {
        setCountryCode('+1');
        setPhoneNumber(phoneString);
        // Find the country object by dial code
        const countryData = CountryList.findByDialCode('+1');
        if (countryData && countryData.length > 0) {
          setSelectedCountry(countryData[0].data);
        } else {
          setSelectedCountry(prev => ({...prev, dial_code: '+1'}));
        }
      }
    } else {
      setCountryCode('+1');
      setPhoneNumber('');
      // Find the country object by dial code
      const countryData = CountryList.findByDialCode('+1');
      if (countryData && countryData.length > 0) {
        setSelectedCountry(countryData[0].data);
      } else {
        setSelectedCountry(prev => ({...prev, dial_code: '+1'}));
      }
    }
  };

  const updateAddressFields = userData => {
    setPostalCode(userData?.postal_code || '');
    setAddress(userData?.street_address || userData?.address || '');
    setCity(userData?.city || '');
    setState(userData?.province || '');
    setCountry(userData?.country || '');
    setRegion(userData?.region || '');
  };

  const formatDate = date => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const handleDOBConfirm = date => {
    try {
      const formattedDate = formatDate(date);
      setDOB(formattedDate);
      setShowDOBPicker(false);
    } catch (error) {
      console.error('DOB handling error:', error);
    }
  };

  const handleImagePicker = () => {
    cameraSheet_ref.current?.open();
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      showAlert(t('Please enter your first name.'), 'error');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = image;

      // Upload image only if online and image is new
      if (image && typeof image !== 'string' && image.path && isOnline) {
        const response = await uploadImage(image, token);
        if (response.error === false) {
          imageUrl = response.data?.url;
          setImage(imageUrl);
        } else {
          console.warn('Upload failed:', response.message);
          showAlert(
            t('Image upload failed. Profile will save without image.'),
            'warning',
          );
          imageUrl = user?.worker?.profile_image || '';
        }
      } else if (
        image &&
        typeof image !== 'string' &&
        image.path &&
        !isOnline
      ) {
        // Offline - keep the local image path for now
        console.log('📴 Offline: Image will be uploaded when online');
        showAlert(t('Image will be uploaded when you are back online'), 'info');
        imageUrl = user?.worker?.profile_image || '';
      }

      // Handle national ID document upload
      let nationalIdFrontUrl =
        user?.worker?.document_url || user?.worker?.document_url_front || '';
      let nationalIdBackUrl = user?.worker?.document_url_back || '';

      if (
        nationalIdFrontImage &&
        typeof nationalIdFrontImage !== 'string' &&
        nationalIdFrontImage.path &&
        isOnline
      ) {
        try {
          const docResponse = await uploadDocument(nationalIdFrontImage);
          if (docResponse.error === false) {
            nationalIdFrontUrl = docResponse.data?.url || '';
          } else {
            console.warn('Document upload failed:', docResponse.message);
            showAlert(
              t('Document upload failed. Profile will save without document.'),
              'warning',
            );
          }
        } catch (docError) {
          console.error('Document upload error:', docError);
        }
      } else if (
        nationalIdFrontImage &&
        typeof nationalIdFrontImage !== 'string' &&
        nationalIdFrontImage.path &&
        !isOnline
      ) {
        // Offline - keep the local document path for now
        console.log('📴 Offline: Document will be uploaded when online');
        showAlert(
          t('Document will be uploaded when you are back online'),
          'info',
        );
      }

      if (
        nationalIdBackImage &&
        typeof nationalIdBackImage !== 'string' &&
        nationalIdBackImage.path &&
        isOnline
      ) {
        try {
          const docResponse = await uploadDocument(nationalIdBackImage);
          if (docResponse.error === false) {
            nationalIdBackUrl = docResponse.data?.url || '';
          } else {
            console.warn('Document upload failed:', docResponse.message);
            showAlert(
              t('Document upload failed. Profile will save without document.'),
              'warning',
            );
          }
        } catch (docError) {
          console.error('Document upload error:', docError);
        }
      } else if (
        nationalIdBackImage &&
        typeof nationalIdBackImage !== 'string' &&
        nationalIdBackImage.path &&
        !isOnline
      ) {
        // Offline - keep the local document path for now
        console.log('📴 Offline: Document will be uploaded when online');
        showAlert(
          t('Document will be uploaded when you are back online'),
          'info',
        );
      }

      const updatedProfileData = {
        worker_id: user?.worker?.worker_id || '',
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        dob: DOB ? `${DOB}T00:00:00.000Z` : '',
        address: address.trim(),
        city: city.trim(),
        province: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        street_address: address.trim(),
        profile_image: deleteImg
          ? ''
          : imageUrl || user?.worker?.profile_image || '',
        region: region.trim(),
        document_url: nationalIdFrontUrl,
        document_url_front: nationalIdFrontUrl,
        document_url_back: nationalIdBackUrl,
      };

      const cleanedPhoneNumber = phoneNumber.replace(/^\+/, '').trim();
      const currentPhone = user?.worker?.phone || '';
      if (cleanedPhoneNumber === '' && countryCode.trim() === '') {
        updatedProfileData.phone = currentPhone;
      } else if (cleanedPhoneNumber !== '' && countryCode.trim() === '') {
        updatedProfileData.phone = `+1 ${cleanedPhoneNumber}`;
      } else if (cleanedPhoneNumber === '' && countryCode.trim() !== '') {
        const oldNumber = currentPhone;
        const oldNumberWithoutCode = oldNumber.replace(/^\+\d+\s?/, '');
        updatedProfileData.phone = `${countryCode} ${oldNumberWithoutCode}`;
      } else if (cleanedPhoneNumber !== '' && countryCode.trim() !== '') {
        updatedProfileData.phone = `${countryCode} ${cleanedPhoneNumber}`;
      }

      // Determine if we have a local image to pass
      const localImageToQueue =
        !isOnline && image && typeof image !== 'string' && image.path
          ? image
          : null;

      // Use offline-first profile save
      const result = await saveProfile(
        updatedProfileData,
        response => {
          // Success callback
          if (response.offline) {
            localizedAlert(
              {
                error: false,
                message: t('Profile saved offline. Will sync when online.'),
              },
              'success',
            );
          } else {
            localizedAlert(response, 'success');
          }
          navigation.goBack();
        },
        error => {
          // Error callback
          console.log('Error while updating profile:', error);
          showAlert(t('Something went wrong while updating profile.'), 'error');
        },
        localImageToQueue, // Pass the local image for offline queueing
      );
    } catch (error) {
      console.log('Error while updating profile:', error);
      showAlert(t('Something went wrong while updating profile.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const HandleDeleteImage = () => {
    setDeleteImg(true);
    setImage(null);
  };

  const HandleMap = () => {
    const fullAddressString = `${address}, ${city}, ${state}, ${postalCode}, ${country}`;
    navigation.navigate(SCREENS.MAPSCREEN, {
      selectedLocation: fullAddressString,
      onLocationUpdate: locationData => {
        console.log('🚀 ~ Location updated from MapScreen:', locationData);
      },
    });
  };

  // Add focus listener to update when returning from MapScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // When screen comes into focus, check for updates
      const userData = user?.worker;
      if (userData && dataLoaded) {
        console.log('🚀 ~ Screen focused, updating form data');
        updateAddressFields(userData);
      }
    });

    return unsubscribe;
  }, [navigation, user?.worker, dataLoaded]);

  // Show loader until data is loaded
  if (!dataLoaded) {
    return (
      <View style={styles.container}>
        <StackHeader
          title={t('Edit Profile')}
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
        <CustomLoader size="large" visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StackHeader
        title={t('Edit Profile')}
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

      {/* Network Status Bar */}
      {/* <NetworkStatusBar
        isOnline={isOnline}
        queuedCount={pendingUpdate ? 1 : 0}
        syncStatus={syncStatus}
        syncType="profile"
      /> */}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Pending Update Notice */}
        {pendingUpdate && syncStatus !== 'synced' && (
          <View
            style={[
              styles.pendingUpdateNotice,
              {
                backgroundColor:
                  syncStatus === 'syncing'
                    ? isDarkMode
                      ? '#4A90E2'
                      : '#E3F2FD'
                    : syncStatus === 'failed'
                    ? isDarkMode
                      ? '#E74C3C'
                      : '#FFEBEE'
                    : isDarkMode
                    ? '#F39C12'
                    : '#FFF3E0',
              },
            ]}>
            <MaterialIcons
              name={
                syncStatus === 'syncing'
                  ? 'sync'
                  : syncStatus === 'failed'
                  ? 'error'
                  : 'cloud-upload'
              }
              size={20}
              color={
                syncStatus === 'syncing'
                  ? '#2196F3'
                  : syncStatus === 'failed'
                  ? '#F44336'
                  : '#FF9800'
              }
            />
            <Text style={styles.pendingUpdateText}>
              {syncStatus === 'syncing'
                ? t('Syncing profile changes...')
                : syncStatus === 'failed'
                ? t('Profile sync failed. Will retry when online.')
                : t('Profile changes pending sync, press Update to sync now')}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.imageContainer}>
              {image ? (
                <Image
                  source={{uri: image?.path || image}}
                  style={styles.profileImage}
                  onError={() => setError(true)}
                />
              ) : (
                <MaterialIcons
                  name="account-circle"
                  size={wp(26)}
                  color="#999"
                />
              )}
              <TouchableOpacity
                onPress={HandleDeleteImage}
                style={styles.cameraIcon}>
                <Svgs.DeleteBlueWithBG height={hp(4)} />
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.editSection}>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  {
                    borderColor: primaryButtonColors.backgroundColor,
                  },
                ]}
                onPress={handleImagePicker}>
                <Text
                  style={[
                    styles.editButtonText,
                    {
                      color: primaryButtonColors.backgroundColor,
                    },
                  ]}>
                  {image
                    ? t('Edit Profile Picture')
                    : t('Upload Profile Picture')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sizeInfo}>
                {t('Size should be 1MB - 5MB')}
              </Text>
            </View>
          </View>

          <View style={styles.nameContainer}>
            {/* First Name */}
            <View style={styles.rowContainer}>
              <View>
                <Text style={styles.label}>
                  {t('First Name')}
                  <Text style={{color: Colors.error}}> *</Text>
                </Text>
                <TxtInput
                  value={firstName}
                  containerStyle={[styles.nameInput, {marginBottom: hp(1)}]}
                  placeholder={t('Enter first name')}
                  numberOfLines={1}
                  onChangeText={setFirstName}
                />
              </View>
              {/* Middle Name */}
              <View>
                <Text style={styles.label}>{t('Middle Name')}</Text>
                <TxtInput
                  value={middleName}
                  containerStyle={[styles.nameInput, {marginBottom: hp(1)}]}
                  placeholder={t('Enter middle name')}
                  onChangeText={setMiddleName}
                  numberOfLines={1}
                />
              </View>
            </View>

            {/* Last Name */}
            <View>
              <Text style={styles.label}>{t('Last Name')}</Text>
              <TxtInput
                value={lastName}
                containerStyle={[styles.nameInput]}
                placeholder={t('Enter last name')}
                numberOfLines={1}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <Text style={styles.label}>
            {t('Email')}
            <Text style={{color: Colors.error}}> *</Text>
          </Text>
          <TxtInput
            value={email}
            containerStyle={styles.inputField}
            placeholder={t('admin@company.com')}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={false}
          />
          <Text style={styles.EmailNotEdit}>{t('Email is not editable')}</Text>

          <Text style={styles.label}>{t('Phone Number')}</Text>
          <CInputWithCountryCode
            phoneNo={phoneNumber}
            setPhoneNo={setPhoneNumber}
            setCountryCode={setCountryCode}
            countryCode={countryCode}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            placeholder={t('(555) 123-4567')}
            width="100%"
            placeholderTextColor={
              isDarkMode
                ? Colors.darkTheme.QuaternaryText
                : Colors.lightTheme.QuaternaryText
            }
          />

          {/* Date of Birth */}
          <Text style={styles.label}>{t('Date of Birth (DOB)')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDOBPicker(true)}
            style={{width: '100%'}}>
            <TxtInput
              value={DOB}
              containerStyle={styles.inputField}
              placeholder={t('Select your birth date')}
              editable={false}
              rightSvg={<Svgs.calenderL />}
              rightIconPress={() => setShowDOBPicker(true)}
              rightIconContainerStyle={{
                marginRight: wp(2),
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.backgroundColor
                  : Colors.lightTheme.backgroundColor,
              }}
            />
          </TouchableOpacity>

          {/* National ID Document Section */}
          <View style={{marginTop: hp(2)}}>
            <Text style={styles.label}>
              {t('National ID Document')}
              <Text style={{color: Colors.error}}> *</Text>
            </Text>
            <View style={styles.nationalIdSection}>
              {/* Front Image */}
              <Text style={styles.nationalIdSubLabel}>{t('Upload')}</Text>
              {/* <Text style={styles.nationalIdSubLabel}>{t('Front Side')}</Text> */}
              {nationalIdFrontImage?.path ? (
                <View style={styles.nationalIdImageContainer}>
                  {nationalIdFrontImage.type !== 'document' ? (
                    <Image
                      source={{uri: nationalIdFrontImage.path}}
                      style={styles.nationalIdImage}
                    />
                  ) : (
                    <View style={styles.pdfContainer}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={RFPercentage(10)}
                        color="red"
                      />
                      <Text style={styles.pdfText} numberOfLines={1}>
                        {nationalIdFrontImage.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.nationalIdEditIcon}
                    onPress={() => nationalIdSheet_ref.current.open('front')}>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nationalIdRemoveIcon}
                    onPress={() => {
                      setNationalIdFrontImage(null);
                    }}>
                    <MaterialCommunityIcons
                      name="close"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.nationalIdUploadButton}
                  onPress={() => nationalIdSheet_ref.current.open('front')}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={RFPercentage(3)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.QuaternaryText
                        : Colors.lightTheme.QuaternaryText
                    }
                  />
                  <Text style={styles.nationalIdUploadText}>
                    {t('Upload ')}
                    {/* {t('Upload Front Side')} */}
                  </Text>
                  <Text style={styles.nationalIdHint}>
                    {t('Upload a clear photo of the front side')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Back Image */}
              {/* <Text style={[styles.nationalIdSubLabel, {marginTop: hp(2)}]}>
                {t('Back Side')}
              </Text> */}
              {/* {nationalIdBackImage?.path ? (
                <View style={styles.nationalIdImageContainer}>
                  {nationalIdBackImage.type !== 'document' ? (
                    <Image
                      source={{uri: nationalIdBackImage.path}}
                      style={styles.nationalIdImage}
                    />
                  ) : (
                    <View style={styles.pdfContainer}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={RFPercentage(10)}
                        color="red"
                      />
                      <Text style={styles.pdfText} numberOfLines={1}>
                        {nationalIdBackImage.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.nationalIdEditIcon}
                    onPress={() => nationalIdSheet_ref.current.open('back')}>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nationalIdRemoveIcon}
                    onPress={() => {
                      setNationalIdBackImage(null);
                    }}>
                    <MaterialCommunityIcons
                      name="close"
                      size={RFPercentage(2)}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.nationalIdUploadButton}
                  onPress={() => nationalIdSheet_ref.current.open('back')}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={RFPercentage(3)}
                    color={
                      isDarkMode
                        ? Colors.darkTheme.QuaternaryText
                        : Colors.lightTheme.QuaternaryText
                    }
                  />
                  <Text style={styles.nationalIdUploadText}>
                    {t('Upload Back Side')}
                  </Text>
                  <Text style={styles.nationalIdHint}>
                    {t('Upload a clear photo of the back side')}
                  </Text>
                </TouchableOpacity>
              )} */}
            </View>
          </View>

          <View style={{paddingVertical: hp(0.8)}}></View>
          <Text style={styles.sectionTitle}>{t('Address')}</Text>

          <Text style={styles.label}>{t('Country')}</Text>
          {/* <View
            style={{zIndex: 2000, position: 'relative', overflow: 'visible'}}>
            <CustomDropDown
              data={countries}
              selectedValue={country}
              onValueChange={value => {
                setCountry(value);
                setCity('');
                setPostalCode('');
                setAddress('');
                setState('');
              }}
              placeholder={t('Select Country')}
              containerStyle={[styles.dropdownContainer, {zIndex: 2000}]}
              width={'100%'}
              btnStyle={{paddingVertical: hp(1.4), paddingHorizontal: hp(2)}}
              astrik={false}
              zIndex={2000}
              CountryArrow={true}
              disabled={true}
              dropdownContainerStyle={{
                backgroundColor: isDarkMode
                  ? Colors.darkTheme.backgroundColor
                  : Colors.lightTheme.backgroundColor,
              }}
            />
          </View> */}
          <TxtInput
            value={country}
            containerStyle={styles.inputField}
            placeholder={t('Select Country')}
            editable={false}
            onChangeText={setCountry}
          />

          <Text style={styles.label}>{t('State/Province')}</Text>
          <TxtInput
            value={state}
            containerStyle={styles.inputField}
            placeholder={t('Select State/Province')}
            editable={false}
            onChangeText={setState}
          />

          <Text style={styles.label}>{t('City')}</Text>
          <TxtInput
            value={city}
            containerStyle={styles.inputField}
            placeholder={t('Enter your city')}
            editable={false}
            onChangeText={setCity}
          />

          {/* <Text style={styles.label}>{t('Postal Code')}</Text>
          <TxtInput
            value={postalCode}
            containerStyle={styles.inputField}
            placeholder={t('Add your postal code')}
            onChangeText={setPostalCode}
            editable={false}
            keyboardType={'number-pad'}
          /> */}

          <Text style={styles.label}>{t('Street Address (Optional)')}</Text>
          <View style={styles.addressContainer}>
            <TxtInput
              value={address ? address : `${postalCode}, ${city}, ${country}`}
              containerStyle={[styles.inputField, {marginBottom: hp(0)}]}
              placeholder={t('Add street, office address')}
              onChangeText={setAddress}
              style={{flex: 1}}
              multiline={true}
              editable={false}
            />
            {/* <CustomButton
              containerStyle={styles.mapBtn}
              text={t('Map')}
              textStyle={styles.mapBtnText}
              mode
              svg={<Svgs.MapIcon />}
              onPress={HandleMap}
            /> */}
          </View>

          {user?.worker?.latitude && user?.worker?.longitude && (
            <View style={styles.mapContainer}>
              <Text style={styles.label}>{t('Your Location')}</Text>
              <MapComponent
                initialLat={parseFloat(user?.worker?.latitude)}
                initialLng={parseFloat(user?.worker?.longitude)}
                initialZoom={15}
                markers={[
                  {
                    lat: parseFloat(user?.worker?.latitude),
                    lng: parseFloat(user?.worker?.longitude),
                    title: `${user?.worker?.first_name} ${user?.worker?.last_name}`,
                    description: address || city || '',
                  },
                ]}
                height={200}
                showSearch={false}
                showCurrentLocationButton={false}
                editable={false}
              />
            </View>
          )}
        </View>

        <CameraBottomSheet
          refRBSheet={cameraSheet_ref}
          onPick={img => {
            if (img?.path) {
              setImage(img);
            } else if (typeof img === 'string') {
              setImage(img);
            }
          }}
          cameraType={'back'}
        />

        {/* National ID Camera Bottom Sheet */}
        <CameraBottomSheet
          refRBSheet={nationalIdSheet_ref}
          onPick={img => {
            // Determine which side to update based on how the sheet was opened
            const side = img.side || 'front';
            if (side === 'front') {
              if (img?.path) {
                setNationalIdFrontImage(img);
              }
            } else {
              if (img?.path) {
                setNationalIdBackImage(img);
              }
            }
          }}
          document={true}
          cameraType={'front'}
        />

        {/* DOB Date Picker */}
        <CustomDateTimePicker
          isVisible={showDOBPicker}
          onClose={() => setShowDOBPicker(false)}
          onConfirm={handleDOBConfirm}
          mode="date"
        />
      </ScrollView>

      <View style={styles.btnContainer}>
        <CustomButton
          text={t('Update')}
          onPress={handleSaveProfile}
          textStyle={[
            styles.continueButtonText,
            // {
            //   color: primaryButtonColors.textColor,
            // },
          ]}
          containerStyle={[
            styles.continueButton,
            // {
            //   backgroundColor: primaryButtonColors.backgroundColor,
            // },
          ]}
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
    scrollContainer: {
      flex: 1,
    },
    profileImageSection: {
      marginBottom: hp(2),
      flexDirection: 'row',
    },
    editSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      borderWidth: 1,
      borderColor: Colors.darkTheme.primaryColor,
      borderRadius: wp(10),
      paddingVertical: hp(0.8),
      paddingHorizontal: wp(3),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(0.5),
    },

    editButtonText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },
    sizeInfo: {
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsRegular,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
    },
    imageContainer: {
      position: 'relative',
      marginBottom: hp(1),
      width: wp(26),
      height: wp(26),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: wp(13),
    },
    profileImage: {
      width: wp(26),
      height: wp(26),
      borderRadius: wp(13),
    },
    cameraIcon: {
      position: 'absolute',
      bottom: wp(1),
      right: -4,
    },
    changePhotoText: {
      fontSize: RFPercentage(1.8),
      fontFamily: Fonts.PoppinsMedium,
      color: Colors.primary,
    },
    section: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
      marginHorizontal: wp(5),
      marginTop: hp(2),
      borderRadius: wp(3),
      padding: wp(4),
    },
    sectionTitle: {
      fontSize: RFPercentage(pxToPercentage(20)),
      fontFamily: Fonts.PoppinsSemiBold,
      marginBottom: hp(2),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      marginBottom: hp(0.5),
      marginTop: hp(1),
    },
    EmailNotEdit: {
      fontSize: RFPercentage(pxToPercentage(14)),
      fontFamily: Fonts.PoppinsMedium,
      color: Colors.error,
      marginBottom: hp(0.5),
    },
    inputField: {
      marginBottom: hp(1),
      backgroundColor: 'transparent',
    },
    addressContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: wp(3),
    },
    mapContainer: {
      marginTop: hp(2),
      borderRadius: 10,
      overflow: 'hidden',
    },
    dropdownContainer: {
      zIndex: 10000,
      marginRight: wp(5),
      width: '100%',
      marginBottom: hp(2),
      position: 'relative',
    },
    mapBtn: {
      paddingVertical: hp(1.3),
      borderRadius: wp(3),
      alignItems: 'center',
      flex: 0.3,
      borderWidth: 1,
    },
    mapBtnText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    bioInput: {
      minHeight: hp(10),
      textAlignVertical: 'top',
    },
    btnContainer: {
      paddingVertical: hp(2),
      paddingTop: hp(2),
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.secondryColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      paddingVertical: hp(1.5),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(5),
    },

    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(16)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    nameContainer: {
      marginBottom: hp(1.5),
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nameInput: {
      flex: 1,
      width: wp(40),
      height: hp(5),
    },
    pendingUpdateNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: wp(5),
      marginTop: hp(1),
      marginBottom: hp(1),
      padding: wp(3),
      borderRadius: wp(2),
      gap: wp(2),
    },
    pendingUpdateText: {
      flex: 1,
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    // National ID Document Styles
    nationalIdSection: {
      marginBottom: hp(2),
    },
    nationalIdImageContainer: {
      position: 'relative',
      alignItems: 'center',
      backgroundColor: Colors.lightTheme.secondryColor,
      borderRadius: wp(3),
    },
    nationalIdImage: {
      height: hp(30),
      width: '100%',
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
    },
    pdfContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: hp(20),
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      padding: wp(4),
    },
    pdfText: {
      width: '15%',
      marginTop: hp(1),
      fontSize: RFPercentage(1.6),
      fontFamily: Fonts.PoppinsMedium,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      textAlign: 'center',
    },
    nationalIdEditIcon: {
      position: 'absolute',
      top: wp(1),
      right: wp(1),
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: wp(2),
      padding: wp(1.5),
    },
    nationalIdRemoveIcon: {
      position: 'absolute',
      top: wp(1),
      left: wp(1),
      backgroundColor: 'rgba(220, 38, 38, 0.8)',
      borderRadius: wp(2),
      padding: wp(1.5),
    },
    nationalIdUploadButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderRadius: wp(3),
      padding: wp(8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.cardBackground
        : Colors.lightTheme.cardBackground,
    },
    nationalIdUploadText: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginTop: hp(1),
      textAlign: 'center',
    },
    nationalIdHint: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode
        ? Colors.darkTheme.QuaternaryText
        : Colors.lightTheme.QuaternaryText,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: hp(0.5),
      textAlign: 'center',
    },
    nationalIdSubLabel: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.5),
    },
  });

export default EditProfile;
