import Geocoder from 'react-native-geocoding';
import Geolocation from '@react-native-community/geolocation';
import {GOOGLE_MAP_KEY} from '../Constants/Base_URL';
import {Store} from '../redux/Store/Store';
import {getBranding} from '../Constants/api';
import {setButtonColors} from '../redux/Slices/Theme';

const removePlusCode = address => {
  const addressParts = address.split(',');

  // Check if the first part looks like a plus code (e.g., "M32J+RM")
  const firstPart = addressParts[0].trim();

  const plusCodePattern = /^[A-Z0-9]+\+[A-Z0-9]+$/;

  // If the first part matches the plus code pattern, remove it
  if (plusCodePattern.test(firstPart)) {
    addressParts.shift(); // Remove the first part
  }

  // Join the remaining parts back into a single address string
  return addressParts.join(',').trim();
};

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const json = await Geocoder.from(lat, lng);
    const address =
      json?.results?.[0]?.formatted_address ?? 'Address not found';

    const addressComponent = json?.results?.[0].address_components;

    return {addressComponent, address};
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Address not found';
  }
};

export const extractEnglishWords = text => {
  let words = text?.match(/[A-Za-z]+/g) || [];
  return words.join(' ');
};

export const extractLocationHierarchy = addressComponents => {
  const locationData = {
    country: '',
    countryCode: '',
    state: '',
    stateCode: '',
    city: '',
    locality: '',
    sublocality: '',
    postalCode: '',
    region: '',
    continent: '',
  };

  if (!addressComponents) return locationData;

  addressComponents.forEach(component => {
    const types = component.types;

    // Country
    if (types.includes('country')) {
      locationData.country = component.long_name;
      locationData.countryCode = component.short_name;
    }

    // State/Province
    if (types.includes('administrative_area_level_1')) {
      locationData.state = component.long_name;
      locationData.stateCode = component.short_name;
    }

    // City/Town
    if (types.includes('locality')) {
      locationData.city = component.long_name;
    }

    // Alternative city (administrative_area_level_2)
    if (types.includes('administrative_area_level_2') && !locationData.city) {
      locationData.city = component.long_name;
    }

    // Sublocality (neighborhood, district)
    if (
      types.includes('sublocality') ||
      types.includes('sublocality_level_1')
    ) {
      locationData.sublocality = component.long_name;
    }

    // Postal Code
    if (types.includes('postal_code')) {
      locationData.postalCode = component.long_name;
    }
  });

  // Determine continent/region based on country
  locationData.continent = getContinent(locationData.countryCode);
  locationData.region = locationData.continent; // Alias for region

  return locationData;
};

export const getContinent = countryCode => {
  const continentMap = {
    // North America
    US: 'North America',
    CA: 'North America',
    MX: 'North America',
    GT: 'North America',
    BZ: 'North America',
    SV: 'North America',
    HN: 'North America',
    NI: 'North America',
    CR: 'North America',
    PA: 'North America',
    CU: 'North America',
    JM: 'North America',
    HT: 'North America',
    DO: 'North America',

    // South America
    BR: 'South America',
    AR: 'South America',
    PE: 'South America',
    CO: 'South America',
    VE: 'South America',
    CL: 'South America',
    EC: 'South America',
    BO: 'South America',
    PY: 'South America',
    UY: 'South America',
    GY: 'South America',
    SR: 'South America',

    // Europe
    GB: 'Europe',
    FR: 'Europe',
    DE: 'Europe',
    IT: 'Europe',
    ES: 'Europe',
    NL: 'Europe',
    BE: 'Europe',
    AT: 'Europe',
    CH: 'Europe',
    SE: 'Europe',
    NO: 'Europe',
    DK: 'Europe',
    FI: 'Europe',
    PL: 'Europe',
    CZ: 'Europe',
    HU: 'Europe',
    RO: 'Europe',
    BG: 'Europe',
    GR: 'Europe',
    PT: 'Europe',
    IE: 'Europe',
    HR: 'Europe',
    SI: 'Europe',
    SK: 'Europe',

    // Asia
    CN: 'Asia',
    IN: 'Asia',
    JP: 'Asia',
    KR: 'Asia',
    TH: 'Asia',
    VN: 'Asia',
    PH: 'Asia',
    MY: 'Asia',
    SG: 'Asia',
    ID: 'Asia',
    TW: 'Asia',
    HK: 'Asia',
    MO: 'Asia',
    KH: 'Asia',
    LA: 'Asia',
    MM: 'Asia',
    BD: 'Asia',
    LK: 'Asia',
    NP: 'Asia',
    BT: 'Asia',
    MN: 'Asia',
    KZ: 'Asia',
    UZ: 'Asia',
    TJ: 'Asia',
    KG: 'Asia',
    TM: 'Asia',
    AF: 'Asia',
    PK: 'Asia',
    IR: 'Asia',
    IQ: 'Asia',
    SY: 'Asia',
    LB: 'Asia',
    JO: 'Asia',
    IL: 'Asia',
    PS: 'Asia',
    SA: 'Asia',
    AE: 'Asia',
    QA: 'Asia',
    BH: 'Asia',
    KW: 'Asia',
    OM: 'Asia',
    YE: 'Asia',
    TR: 'Asia',
    GE: 'Asia',
    AM: 'Asia',
    AZ: 'Asia',

    // Africa
    EG: 'Africa',
    LY: 'Africa',
    SD: 'Africa',
    DZ: 'Africa',
    MA: 'Africa',
    TN: 'Africa',
    ET: 'Africa',
    KE: 'Africa',
    UG: 'Africa',
    TZ: 'Africa',
    RW: 'Africa',
    BI: 'Africa',
    SO: 'Africa',
    DJ: 'Africa',
    ER: 'Africa',
    SS: 'Africa',
    CF: 'Africa',
    TD: 'Africa',
    NE: 'Africa',
    NG: 'Africa',
    CM: 'Africa',
    GQ: 'Africa',
    GA: 'Africa',
    CG: 'Africa',
    CD: 'Africa',
    AO: 'Africa',
    ZM: 'Africa',
    ZW: 'Africa',
    BW: 'Africa',
    NA: 'Africa',
    ZA: 'Africa',
    LS: 'Africa',
    SZ: 'Africa',
    MZ: 'Africa',
    MG: 'Africa',
    MU: 'Africa',
    MW: 'Africa',
    SC: 'Africa',
    KM: 'Africa',

    // Oceania
    AU: 'Oceania',
    NZ: 'Oceania',
    FJ: 'Oceania',
    PG: 'Oceania',
    SB: 'Oceania',
    NC: 'Oceania',
    PF: 'Oceania',
    WS: 'Oceania',
    VU: 'Oceania',
    TO: 'Oceania',
    KI: 'Oceania',
    NR: 'Oceania',
    PW: 'Oceania',
    MH: 'Oceania',
    FM: 'Oceania',
    TV: 'Oceania',
  };

  return continentMap[countryCode] || 'Unknown';
};

