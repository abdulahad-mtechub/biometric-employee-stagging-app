import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { Fonts } from '../../Constants/Fonts';
import { SCREENS } from '../../Constants/Screens';
import { Colors } from '../../Constants/themeColors';
import { useAlert } from '../../Providers/AlertContext';
import { Images } from '../../assets/Images/Images';
import { Svgs } from '../../assets/Svgs/Svgs';
import CustomButton from '../../components/Buttons/customButton';
import { pxToPercentage } from '../../utils/responsive';
import useBackHandler from '../../utils/useBackHandler';

const ProfileVerification = ({ navigation, route }) => {
  const { isDarkMode } = useSelector(store => store.theme);
  const [step, setStep] = useState(1);
  const totalSteps = 2;
  const { t } = useTranslation();
  const progress = ((step - 1) / (totalSteps - 1)) * 100;
  const indexx = route.params?.indexx;
  const [index, setIndex] = useState(indexx || 0);
  const BackHandler = () => {
    setIndex(prev => (prev > 0 ? prev - 1 : navigation.goBack()));
    setStep(1);
  };

  useBackHandler(BackHandler);

  const handleContinue = () => {
    if (index === 0) {
      setIndex(1);
    } else if (index === 1) {
      setStep(2);
      setIndex(2);
    } else if (index === 2) {
      navigation.navigate(SCREENS.FACESCANING);
    }
  };

  const styles = dynamicStyles(isDarkMode);

  const CreateProfileComponent = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.paginationContainer}>
          <Svgs.checkedCircled height={hp(3.5)} />
          <View style={styles.line} />
          <Text style={[styles.paginationText, styles.activeText]}>2</Text>
        </View>
        <View style={[styles.contentContainer, { alignItems: 'center' }]}>
          <Svgs.Logo style={{ marginBottom: hp(2) }} />

          <View style={styles.headerContainer}>
            <Text style={styles.heading}>{t('Profile Verification')}</Text>
            <Text style={[styles.subheading, { lineHeight: hp(3) }]}>
              <Text style={{ fontFamily: Fonts.NunitoBold }}>
                {t('Identity Verification:')}{' '}
              </Text>
              {t('Verify your identity through location and face scanning')}
            </Text>
          </View>

          <View style={{ flex: 1, alignItems: 'center', marginTop: hp(7) }}>
            <Image
              source={Images.CreateUserProfile}
              style={{ height: hp(40), width: hp(40), resizeMode: 'contain' }}
            />
          </View>
        </View>
      </View>
    );
  };

  const FaceScanComponent = () => {
    return (
      <View style={[styles.inputsContainer]}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>{t('Face Scan')}</Text>
            <Text style={styles.subheading}>
              {t(
                'Take a clear biometric selfie to verify your identity securely.',
              )}
            </Text>
          </View>

          <View style={{ flex: 1, alignItems: 'center', marginTop: hp(7) }}>
            <Image
              source={Images.faceScan}
              style={{ height: hp(40), width: hp(40), resizeMode: 'contain' }}
            />
          </View>
        </View>
      </View>
    );
  };

  const LocationComponent = () => {
    const webViewRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState({
      latitude: 40.7128,
      longitude: -74.006,
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const { showAlert } = useAlert();

    // Auto-fetch current location on mount
    React.useEffect(() => {
      updateToSpecificLocation();
    }, []);

    const lastRequestTimeRef = useRef(0);
    const MIN_REQUEST_INTERVAL = 2000;

    const waitForRateLimit = async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`⏳ Waiting ${waitTime}ms for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      lastRequestTimeRef.current = Date.now();
    };

    const reverseGeocode = async (lat, lng) => {
      try {
        await waitForRateLimit();

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        console.log('🔄 Reverse Geocode URL:', url);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'BiometricProWorkerApp/1.0',
            'Accept-Language': 'en',
            Referer: 'https://biometricpro.app',
          },
        });

        console.log('🔄 Reverse Geocode Response Status:', response.status);

        if (response.status === 403 || response.status === 429) {
          console.warn('⚠️ Reverse geocode blocked/limited');
          return {
            address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
            components: {},
          };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'Reverse geocoding failed');
        }

        return {
          address: data.display_name,
          components: data.address || {},
        };
      } catch (error) {
        console.error('❌ Reverse geocoding error:', error.message);
        return {
          address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          components: {},
        };
      }
    };

    const updateToSpecificLocation = useCallback(async () => {
      try {
        setIsLoading(true);

        Geolocation.getCurrentPosition(async info => {
          try {
            let latitude = info.coords.latitude;
            let longitude = info.coords.longitude;
            const { address, components } = await reverseGeocode(
              latitude,
              longitude,
            );
            const extracted = extractAddressComponents(components);
            setCurrentLocation({
              latitude: latitude,
              longitude: longitude,
            });

            setView(latitude, longitude);
            const locObj = {
              ...extracted,
              address: address || '',
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              name: t('Specific Location'),
            };

            setSelectedLocation(locObj);
          } catch (err) {
            console.warn('Reverse geocoding failed:', err);
            const locObj = {
              address: '',
              latitude: info.coords.latitude.toString(),
              longitude: info.coords.longitude.toString(),
              street_address: '',
              city: '',
              community: '',
              province: '',
              postal_code: '',
              country: '',
              assign_region: '',
              assign_zone: '',
              name: t('Specific Location'),
            };
            setView(info.coords.latitude, info.coords.longitude, 15);
            setSelectedLocation(locObj);
          }
        });
      } catch (err) {
        console.warn('Failed to update to specific location:', err);
        showAlert(
          t('Failed to update to specific location. Please try again.'),
          'error',
        );
      } finally {
        setIsLoading(false);
      }
    }, [t]);

    const extractAddressComponents = (components = {}) => {
      // Nominatim API returns different field names depending on location type:
      // city, town, village, municipality, county, state_district, etc.
      const cityValue =
        components.city ||
        components.town ||
        components.village ||
        components.municipality ||
        components.county ||
        components.state_district ||
        '';
      return {
        street_address: components.road || components.street || '',
        city: cityValue,
        community:
          components.city ||
          components.town ||
          components.village ||
          components.municipality ||
          components.suburb ||
          components.neighbourhood ||
          '',
        province: components.state || components.county || '',
        postal_code: components.postcode || '',
        country: components.country || '',
        assign_region: '',
        assign_zone: '',
      };
    };

    const handleMessage = event => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'mapReady') {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error parsing WebView message:', error);
      }
    };

    const setView = (lat, lng, zoom = 15) => {
      if (webViewRef.current) {
        const message = JSON.stringify({
          type: 'setView',
          data: { lat, lng, zoom },
        });
        webViewRef.current.postMessage(message);
      }
    };

    const handleConfirmLocation = async () => {
      if (!selectedLocation) {
        showAlert(t('Please select a location'), 'error');
        return;
      }

      try {
        console.log('✅ Confirming Location:', selectedLocation);

        // Save location to AsyncStorage
        await AsyncStorage.setItem(
          'selectedLocation',
          JSON.stringify(selectedLocation),
        );

        console.log('💾 Location saved to AsyncStorage');

        // Navigate to next step or screen
        showAlert(t('Location confirmed successfully'), 'success');

        // Move to next step
        setTimeout(() => {
          handleContinue();
        }, 500);
      } catch (error) {
        console.error('❌ Error confirming location:', error);
        showAlert(t('Failed to confirm location. Please try again.'), 'error');
      }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background-color: #f8f9fa;
          }
          #mapid { 
            height: 100vh; 
            width: 100vw;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div id="mapid"></div>
        <div id="loading" class="loading">Loading map...</div>
        <script>
          // Create map with disabled interactions
          var map = L.map('mapid', {
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false
          }).setView([${currentLocation.latitude}, ${currentLocation.longitude}], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
          }).addTo(map);

          document.getElementById('loading').style.display = 'none';

          // Create non-draggable marker
          var marker = L.marker([${currentLocation.latitude}, ${currentLocation.longitude}], { 
            draggable: false 
          }).addTo(map);

          // Handle messages from React Native to update map view
          window.addEventListener('message', function(event) {
            try {
              const message = JSON.parse(event.data);
              
              if (message.type === 'setView') {
                map.setView([message.data.lat, message.data.lng], message.data.zoom || 15);
                marker.setLatLng([message.data.lat, message.data.lng]);
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });

          setTimeout(function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
          }, 1000);
        </script>
      </body>
    </html>
  `;

    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.headerText}>{t('Your Current Location')}</Text>

        {/* Location Information Fields */}
        {selectedLocation && (
          <View style={styles.locationFieldsContainer}>
            <View style={styles.locationField}>
              <Text style={styles.locationFieldLabel}>{t('Country')}</Text>
              <Text style={styles.locationFieldValue}>
                {selectedLocation.country || t('N/A')}
              </Text>
            </View>
            <View style={styles.locationField}>
              <Text style={styles.locationFieldLabel}>{t('Province/State')}</Text>
              <Text style={styles.locationFieldValue}>
                {selectedLocation.province || t('N/A')}
              </Text>
            </View>
            <View style={styles.locationField}>
              <Text style={styles.locationFieldLabel}>{t('City')}</Text>
              <Text style={styles.locationFieldValue}>
                {selectedLocation.city || t('N/A')}
              </Text>
            </View>
            <View style={styles.locationField}>
              <Text style={styles.locationFieldLabel}>{t('Address')}</Text>
              <Text style={styles.locationFieldValue} numberOfLines={2}>
                {selectedLocation.address || t('N/A')}
              </Text>
            </View>
          </View>
        )}

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#006EC2" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={[styles.webview, isLoading && styles.hiddenWebview]}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={false}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setIsLoading(false);
            }}
          />
        </View>

        {/* Bottom Container */}
        <View style={styles.bottomContainer}>
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationLabel}>
              {t('Current GPS Location:')}
            </Text>
            <Text style={styles.selectedLocationText} numberOfLines={2}>
              {selectedLocation?.address ||
                t('Fetching your current location...')}
            </Text>
          </View>
          <CustomButton
            text={t('Confirm Location')}
            onPress={handleConfirmLocation}
            disabled={!selectedLocation}
            containerStyle={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled,
            ]}
            textStyle={styles.confirmButtonText}
          />
        </View>
      </View>
    );
  };

  const renderView = () => {
    switch (index) {
      case 1:
        return <LocationComponent />;
      case 2:
        return FaceScanComponent();
      default:
        return CreateProfileComponent();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: hp(2) }}>
        {index !== 0 && (
          <View style={styles.backArrowContainer}>
            <MaterialCommunityIcons
              name={'chevron-left'}
              size={RFPercentage(4)}
              color={
                isDarkMode
                  ? Colors.darkTheme.secondryTextColor
                  : Colors.lightTheme.iconColor
              }
              onPress={() => {
                if (index === 1) {
                  setIndex(0);
                } else if (index === 2) {
                  setIndex(1);
                  setStep(1);
                } else {
                  navigation.goBack();
                }
              }}
            />
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.stepText}>{`${step}/${totalSteps}`}</Text>
            </View>
          </View>
        )}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {renderView()}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {index !== 1 && (
        <CustomButton
          text={index === 0 ? 'Next' : 'Scan'}
          onPress={handleContinue}
          textStyle={styles.continueButtonText}
          containerStyle={[styles.continueButton, { marginBottom: hp(2.5) }]}
        />
      )}
    </View>
  );
};

