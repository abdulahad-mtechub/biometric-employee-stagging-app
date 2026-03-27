import Geolocation from '@react-native-community/geolocation';
import {useNavigation} from '@react-navigation/native';
import {Country} from 'country-state-city';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
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
import {WebView} from 'react-native-webview';
import {useDispatch, useSelector} from 'react-redux';
import CustomButton from '../../components/Buttons/customButton';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {setUserData} from '../../redux/Slices/authSlice';
import {getCurrentLocation} from '../../utils/LocationHelpers';

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

const MapScreen = ({route}) => {
  const {selectedLocation, CompanyScreen, onLocationUpdate} = route?.params || {};
  const {user, profile} = useSelector(state => state.auth);
  const {t} = useTranslation();
  const [fullAddressData, setFullAddressData] = useState(null);
  const [manualAddress, setManualAddress] = useState({
    latitude: '',
    longitude: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    countryCode: '',
    province: '',
    region: '',
    continent: '',
  });

  const [marker, setMarker] = useState({
    lat: selectedLocation?.latitude || 40.7128,
    lng: selectedLocation?.longitude || -74.006,
    title: t('Selected Location'),
    description: t('You selected this location'),
  });

  const webViewRef = useRef(null);
  const navigation = useNavigation();
  const {isDarkMode} = useSelector(store => store.theme);
  const dispatch = useDispatch();
  const {showAlert} = useAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedData, setSearchedData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Add rate limiting and debouncing refs
  const lastRequestTime = useRef(0);
  const debounceTimeoutRef = useRef(null);
  const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  useEffect(() => {
    const init = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        setHasLocationPermission(true);
        getCurrentPosition();
      }
    };
    init();
  }, []);

  const styles = dynamicStyles(isDarkMode);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('Location Permission'),
            message: t(
              'This app needs access to your location to show your current position on the map.',
            ),
            buttonNeutral: t('Ask Me Later'),
            buttonNegative: t('Cancel'),
            buttonPositive: t('OK'),
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('Location permission denied');
          showAlert(
            t('Location permission denied. Please enable it in app settings.'),
            'error',
          );
          return false;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('Location permission denied - never ask again');
          Alert.alert(
            t('Location Permission Required'),
            t(
              'This app needs location permission to function properly. Please enable it in app settings.',
            ),
            [
              {text: t('Cancel'), style: 'cancel'},
              {text: t('Open Settings'), onPress: () => Linking.openSettings()},
            ],
          );
          return false;
        }
      } else {
        return true;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
    return false;
  };

  // Rate limiting helper
  const waitForNextRequest = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
      );
    }

    lastRequestTime.current = Date.now();
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      await waitForNextRequest();

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent':
              'BiometricProWorkerApp/1.0 (contact@biometricpro.com)',
            'Accept-Language': 'en',
            Referer: 'https://biometricpro.com',
          },
        },
      );

      console.log('🔄 Reverse Geocode Response Status:', response.status);

      if (response.status === 403) {
        console.warn('⚠️ Nominatim API returned 403 - Rate limit or blocked');
        throw new Error(
          'API rate limit exceeded. Please try again in a moment.',
        );
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
      console.error('Reverse geocoding error:', error);
      return {
        address: '',
        components: {},
      };
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showAlert(t('Please enter a location to search'), 'error');
      return;
    }

    setIsSearching(true);
    setShowResults(false);

    try {
      await waitForNextRequest();

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=7`,
        {
          headers: {
            'User-Agent':
              'BiometricProWorkerApp/1.0 (contact@biometricpro.com)',
            'Accept-Language': 'en',
            Referer: 'https://biometricpro.com',
          },
        },
      );

      console.log('🔍 Search API Response Status:', response.status);

      if (response.status === 403) {
        showAlert(
          t('Search temporarily unavailable. Please try again in a moment.'),
          'error',
        );
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      console.log('🔍 Search Results Count:', data.length);

      setSearchedData(data);
      setShowResults(data.length > 0);

      if (data.length === 0) {
        showAlert(
          t('No locations found. Please try a different search term.'),
          'error',
        );
      } else {
        if (data.length === 1) {
          handleLocationSelect(data[0]);
        }
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      showAlert(
        t('Failed to search location. Please check your internet connection.'),
        'error',
      );
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSuggestions = async query => {
    setSearchQuery(query);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for 600ms debounce
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await waitForNextRequest();

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query,
          )}&limit=5`,
          {
            headers: {
              'User-Agent':
                'BiometricProWorkerApp/1.0 (contact@biometricpro.com)',
              'Accept-Language': 'en',
              Referer: 'https://biometricpro.com',
            },
          },
        );

        console.log('💡 Suggestions API Response Status:', response.status);

        if (response.status === 403) {
          console.warn('⚠️ Suggestions API rate limited');
          setSuggestions([]);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();

        console.log('💡 Suggestions Count:', data.length);

        const formatted = data.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));

        setSuggestions(formatted);
      } catch (error) {
        console.error('❌ Suggestions fetch error:', error);
        setSuggestions([]);
      }
    }, 600); // 600ms debounce
  };

  const getCurrentPosition = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsLoading(false);
          return;
        }
        setHasLocationPermission(true);
      }

      let locationData;
      try {
        locationData = await getCurrentLocation();

        if (
          (locationData.latitude === 0 && locationData.longitude === 0) ||
          !locationData.latitude ||
          !locationData.longitude
        ) {
          throw new Error('Invalid coordinates received');
        }
      } catch (error) {
        setIsLoading(false);
        return;
      }

      const {
        latitude,
        longitude,
        address,
        shortAddress: shortAdress,
      } = locationData;

      try {
        const {address: formattedAddress, components} = await reverseGeocode(
          latitude,
          longitude,
        );
        const extracted = extractAddressComponents(components);

        const locObj = {
          ...extracted,
          address: formattedAddress || address,
          shortAddress: shortAdress,
          latitude,
          longitude,
          name: '',
        };

        setFullAddressData(locObj);

        setMarker({
          lat: latitude,
          lng: longitude,
          title: t('Current Location'),
          description: formattedAddress || address || t('Current location'),
        });

        setView(latitude, longitude, 15);
        updateMarkerPosition(latitude, longitude);
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
        const locObj = {
          address: address || '',
          shortAddress: shortAdress,
          latitude,
          longitude,
          name: '',
        };
        setFullAddressData(locObj);
        setMarker({
          lat: latitude,
          lng: longitude,
          title: t('Current Location'),
          description: address || t('Current location'),
        });
        setView(latitude, longitude, 15);
        updateMarkerPosition(latitude, longitude);
      }
    } catch (err) {
      console.warn('Failed to get current location:', err);
      showAlert(
        t(
          'Failed to get current location. Please check location permissions or try again.',
        ),
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasLocationPermission]);

  const updateToSpecificLocation = useCallback(async () => {
    try {
      setIsLoading(true);

      Geolocation.getCurrentPosition(async info => {
        try {
          let latitude = info.coords.latitude;
          let longitude = info.coords.longitude;

          console.log('Updating to specific coordinates:', {
            latitude,
            longitude,
          });

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

          setFullAddressData(locObj);

          setMarker({
            lat: latitude,
            lng: longitude,
            title: t('Specific Location'),
            description: address || t('Specific location'),
          });

          setView(latitude, longitude, 15);
          updateMarkerPosition(latitude, longitude);
        } catch (err) {
          console.warn('Reverse geocoding failed:', err);
          const locObj = {
            address: '',
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
            name: t('Specific Location'),
          };
          setFullAddressData(locObj);
          setMarker({
            lat: info.coords.latitude,
            lng: info.coords.longitude,
            title: t('Specific Location'),
            description: t('Specific location'),
          });
          setView(info.coords.latitude, info.coords.longitude, 15);
          updateMarkerPosition(info.coords.latitude, info.coords.longitude);
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

  const handleMapPress = async e => {
    try {
      const {lat, lng} = e;
      console.log('Map pressed at:', {lat, lng});

      updateMarkerPosition(lat, lng);

      try {
        const {address, components} = await reverseGeocode(lat, lng);
        const extracted = extractAddressComponents(components);
        console.log('Reverse geocoding result:', {address, extracted});
        updateLocationData(extracted, address, lat, lng);
        updateLocation(lat, lng, t('Custom Location'), address);
        setFullAddressData(prev => ({
          ...(prev || {}),
          ...extracted,
          address,
          latitude: lat,
          longitude: lng,
        }));
      } catch (err) {
        console.warn('Reverse geocoding Error:', err);
        updateLocation(lat, lng, t('Custom Location'), '');
        setFullAddressData(prev => ({
          ...prev,
          address: '',
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (err) {
      console.error('Map press error:', err);
    }
  };

  const updateLocation = (latitude, longitude, name, address) => {
    setMarker({
      lat: latitude,
      lng: longitude,
      title: name || t('Selected Location'),
      description: address || t('You selected this location'),
    });
  };

  const getCountryInfo = countryNameOrCode => {
    let country = Country.getAllCountries().find(
      c =>
        c.name.toLowerCase() === countryNameOrCode.toLowerCase() ||
        c.isoCode === countryNameOrCode,
    );
    return country || null;
  };

  const getContinent = countryCode => {
    const continentMap = {
      NA: 'North America',
      US: 'North America',
      CA: 'North America',
      MX: 'North America',
      GB: 'Europe',
      FR: 'Europe',
      DE: 'Europe',
      IN: 'Asia',
      PK: 'Asia',
      AU: 'Oceania',
      NZ: 'Oceania',
    };
    return continentMap[countryCode] || 'Unknown';
  };

  const handleConfirmLocation = async () => {
    setConfirmLoading(true);
    if (!fullAddressData) {
      showAlert(t('Please select a location first'), 'error');
      setConfirmLoading(false);
      return;
    }

    if (CompanyScreen && typeof selectedLocation === 'function') {
      selectedLocation(fullAddressData);
      navigation.goBack();
      setConfirmLoading(false);
      return;
    }

    // Call onLocationUpdate callback if provided
    if (typeof onLocationUpdate === 'function') {
      onLocationUpdate(fullAddressData);
      navigation.goBack();
      setConfirmLoading(false);
      return;
    }

    try {
      const parts =
        fullAddressData.address?.split(',').map(p => p.trim()) || [];
      const countryInfo = getCountryInfo(parts[parts.length - 1] || '');
      const countryCode = countryInfo?.isoCode || '';
      const continent = getContinent(countryCode);
      const stateInfo = parts.length >= 3 ? parts[parts.length - 2] : '';
      const cityInfo = parts.length >= 4 ? parts[parts.length - 3] : '';
      const postalCode = parts.find(p => /\d{4,}/.test(p)) || '898982';

      const locationHierarchy = {
        street_address: fullAddressData.streetAddress || parts[0] || '',
        city: fullAddressData.city || cityInfo || '',
        province: fullAddressData.province || stateInfo || '',
        postal_code: fullAddressData.postalCode || postalCode,
        country:
          fullAddressData.country ||
          countryInfo?.name ||
          parts[parts.length - 1] ||
          '',
        region: stateInfo || parts[parts.length - 1] || '',
        continent,
      };

      const updatedProfileData = {
        street_address: locationHierarchy.street_address,
        address: fullAddressData.address || '',
        city: locationHierarchy.city,
        province: locationHierarchy.province,
        postal_code: locationHierarchy.postal_code,
        country: locationHierarchy.country,
        latitude: String(fullAddressData.latitude || ''),
        longitude: String(fullAddressData.longitude || ''),
        region: locationHierarchy.region || manualAddress.region || '',
        continent: locationHierarchy.continent || manualAddress.continent || '',
      };

      const updatedUser = {
        ...user,
        worker: {
          ...user.worker,
          ...updatedProfileData,
        },
      };

      dispatch(setUserData(updatedUser));

      showAlert(t('Location updated successfully!'), 'success');
      setConfirmLoading(false);
      navigation.goBack();
    } catch (error) {
      setConfirmLoading(false);
      console.error('Error confirming location:', error);
      showAlert(t('Failed to confirm location'), 'error');
    }
  };

  const updateLocationData = (extracted, address, latitude, longitude) => {
    setFullAddressData(prev => ({
      ...prev,
      ...extracted,
      address,
      latitude,
      longitude,
    }));
  };

  const updateMarkerPosition = (lat, lng) => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'updateMarker',
        data: {lat, lng},
      });
      webViewRef.current.postMessage(message);
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
          var map = L.map('mapid').setView([${marker.lat}, ${marker.lng}], 15);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
          }).addTo(map);

          document.getElementById('loading').style.display = 'none';

          var marker = L.marker([${marker.lat}, ${marker.lng}], { draggable: true }).addTo(map);
          marker.bindTooltip('${marker.title}');

          marker.on('dragend', function(e) {
            var coords = marker.getLatLng();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerDragged',
              data: { lat: coords.lat, lng: coords.lng }
            }));
          });

          map.on('click', function(e) {
            var clickData = { lat: e.latlng.lat, lng: e.latlng.lng };
            marker.setLatLng(clickData);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              data: clickData
            }));
          });

          window.addEventListener('message', function(event) {
            try {
              const message = JSON.parse(event.data);
              
              if (message.type === "setView") {
                const { lat, lng, zoom } = message.data;
                map.setView([lat, lng], zoom);
              }
              
              if (message.type === 'updateMarker') {
                marker.setLatLng([message.data.lat, message.data.lng]);
                map.setView([message.data.lat, message.data.lng], 15);
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

  const handleMessage = event => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'mapClick') {
        handleMapPress(message.data);
      } else if (message.type === 'mapReady') {
        setIsLoading(false);
      } else if (message.type === 'markerDragged') {
        handleMapPress(message.data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const setView = (lat, lng, zoom = 15) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'setView',
          data: {lat, lng, zoom},
        }),
      );
    }
  };

  const handleLocationSelect = async item => {
    const coords = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    console.log('📍 Selected Location:', {
      name: item.display_name,
      coordinates: coords,
    });

    setSearchQuery(item.display_name);
    setShowResults(false);
    setSuggestions([]);

    setView(coords.lat, coords.lng, 15);
    updateMarkerPosition(coords.lat, coords.lng);

    updateLocation(
      coords.lat,
      coords.lng,
      t('Searched Location'),
      item.display_name,
    );

    try {
      const {address, components} = await reverseGeocode(
        coords.lat,
        coords.lng,
      );

      const extracted = extractAddressComponents(components);

      updateLocationData(extracted, address, coords.lat, coords.lng);
      setFullAddressData(prev => ({
        ...(prev || {}),
        ...extracted,
        address,
        latitude: coords.lat,
        longitude: coords.lng,
      }));
    } catch (err) {
      console.warn('⚠️ Reverse geocoding Error:', err);
      setFullAddressData(prev => ({
        ...prev,
        address: item.display_name,
        latitude: coords.lat,
        longitude: coords.lng,
      }));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchedData([]);
    setShowResults(false);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerText}>{t('Choose your location')}</Text>
        <View style={styles.emptyView} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search for a location...')}
            value={searchQuery}
            onChangeText={fetchSuggestions}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            editable={!isSearching}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.searchButton,
            (isSearching || !searchQuery.trim()) && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={isSearching || !searchQuery.trim()}>
          <Text style={styles.searchButtonText}>
            {isSearching ? t('Searching...') : t('Search')}
          </Text>
        </TouchableOpacity>
      </View>

      {searchedData.length > 0 && showResults && (
        <View style={styles.suggestionsContainer}>
          {searchedData.map((item, index) => (
            <TouchableOpacity
              key={item.place_id || index}
              style={styles.suggestionItem}
              onPress={() => handleLocationSelect(item)}>
              <Text numberOfLines={1}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id || index}
              style={styles.suggestionItem}
              onPress={() => handleLocationSelect(item)}>
              <Text numberOfLines={2} style={styles.suggestionText}>
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.mapContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0969da" />
            <Text style={styles.loadingText}>{t('Loading map...')}</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{html: htmlContent}}
          style={[styles.webview, isLoading && styles.hiddenWebview]}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setIsLoading(false);
          }}
          renderError={(errorDomain, errorCode, errorDesc) => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {t('Map failed to load:')} {errorDesc}
              </Text>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={updateToSpecificLocation}>
        <MaterialIcons name="my-location" size={30} color={'#FFFFFF'} />
      </TouchableOpacity>

      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text
            style={[
              styles.modalAddress,
              {
                color: isDarkMode
                  ? Colors.darkTheme.primaryTextColor
                  : Colors.lightTheme.black,
              },
            ]}
            numberOfLines={1}>
            {fullAddressData?.address
              ? fullAddressData?.address
              : t('No address selected')}
          </Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <CustomButton
            text={t('Back')}
            onPress={() => {
              navigation.goBack();
            }}
            textStyle={styles.backBtnText}
            containerStyle={styles.backBtn}
          />
          <CustomButton
            text={t('Confirm Location')}
            onPress={handleConfirmLocation}
            textStyle={styles.SignupBtnText}
            containerStyle={styles.SignupBtn}
            loading={confirmLoading}
          />
        </View>
      </View>
    </View>
  );
};

const dynamicStyles = isDarkMode =>
  StyleSheet.create({
    backIcon: {marginTop: -5},
    header: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      alignSelf: 'center',
      textAlign: 'center',
      alignContent: 'center',
      paddingVertical: 10,
      paddingLeft: 20,
    },
    headerText: {
      fontSize: RFPercentage(2.1),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
      fontFamily: Fonts.PoppinsSemiBold,
      textAlign: 'center',
      flex: 1,
    },
    manualText: {
      fontSize: Platform.OS === 'ios' ? RFPercentage(1.7) : RFPercentage(1.9),
      fontFamily: Fonts.PoppinsSemiBold,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
    },
    manualTextContainer: {
      width: '100%',
      height: hp(5),
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: wp(5),
    },
    emptyView: {
      width: 40,
    },
    container: {
      flex: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e1e5e9',
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
      marginRight: 12,
      fontSize: 16,
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
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
      color: isDarkMode ? '#ccc' : '#656d76',
      fontSize: 14,
      fontWeight: 'bold',
    },
    searchButton: {
      backgroundColor: isDarkMode
        ? Colors.darkTheme.primaryBtn.BtnColor
        : Colors.lightTheme.primaryBtn.BtnColor,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      minWidth: 80,
    },
    searchButtonDisabled: {
      backgroundColor: isDarkMode ? '#555' : '#8c959f',
    },
    searchButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 16,
    },
    searchResultsContainer: {
      backgroundColor: isDarkMode ? '#222' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e1e5e9',
      maxHeight: 300,
      zIndex: 1000,
    },
    searchResultsList: {
      flex: 1,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDarkMode ? '#222' : '#ffffff',
    },
    locationIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#333' : '#f6f8fa',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationIcon: {
      fontSize: 16,
    },
    locationTextContainer: {
      flex: 1,
      paddingRight: 8,
    },
    mainLocationText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.black,
      marginBottom: 2,
    },
    subLocationText: {
      fontSize: 13,
      color: isDarkMode ? '#ccc' : '#656d76',
      lineHeight: 18,
    },
    separator: {
      height: 1,
      backgroundColor: isDarkMode ? '#333' : '#f1f3f4',
      marginLeft: 68,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    webview: {
      flex: 1,
    },
    hiddenWebview: {
      opacity: 0,
      height: 1,
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
    errorContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#000' : '#f8f9fa',
      zIndex: 10,
      padding: 20,
    },
    errorText: {
      color: isDarkMode ? '#fff' : '#000',
      textAlign: 'center',
      fontSize: 16,
    },
    SignupBtn: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 16,
      width: '60%',
    },
    SignupBtnText: {
      fontSize: RFPercentage(1.7),
      fontFamily: Fonts.PoppinsSemiBold,
      marginLeft: wp(2),
      fontWeight: 'bold',
    },
    backBtn: {
      backgroundColor: isDarkMode ? '#444' : '#dcdcdc',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 16,
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
    currentLocationButton: {
      position: 'absolute',
      bottom: 185,
      right: 20,
      backgroundColor: '#006EC2',
      width: 60,
      height: 60,
      borderRadius: 45,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      zIndex: 100,
    },
    modalOverlay: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderRadius: 10,
      padding: 16,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: {width: 0, height: 2},
      shadowRadius: 4,
      elevation: 10,
      zIndex: 2,
      alignSelf: 'center',
      width: '100%',
    },
    modalContainer: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#dcdcdc',
      borderRadius: 10,
      textAlign: 'left',
      padding: 10,
    },
    modalAddress: {
      fontSize: 16,
      textAlign: 'left',
    },
    suggestionsContainer: {
      position: 'absolute',
      top: 110,
      left: 10,
      right: 10,
      backgroundColor: '#fff',
      borderRadius: 8,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      zIndex: 999,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
  });

export default MapScreen;
