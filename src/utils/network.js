// // src/utils/network.js
// import NetInfo from '@react-native-community/netinfo';

// export const isConnected = async () => {
//   const state = await NetInfo.fetch();
//   return state.isConnected;
// };

// src/utils/network.js
// import DeviceInfo from 'react-native-device-info';

// export const isConnected = async () => {
//   try {
//     const isReachable = await DeviceInfo.isInternetReachable();
//     return isReachable;
//   } catch (error) {
//     console.error('Error checking network connectivity:', error);
//     return false;
//   }
// };

import NetInfo from '@react-native-community/netinfo';

export const isConnected = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected;
  } catch (error) {
    console.error('Error checking network connectivity:', error);
    return false;
  }
};