export default ProfileVerification;

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    contentContainer: {
      flex: 1,
    },
    paginationContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      marginBottom: hp(3),
    },
    line: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      height: hp(0.2),
      alignSelf: 'center',
      width: wp(30),
      marginHorizontal: wp(1),
    },
    paginationText: {
      fontSize: RFPercentage(2),
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.BorderGrayColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderWidth: 1,
      borderRadius: wp(100),
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.2),
    },
    activeText: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.darkTheme.primaryTextColor,
      borderColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
      borderWidth: 1,
    },
    backArrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
    progressContainer: {
      flex: 1,
      marginLeft: 10,
      alignItems: 'center',
      flexDirection: 'row',
    },
    progressBackground: {
      height: hp(1),
      backgroundColor: '#ddd',
      borderRadius: 4,
      width: '70%',
      overflow: 'hidden',
      marginHorizontal: hp(2),
    },
    progressFill: {
      height: 6,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryColor
        : Colors.lightTheme.primaryColor,
    },

    stepText: {
      fontSize: 12,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsRegular,
    },
    headerContainer: {
      alignItems: 'center',
    },
    headerText: {
      fontSize: RFPercentage(2.1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    heading: {
      fontSize: RFPercentage(pxToPercentage(25)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    subheading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.NunitoRegular,
      textAlign: 'center',
      width: wp(80),
    },
    inputsContainer: {
      paddingBottom: hp(5),
      flex: 1,
    },

    label: {
      fontSize: RFPercentage(1.8),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
      width: wp(80),
      marginBottom: hp(0.5),
    },
    inputField: {
      borderRadius: wp(3),
      marginBottom: hp(2),
    },

    btnContainer: {
      borderTopColor: isDarkMode
        ? Colors.darkTheme.BorderGrayColor
        : Colors.lightTheme.BorderGrayColor,
      borderTopWidth: 1,
      position: 'absolute',
      bottom: hp(2.5),
      left: wp(0),
      right: wp(0),
      paddingTop: wp(5),
      paddingHorizontal: wp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    continueButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingVertical: hp(1.2),
      borderRadius: wp(3),
      alignItems: 'center',
      marginHorizontal: wp(5),
    },
    continueButtonText: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    ManualLocationContainer: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      height: hp(22),
      width: wp(100),
      borderTopLeftRadius: wp(5),
      borderTopRightRadius: wp(5),
      paddingHorizontal: wp(5),
      overflow: 'hidden',
    },
    ManualLocationHeading: {
      fontSize: RFPercentage(pxToPercentage(18)),
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsSemiBold,
      marginTop: hp(2),
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
      bottom: hp(25),
      right: wp(5),
      elevation: 10,
    },
    webview: {
      flex: 1,
    },
    hiddenWebview: {
      opacity: 0,
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000' : '#f8f9fa',
      zIndex: 10,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#656d76',
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: isDarkMode ? '#222' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e1e5e9',
      zIndex: 1,
    },
    searchInputContainer: {
      flex: 1,
      position: 'relative',
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#d0d7de',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingRight: 40,
      backgroundColor: isDarkMode ? '#333' : '#f6f8fa',
      color: isDarkMode ? '#fff' : '#000',
      marginRight: 12,
    },
    searchButton: {
      backgroundColor: Colors.darkTheme.primaryBtn.BtnColor,
      paddingHorizontal: 20,
      borderRadius: 8,
      justifyContent: 'center',
    },
    searchButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    clearButton: {
      position: 'absolute',
      right: 20,
      top: 12,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearButtonText: {
      color: isDarkMode ? '#ccc' : '#666',
      fontSize: 16,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: hp(11.5),
      left: 12,
      right: 12,
      backgroundColor: isDarkMode ? '#222' : '#fff',
      borderRadius: 8,
      maxHeight: hp(35),
      zIndex: 2,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e1e5e9',
      overflow: 'hidden',
    },
    suggestionText: {
      flex: 1,
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 14,
      fontFamily: Fonts.PoppinsRegular,
    },

    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? '#222' : '#fff',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333' : '#e1e5e9',
    },
    selectedLocationContainer: {
      backgroundColor: isDarkMode ? '#333' : '#f6f8fa',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    selectedLocationText: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 14,
      fontFamily: Fonts.PoppinsRegular,
    },
    confirmButton: {
      backgroundColor: Colors.darkTheme.primaryBtn.BtnColor,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: Fonts.PoppinsSemiBold,
    },
    mapContainer: {
      flex: 1,
      marginBottom: 120,
    },
    currentLocationButton: {
      position: 'absolute',
      bottom: 120,
      right: 20,
      backgroundColor: '#006EC2',
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      zIndex: 100,
    },
    searchButtonDisabled: {
      backgroundColor: isDarkMode ? '#555' : '#8c959f',
    },
    suggestionText: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 14,
    },
    selectedLocationLabel: {
      fontSize: 12,
      color: isDarkMode ? '#ccc' : '#666',
      marginBottom: 4,
      fontFamily: Fonts.PoppinsMedium,
    },
    confirmButtonDisabled: {
      backgroundColor: isDarkMode ? '#555' : '#8c959f',
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000' : '#f8f9fa',
      zIndex: 10,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#656d76',
      fontFamily: Fonts.PoppinsRegular,
    },
    locationFieldsContainer: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f6f8fa',
      marginHorizontal: wp(5),
      marginTop: hp(2),
      marginBottom: hp(2),
      paddingHorizontal: wp(4),
      paddingVertical: hp(2),
      borderRadius: wp(3),
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#e1e5e9',
    },
    locationField: {
      marginBottom: hp(1.5),
    },
    locationFieldLabel: {
      fontSize: RFPercentage(1.4),
      color: isDarkMode ? '#999' : '#666',
      fontFamily: Fonts.PoppinsMedium,
      marginBottom: hp(0.3),
    },
    locationFieldValue: {
      fontSize: RFPercentage(1.6),
      color: isDarkMode ? '#fff' : '#000',
      fontFamily: Fonts.PoppinsRegular,
    },
  });
