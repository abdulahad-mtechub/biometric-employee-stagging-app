/**
 * useNetworkStatus.js
 *
 * Custom hook to monitor network connectivity status
 * Provides real-time updates on connection state
 */

import {useEffect, useState, useCallback} from 'react';
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, fair, poor

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 Network status:', {
        connected: state.isConnected,
        reachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
      });

      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setConnectionType(state.type);

      // Determine connection quality based on type and speed
      if (!state.isConnected || !state.isInternetReachable) {
        setConnectionQuality('offline');
      } else if (state.type === 'wifi') {
        setConnectionQuality('good');
      } else if (state.type === 'cellular') {
        const cellularGeneration = state.details?.cellularGeneration;
        if (cellularGeneration === '4g' || cellularGeneration === '5g') {
          setConnectionQuality('good');
        } else if (cellularGeneration === '3g') {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }
      } else {
        setConnectionQuality('fair');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Manually check current network status
   */
  const checkConnection = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setConnectionType(state.type);

      console.log('🔍 Manual network check:', {
        connected: state.isConnected,
        reachable: state.isInternetReachable,
        type: state.type,
      });

      return {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      };
    } catch (error) {
      console.error('❌ Error checking network status:', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
      };
    }
  }, []);

  // Overall status - truly online means both connected and internet reachable
  const isOnline = isConnected && isInternetReachable;

  return {
    isConnected,
    isInternetReachable,
    isOnline,
    connectionType,
    connectionQuality,
    checkConnection,
  };
};

export default useNetworkStatus;
