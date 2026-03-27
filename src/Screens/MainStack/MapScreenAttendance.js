import Geolocation from '@react-native-community/geolocation';
import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {RFPercentage} from 'react-native-responsive-fontsize';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {WebView} from 'react-native-webview';
import {useSelector} from 'react-redux';
import CustomButton from '../../components/Buttons/customButton';
import {attendancePunch, postValidateLocation} from '../../Constants/api';
import {Fonts} from '../../Constants/Fonts';
import {SCREENS} from '../../Constants/Screens';
import {Colors} from '../../Constants/themeColors';
import {useLocalizedAlert} from '../../Providers/useLocalizedAlert';

const MapScreenAttendance = ({route}) => {
  const {actionType, selfieUrl, onAttendanceSuccess, taskId, onTaskSuccess} =
    route?.params || {};
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store.theme);
  const localizedAlert = useLocalizedAlert();
  const token = useSelector(state => state?.auth?.user?.token);
  const {t} = useTranslation();
  const [locationData, setLocationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [invalidLocationError, setInvalidLocationError] = useState(false);
  const webViewRef = useRef(null);
  const styles = dynamicStyles(isDarkMode);

  useEffect(() => {
    updateToSpecificLocation();
  }, []);

  const updateToSpecificLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setInvalidLocationError(false);

      Geolocation.getCurrentPosition(
        async info => {
          try {
            let latitude = info.coords.latitude;
            let longitude = info.coords.longitude;
            console.log(longitude, latitude, 'long lati');

            console.log('Updating to specific coordinates:', {
              latitude,
              longitude,
            });
            const validatedLocationApi = await postValidateLocation(
              {
                gps_lat: latitude,
                gps_lng: longitude,
              },
              token,
            );
            // localizedAlert(validatedLocationApi, 'error');
            console.log(
              'Location validation API response:',
              JSON.stringify(validatedLocationApi, null, 2),
            );

            const isInvalidLocation =
              validatedLocationApi?.error === true ||
              validatedLocationApi?.data?.valid === false ||
              validatedLocationApi?.message
                ?.toLowerCase()
                .includes('invalid location') ||
              validatedLocationApi?.message_en
                ?.toLowerCase()
                .includes('invalid location') ||
              validatedLocationApi?.message_es
                ?.toLowerCase()
                .includes('invalid location') ||
              validatedLocationApi?.message
                ?.toLowerCase()
                .includes('invalid') ||
              validatedLocationApi?.message_en
                ?.toLowerCase()
                .includes('invalid') ||
              validatedLocationApi?.message_es
                ?.toLowerCase()
                .includes('invalid') ||
              validatedLocationApi?.data?.message
                ?.toLowerCase()
                .includes('invalid');

            console.log('Is invalid location:', isInvalidLocation);

            if (isInvalidLocation) {
              setInvalidLocationError(true);
            }

            const {address, components} = await reverseGeocode(
              latitude,
              longitude,
            );
            const extracted = extractAddressComponents(components);

            const locObj = {
              ...extracted,
              address: address || '',
              latitude,
              longitude,
              name: t('Specific Location'),
            };

            setLocationData(locObj);

            setMarker({
              lat: latitude,
              lng: longitude,
              title: t('Specific Location'),
              description: address || t('Specific location'),
            });

            setView(latitude, longitude, 15);
            updateMarkerPosition(latitude, longitude);

            console.log('Updated address for specific coordinates:', {
              latitude,
              longitude,
              address,
              extracted,
            });
          } catch (err) {
            console.warn('Reverse geocoding failed:', err);
            const locObj = {
              address: '',
              latitude: info.coords.latitude,
              longitude: info.coords.longitude,
              name: t('Specific Location'),
            };
            setLocationData(locObj);
            setMarker({
              lat: info.coords.latitude,
              lng: info.coords.longitude,
              title: t('Specific Location'),
              description: t('Specific location'),
            });
            setView(info.coords.latitude, info.coords.longitude, 15);
            updateMarkerPosition(info.coords.latitude, info.coords.longitude);
          }
        },
        error => {
          let errorMessage;
          if (error.code === 2) {
            errorMessage = t(
              'No location provider available. Please turn on your GPS.',
            );
          } else if (error.code === 1) {
            errorMessage = t(
              'Location permission denied. Please enable location access.',
            );
          } else if (error.code === 3) {
            errorMessage = t('Location request timed out. Please try again.');
          } else {
            errorMessage = error.message || t('Location error occurred');
          }
          setLocationError(errorMessage);
          setIsLoading(false);
        },
      );
    } catch (err) {
      localizedAlert(err, 'error');
      console.error('Error getting location:', err);
    } finally {
      setIsLoading(false);
    }
  }, [t, localizedAlert, setLocationError]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your@email.com)',
            'Accept-Language': 'en',
          },
        },
      );

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
      console.error('Reverse geocoding error:', error);
      return {
        address: '',
        components: {},
      };
    }
  };

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
      streetAddress: `${components.house_number || ''} ${
        components.road || ''
      }`.trim(),
      city: cityValue,
      province: components.state || components.county || '',
      postalCode: components.postcode || '',
      country: components.country || '',
    };
  };

  const handleConfirmAttendance = async () => {
    setConfirmLoading(true);

    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const appVersion = DeviceInfo.getVersion();
      const currentTimestamp = new Date().toISOString();

   

      // Use the correct action_type format for API
      const attendanceData = {
        action_type: actionType, // This will be CLOCK_IN, BREAK_START, BREAK_END, or CLOCK_OUT
        gps_lat: String(locationData?.latitude || '40.42300000'),
        gps_lng: String(locationData?.longitude || '-3.68000000'),
        gps_accuracy: String(locationData?.accuracy || '100'),
        selfie: selfieUrl || '',
        device_timestamp: currentTimestamp,
        source: 'mobile',
        app_version: appVersion,
        device_id: deviceId,
        locationText: locationData?.address || t('Location not available'),
      };

      console.log(
        'Sending attendance data with action_type:',
        JSON.stringify(attendanceData, null, 2),
      );

      try {
        const response = await attendancePunch(attendanceData, token);
        if (actionType === 'taskUpdation') {
        setTimeout(() => {
          navigation.navigate(SCREENS.DASHBOARD, {
            screen: SCREENS.TASKS,
            params: {
              locationData,
              taskId,
              selfie: selfieUrl,
            },
          });
        }, 1000);  
          setConfirmLoading(false);
  
          onTaskSuccess && onTaskSuccess(selfieUrl);
  
          return;
        }
        console.log(
          'Attendance API Response:',
          JSON.stringify(response, null, 2),
        );
        if (response?.error === false) {
          console.log(
            'response indicates success:',
            JSON.stringify(response, null, 2),
          );

          localizedAlert(response, 'success');
          if (onAttendanceSuccess) {
            console.log('Calling attendance success callback');
            onAttendanceSuccess();

            // Add a longer delay to ensure state updates
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Check if there's a taskId to navigate to task details
          if (taskId) {
            // Navigate to task details with updated status
            setTimeout(() => {
              navigation.navigate(SCREENS.TASKDETAIL, {
                taskId: taskId,
                taskData: {
                  ...route?.params?.taskData,
                  status: response?.data?.status || 'Updated',
                  attendanceUpdated: true,
                },
                locationData,
                selfie: selfieUrl,
              });
            }, 500);
          } else {
            // Navigate back to dashboard if no task
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{name: 'Dashboard'}],
              });
            }, 1500);
          }
        } else {
          localizedAlert(response, 'error');
          // Navigate back to dashboard on error if no task
          if (!taskId) {
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{name: 'Dashboard'}],
              });
            }, 1500);
          }
        }
      } catch (punchError) {
        console.error('Punch function error:', punchError);
        // For testing, still call success even on error
        if (onAttendanceSuccess) {
          onAttendanceSuccess();
        }

        // Check if there's a taskId to navigate to task details even on error
        if (taskId) {
          setTimeout(() => {
            navigation.navigate(SCREENS.TASKDETAIL, {
              taskId: taskId,
              taskData: {
                ...route?.params?.taskData,
                status: 'Updated',
                attendanceUpdated: true,
              },
              locationData,
              selfie: selfieUrl,
            });
          }, 500);
        } else {
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{name: 'Dashboard'}],
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
      localizedAlert(error, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getActionTitle = action => {
    const titles = {
      CLOCK_IN: t('Clock In'),
      BREAK_START: t('Start Break'),
      BREAK_END: t('End Break'),
      CLOCK_OUT: t('Clock Out'),
      taskUpdation: t('Update Task'),
    };
    return titles[action] || t('Attendance');
  };

  // Helper functions for WebView (these would need to be implemented)
  const setMarker = marker => {
    // Implementation for setting marker
  };

  const setView = (lat, lng, zoom) => {
    // Implementation for setting view
  };

  const updateMarkerPosition = (lat, lng) => {
    // Implementation for updating marker position
  };

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
      <style>
        body { margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; }
        #mapid { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="mapid"></div>
      <script>
        var map = L.map('mapid').setView([${
          locationData?.latitude || 40.423
        }, ${locationData?.longitude || -3.68}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        // Custom red icon
        var redIcon = new L.Icon({
          iconUrl: ${
            actionType === 'BREAK_START'
          } ?"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png":${
    actionType === 'BREAK_END'
  }?'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png':${
    actionType === 'CLOCK_IN'
  }?"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png":'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        var marker = L.marker([${locationData?.latitude || 40.423}, ${
    locationData?.longitude || -3.68
  }], {icon: redIcon}).addTo(map);
        marker.bindPopup('${(
          locationData?.address || t('Your Location')
        ).replace(/'/g, "\\'")}');
        marker.openPopup();
      </script>
    </body>
  </html>
`;

  const getButtonColor = actionType => {
    switch (actionType) {
      case 'BREAK_START':
        return '#8A2BE2';
      case 'BREAK_END':
        return '#34C759';
      case 'CLOCK_IN':
        return '#007AFF';
      case 'CLOCK_OUT':
        return '#FF3B30';
      default:
        return '#006EC2';
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name={'chevron-left'}
            size={RFPercentage(4)}
            color={
              isDarkMode
                ? Colors.darkTheme.primaryBtn.TextColor
                : Colors.lightTheme.black
            }
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>{getActionTitle(actionType)}</Text>
        <View style={styles.emptyView} />
      </View>

      {/* Invalid Location Error Banner */}
      {invalidLocationError && (
        <View style={styles.invalidLocationBanner}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color="#FF6B6B"
          />
          <Text style={styles.invalidLocationText}>
            {t(
              'Your work location does not match your assigned work schedule; therefore, this punch will be considered an invalid punch.',
            )}
          </Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006EC2" />
          <Text style={styles.loadingText}>
            {t('Getting your location...')}
          </Text>
        </View>
      )}

      {/* Error State with Reload */}
      {!isLoading && locationError && (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="map-marker-alert"
            size={RFPercentage(8)}
            color="#FF6B6B"
          />
          <Text
            style={[
              styles.loadingText,
              {marginTop: 15, textAlign: 'center', paddingHorizontal: 20},
            ]}>
            {locationError}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#006EC2',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => {
              setLocationError(null);
              updateToSpecificLocation();
            }}>
            <MaterialCommunityIcons
              name="refresh"
              size={RFPercentage(3)}
              color="#FFFFFF"
            />
            <Text style={{color: '#FFFFFF', marginLeft: 8, fontSize: 16}}>
              {t('Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      {!isLoading && locationData && (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{html: htmlContent}}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        </View>
      )}

      {/* Bottom Modal */}
      {!isLoading && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalAddress} numberOfLines={2}>
              {locationData?.address || t('Location not available')}
            </Text>
            <Text style={styles.actionText}>
              {t('Ready to {{action}}?', {
                action: getActionTitle(actionType).toLowerCase(),
              })}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              text={t('Cancel')}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{name: 'Dashboard'}],
                });
              }}
              textStyle={styles.backBtnText}
              containerStyle={styles.backBtn}
            />
            <CustomButton
              text={t('Confirm {{action}}', {
                action: getActionTitle(actionType),
              })}
              onPress={handleConfirmAttendance}
              textStyle={[
                styles.confirmBtnText,
                (locationError || !locationData) && {color: '#A0A0A0'},
              ]}
              containerStyle={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    locationError || !locationData
                      ? '#D1D5DB'
                      : getButtonColor(actionType),
                },
              ]}
              disabled={!!locationError || !locationData}
              loading={confirmLoading}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
    },
    backIcon: {
      marginTop: -5,
    },
    headerText: {
      fontSize: RFPercentage(2.1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
      textAlign: 'center',
      flex: 1,
    },
    emptyView: {
      width: 40,
    },
    invalidLocationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF6B6B20',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginTop: 10,
    },
    invalidLocationText: {
      color: '#FF6B6B',
      fontSize: 13,
      flex: 1,
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
    },
    mapContainer: {
      flex: 1,
    },
    webview: {
      flex: 1,
    },
    modalOverlay: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: {width: 0, height: -2},
      shadowRadius: 4,
      elevation: 10,
    },
    modalContainer: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#dcdcdc',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
    },
    modalAddress: {
      fontSize: 16,
      color: isDarkMode
        ? Colors.darkTheme.primaryTextColor
        : Colors.lightTheme.primaryTextColor,
      fontFamily: Fonts.PoppinsMedium,
    },
    actionText: {
      fontSize: 14,
      color: isDarkMode
        ? Colors.darkTheme.secondryTextColor
        : Colors.lightTheme.secondryTextColor,
      fontFamily: Fonts.PoppinsRegular,
      marginTop: 5,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    backBtn: {
      backgroundColor: isDarkMode ? '#444' : '#dcdcdc',
      paddingVertical: 12,
      borderRadius: 8,
      width: '30%',
    },
    backBtnText: {
      fontSize: RFPercentage(1.7),
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
    confirmBtn: {
      paddingVertical: 12,
      borderRadius: 8,
      width: '65%',
    },
    confirmBtnText: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
    },
  });

export default MapScreenAttendance;