export const getAddressFromLatLng = (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('latitude, longitude', latitude, longitude);
      // Initialize the module (needs to be done only once)
      if (Geocoder.isInit == false) {
        Geocoder.init(GOOGLE_MAP_KEY); // use a valid API key
      }

      Geocoder.from(latitude?.toFixed(4), longitude?.toFixed(4))
        .then(async json => {
          // console.log('region : ', json.results[0].formatted_address);
          // Use the geocoding package to get the address details
          const response = await Geocoder.from(latitude, longitude);
          const addressComponent = response.results[0].address_components;

          // Extract state/region from the address components
          let state = '';
          let region = '';
          for (const component of addressComponent) {
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
              region = component.short_name;
            }
          }

          console.log({state, region});

          resolve(json.results[0].formatted_address);
        })
        .catch(error => {
          console.log('error  getAddressFromLatLng :  ', error);
          resolve('');
        });
    } catch (error) {
      resolve('');
    }
  });
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    try {
      Geolocation.getCurrentPosition(info => {
        let latitude = info.coords.latitude;
        let longitude = info.coords.longitude;
        console.log(longitude, latitude, 'long lati');

        //getting address
        // Initialize the module (needs to be done only once)
        if (Geocoder.isInit == false) {
          Geocoder.init(GOOGLE_MAP_KEY, {language: 'en'}); // do this once in App.js
        }
        // Search by geo-location (reverse geo-code)
        Geocoder.from(latitude, longitude)
          .then(json => {
            let fullAddress = json.results[0].formatted_address;
            // console.log(json.results[0].address_components, 'adres');

            // Remove the plus code (e.g., "M32J+RM") if present
            let filteredAddress = removePlusCode(fullAddress);
            // console.log(filteredAddress, 'filtered address');
            let shortAdress = json.results[2].formatted_address;
            let shortAddress = removePlusCode(shortAdress);

            let obj = {
              latitude: latitude,
              longitude: longitude,
              address: filteredAddress,
              shortAdress: shortAddress,
            };

            resolve(obj);
          })
          .catch(error => {
            console.log('error  :  ', JSON.stringify(error,null,3));
            let obj = {
              latitude: 0.0,
              longitude: 0.0,
              address: '',
            };
            resolve(obj);
          });
      });
    } catch (error) {
      console.log('error  :  ', JSON.stringify(error,null,3));
      let obj = {
        latitude: 0.0,
        longitude: 0.0,
        address: '',
      };
      resolve(obj);
    }
  });
};

export const fetchButtonColors = async () => {
  try {
    const state = Store.getState();
    const token = state.auth.user?.token;
    const company_id = state.auth.user?.worker?.company_id;

    if (!token || !company_id) {
      console.log('No token found');
      return;
    }

    const response = await getBranding({company_id, token});

    if (!response?.error && response?.data) {
      Store.dispatch(setButtonColors(response.data));
    }
  } catch (error) {
    console.log('API error:', error);
  }
};
