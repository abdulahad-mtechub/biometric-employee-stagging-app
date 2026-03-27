
import { PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { GOOGLE_MAP_KEY } from '../Constants/Base_URL';


// Function to request location permission
export const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // console.log('Location permission granted');
      return true;
    } else {
      console.log('Location permission denied');
      Alert.alert('Permission Denied', 'Please enable location permission from settings.');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

// Function to get the current location and fetch the address
export const getCurrentLocation = async (setLocation, setAddress) => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return;

  Geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      // console.log('Latitude:', latitude);
      // console.log('Longitude:', longitude);
      setLocation(position.coords);
      await fetchAddressFromCoordinates(latitude, longitude, setAddress);
    },
    (error) => {
      console.log('Error getting location:', error.message);
      Alert.alert('Error', error.message);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
};

// Function to fetch address from latitude & longitude using Google Maps API
const fetchAddressFromCoordinates = async (latitude, longitude, setAddress) => {
  const API_KEY = GOOGLE_MAP_KEY; // 🔴 Replace with your Google Maps API key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      const formattedAddress = data.results[0]?.formatted_address || 'Address not found';
      setAddress(formattedAddress);
      // console.log('Address:', formattedAddress);
    } else {
      console.log('Error fetching address:', data.status);
      setAddress('Unable to fetch address');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    setAddress('Error fetching address');
  }
};

export const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app requires camera access to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS does not require explicit permission request
  };