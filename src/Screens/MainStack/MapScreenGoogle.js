import {Country} from 'country-state-city';
import {useCallback, useEffect, useRef, useState} from 'react';
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
import MapView, {Marker} from 'react-native-maps';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {widthPercentageToDP as wp} from 'react-native-responsive-screen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import CustomButton from '../../components/Buttons/customButton';
import {GOOGLE_MAP_KEY} from '../../Constants/Base_URL';
import {Fonts} from '../../Constants/Fonts';
import {Colors} from '../../Constants/themeColors';
import {useAlert} from '../../Providers/AlertContext';
import {setUserData} from '../../redux/Slices/authSlice';
import {getCurrentLocation} from '../../utils/LocationHelpers';

const extractAddressComponents = (components = {}) => {
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

const MapScreenGoogle = ({route, navigation}) => {
  // Keep CompanyScreen in params, but remove any function callbacks (non-serializable)
  const CompanyScreen = route?.params?.CompanyScreen;
  const routeParams = route?.params || {};

  // Refs to hold callback functions passed via navigation params so we don't
  // keep non-serializable values in the navigation state (avoids RN warning).
  const selectedLocationRef = useRef(null);
  const onLocationUpdateRef = useRef(null);

  useEffect(() => {
    try {
      const params = routeParams || {};
      const newParams = {};
      let shouldUpdate = false;

      if (typeof params.onLocationUpdate === 'function') {
        onLocationUpdateRef.current = params.onLocationUpdate;
        // set to null so the navigation state no longer contains a function
        newParams.onLocationUpdate = null;
        shouldUpdate = true;
      }

      if (typeof params.selectedLocation === 'function') {
        selectedLocationRef.current = params.selectedLocation;
        // set to null so the navigation state no longer contains a function
        newParams.selectedLocation = null;
        shouldUpdate = true;
      }

      if (
        shouldUpdate &&
        navigation &&
        typeof navigation.setParams === 'function'
      ) {
        navigation.setParams(newParams);
      }
    } catch (err) {
      console.warn('Failed to extract callbacks from navigation params', err);
    }
    // We only want to run this on mount / when route.params object reference changes
  }, [route?.params]);
  const {user, profile} = useSelector(state => state.auth);
  const {isDarkMode} = useSelector(store => store.theme);
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {showAlert} = useAlert();

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

  const initialLat = route?.params?.selectedLocation?.latitude || 40.7128;
  const initialLng = route?.params?.selectedLocation?.longitude || -74.006;

  const [marker, setMarker] = useState({
    latitude: initialLat,
    longitude: initialLng,
    title: t('Selected Location'),
    description: t('You selected this location'),
  });

  const mapRef = useRef(null);
  const lastRequestTime = useRef(0);
  const debounceTimeoutRef = useRef(null);
  const MIN_REQUEST_INTERVAL = 1000;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedData, setSearchedData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    const init = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        setHasLocationPermission(true);
        await getCurrentPosition();
      } else {
        setIsLoading(false);
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
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          showAlert(
            t('Location permission denied. Please enable it in app settings.'),
            'error',
          );
          return false;
        }
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
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
      }
      return true;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

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
            ...(GOOGLE_MAP_KEY ? {'X-Goog-Api-Key': GOOGLE_MAP_KEY} : {}),
          },
        },
      );

      if (response.status === 403) {
        throw new Error('API rate limit exceeded');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      return {
        address: data.display_name || '',
        components: data.address || {},
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {address: '', components: {}};
    }
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
          !locationData ||
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
          latitude,
          longitude,
          title: t('Current Location'),
          description: formattedAddress || address || t('Current location'),
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
            400,
          );
        }
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
          latitude,
          longitude,
          title: t('Current Location'),
          description: address || t('Current location'),
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
            400,
          );
        }
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

      // Ensure we have permission first. If not, request it.
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsLoading(false);
          return;
        }
        setHasLocationPermission(true);
      }

      let latitude = null;
      let longitude = null;
      let addressFromHelper = '';

      // Prefer the existing helper which may include platform-specific fixes.
      try {
        const loc = await getCurrentLocation();
        if (loc && loc.latitude != null && loc.longitude != null) {
          latitude = loc.latitude;
          longitude = loc.longitude;
          addressFromHelper = loc.address || loc.shortAddress || '';
        } else {
          throw new Error('getCurrentLocation returned invalid coordinates');
        }
      } catch (primaryErr) {
        // Fallback to navigator.geolocation if helper fails (older devices / permissions issues)
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (fallbackErr) {
          // surface both errors to aid debugging
          console.warn('Primary location helper error:', primaryErr);
          console.warn('Fallback geolocation error:', fallbackErr);
          throw new Error(
            fallbackErr?.message ||
              primaryErr?.message ||
              'Unable to get current location',
          );
        }
      }

      // If we have coordinates, attempt reverse geocoding (best-effort)
      try {
        const {address, components} = await reverseGeocode(latitude, longitude);
        const extracted = extractAddressComponents(components);
        const locObj = {
          ...extracted,
          address: address || addressFromHelper || '',
          latitude,
          longitude,
          name: t('Specific Location'),
        };
        setFullAddressData(locObj);
        setMarker({
          latitude,
          longitude,
          title: t('Specific Location'),
          description: address || addressFromHelper || t('Specific location'),
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
            400,
          );
        }
      } catch (revErr) {
        console.warn('Reverse geocoding failed:', revErr);
        const locObj = {
          address: addressFromHelper || '',
          latitude,
          longitude,
          name: t('Specific Location'),
        };
        setFullAddressData(locObj);
        setMarker({
          latitude,
          longitude,
          title: t('Specific Location'),
          description: addressFromHelper || t('Specific location'),
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
            400,
          );
        }
      }
    } catch (err) {
      console.warn('Failed to update to specific location:', err);
      // Provide slightly more detail to the user to help debugging (if available)
      const extra = err && err.message ? ` (${err.message})` : '';
      showAlert(
        `${t(
          'Failed to update to specific location. Please try again.',
        )}${extra}`,
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  }, [t, hasLocationPermission]);

  const handleMapPress = async evt => {
    try {
      const {latitude, longitude} = evt.nativeEvent.coordinate;
      setMarker(prev => ({...prev, latitude, longitude}));
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
          300,
        );
      }

      try {
        const {address, components} = await reverseGeocode(latitude, longitude);
        const extracted = extractAddressComponents(components);
        updateLocationData(extracted, address, latitude, longitude);
        updateLocation(latitude, longitude, t('Custom Location'), address);
        setFullAddressData(prev => ({
          ...(prev || {}),
          ...extracted,
          address,
          latitude,
          longitude,
        }));
      } catch (err) {
        console.warn('Reverse geocoding Error:', err);
        updateLocation(latitude, longitude, t('Custom Location'), '');
        setFullAddressData(prev => ({
          ...prev,
          address: '',
          latitude,
          longitude,
        }));
      }
    } catch (err) {
      console.error('Map press error:', err);
    }
  };

  const updateLocation = (latitude, longitude, name, address) => {
    setMarker({
      latitude,
      longitude,
      title: name || t('Selected Location'),
      description: address || t('You selected this location'),
    });
  };

  const getCountryInfo = countryNameOrCode => {
    let country = Country.getAllCountries().find(
      c =>
        c.name.toLowerCase() === (countryNameOrCode || '').toLowerCase() ||
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

    // If callbacks were passed via params they were moved to refs to avoid
    // storing functions in navigation state. Call them from refs if present.
    if (CompanyScreen && typeof selectedLocationRef.current === 'function') {
      try {
        selectedLocationRef.current(fullAddressData);
      } catch (err) {
        console.warn('selectedLocation callback failed', err);
      }
      navigation.goBack();
      setConfirmLoading(false);
      return;
    }

    if (typeof onLocationUpdateRef.current === 'function') {
      try {
        onLocationUpdateRef.current(fullAddressData);
      } catch (err) {
        console.warn('onLocationUpdate callback failed', err);
      }
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

  const handleMarkerDragEnd = async evt => {
    const {latitude, longitude} = evt.nativeEvent.coordinate;
    setMarker(prev => ({...prev, latitude, longitude}));
    try {
      const {address, components} = await reverseGeocode(latitude, longitude);
      const extracted = extractAddressComponents(components);
      updateLocationData(extracted, address, latitude, longitude);
    } catch (err) {
      console.warn('Reverse geocode on drag failed', err);
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
            ...(GOOGLE_MAP_KEY ? {'X-Goog-Api-Key': GOOGLE_MAP_KEY} : {}),
          },
        },
      );

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
      setSearchedData(data);
      setShowResults(data.length > 0);

      if (data.length === 0) {
        showAlert(
          t('No locations found. Please try a different search term.'),
          'error',
        );
      } else if (data.length === 1) {
        handleLocationSelect(data[0]);
      }
    } catch (error) {
      console.error('Search error:', error);
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

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
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
              ...(GOOGLE_MAP_KEY ? {'X-Goog-Api-Key': GOOGLE_MAP_KEY} : {}),
            },
          },
        );

        if (response.status === 403) {
          setSuggestions([]);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json'))
          throw new Error('Server returned non-JSON response');
        const data = await response.json();

        const formatted = data.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
        setSuggestions(formatted);
      } catch (error) {
        console.error('Suggestions fetch error:', error);
        setSuggestions([]);
      }
    }, 600);
  };

  const handleLocationSelect = async item => {
    const latitude = parseFloat(item.lat || item.latitude);
    const longitude = parseFloat(item.lon || item.longitude);

    setSearchQuery(item.display_name);
    setShowResults(false);
    setSuggestions([]);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01},
        400,
      );
    }

    updateLocation(
      latitude,
      longitude,
      t('Searched Location'),
      item.display_name,
    );

    try {
      const {address, components} = await reverseGeocode(latitude, longitude);
      const extracted = extractAddressComponents(components);
      updateLocationData(extracted, address, latitude, longitude);
      setFullAddressData(prev => ({
        ...(prev || {}),
        ...extracted,
        address,
        latitude,
        longitude,
      }));
    } catch (err) {
      console.warn('Reverse geocoding Error:', err);
      setFullAddressData(prev => ({
        ...(prev || {}),
        address: item.display_name,
        latitude,
        longitude,
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

        <MapView
          ref={mapRef}
          /* NOTE: Do NOT force PROVIDER_GOOGLE here. Forcing the provider
             can crash the native app if the Google Maps API key is not
             configured on the native side (AndroidManifest / iOS AppDelegate).
             Let react-native-maps choose the platform provider by default
             or configure the native Google key and provider setup as needed. */
          style={styles.map}
          initialRegion={{
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}>
          <Marker
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </MapView>
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
    emptyView: {width: 40},
    container: {flex: 1},
    searchContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: isDarkMode
        ? Colors.darkTheme.backgroundColor
        : Colors.lightTheme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e1e5e9',
    },
    searchInputContainer: {flex: 1, position: 'relative'},
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
    searchButtonDisabled: {backgroundColor: isDarkMode ? '#555' : '#8c959f'},
    searchButtonText: {
      color: isDarkMode
        ? Colors.darkTheme.primaryBtn.TextColor
        : Colors.lightTheme.primaryBtn.TextColor,
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 16,
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
    suggestionText: {},
    mapContainer: {flex: 1, position: 'relative'},
    map: {flex: 1},
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
    modalAddress: {fontSize: 16, textAlign: 'left'},
  });

export default MapScreenGoogle;
