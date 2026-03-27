/**
 * useOfflineProfile.js
 *
 * Custom hook to handle offline profile updates
 * Manages saving profile locally and auto-syncing when online
 */

import {useEffect, useCallback, useState, useRef} from 'react';
import {useDispatch} from 'react-redux';
import useNetworkStatus from './useNetworkStatus';
import offlineProfileQueue from '../services/OfflineProfileQueue';
import profileSyncService from '../services/ProfileSyncService';
import {setUserData} from '../redux/Slices/authSlice';

const useOfflineProfile = (token, userId, currentUser) => {
  const {isOnline} = useNetworkStatus();
  const dispatch = useDispatch();
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, failed
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const wasOfflineRef = useRef(false);
  const syncScheduledRef = useRef(false);
  const currentUserRef = useRef(currentUser);

  // Keep currentUser ref updated
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  /**
   * Initialize and check for pending updates
   */
  useEffect(() => {
    const initQueue = async () => {
      await offlineProfileQueue.initialize();

      // Check if there's a pending update for this user
      const pending = await offlineProfileQueue.getUserProfileUpdate(userId);
      if (pending) {
        setPendingUpdate(pending);
        setSyncStatus(pending.status);
      }
    };

    if (userId) {
      initQueue();
    }
  }, [userId]);

  useEffect(() => {
    const handleConnectionChange = async () => {
      console.log('🔍 Network status changed:', {
        isOnline,
        wasOffline: wasOfflineRef.current,
        shouldSync: isOnline && wasOfflineRef.current,
      });

      if (isOnline && wasOfflineRef.current) {
        console.log(
          '🌐 Connection restored, checking for pending profile updates...',
        );

        const pending = await offlineProfileQueue.getPendingUpdates();
        console.log(`📊 Found ${pending.length} pending profile updates`);
        if (pending.length > 0) {
          console.log('📋 Pending updates:', pending);
        }

        if (pending.length > 0 && !syncScheduledRef.current) {
          syncScheduledRef.current = true;
          console.log('🔄 Scheduling profile sync with token:', !!token);

          profileSyncService.scheduleSync(token, 2000);
          setTimeout(() => {
            syncScheduledRef.current = false;
          }, 5000);
        } else if (pending.length > 0 && syncScheduledRef.current) {
          console.log('⏭️ Sync already scheduled, skipping...');
        }
      }

      wasOfflineRef.current = !isOnline;
    };

    handleConnectionChange();
  }, [isOnline, token]);

  /**
   * Save profile update (online or offline)
   * @param {Object} profileData - Profile data to save
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @param {Object} localImage - Optional local image object with path
   */
  const saveProfile = useCallback(
    async (profileData, onSuccess, onError, localImage = null) => {
      try {
        console.log('🔍 saveProfile called with:', {
          hasProfileData: !!profileData,
          hasLocalImage: !!localImage,
          localImageType: typeof localImage,
          localImagePath: localImage?.path,
          isOnline,
        });

        if (isOnline) {
          // Online - try to save directly
          console.log('📤 Saving profile online...');
          setSyncStatus('syncing');

          const {editProfile} = require('../Constants/api');
          console.log(
            '📤 Calling editProfile API (online mode) with data:',
            profileData,
          );
          const response = await editProfile(profileData, token);
          console.log('📥 editProfile API response (online mode):', response);

          if (response?.error === false) {
            // Success - update Redux state with server response
            console.log(
              '✅ Server responded successfully, updating Redux state',
            );
            const updatedProfile = {
              ...response.data.profile,
              middle_name: profileData.middle_name,
            };
            const updatedUser = {
              ...currentUser,
              worker: {
                ...currentUser.worker,
                ...updatedProfile,
              },
            };

            console.log(
              '🔄 Dispatching updated user to Redux:',
              updatedUser.worker,
            );
            dispatch(setUserData(updatedUser));
            setSyncStatus('synced');

            // Remove from queue if it was queued
            await offlineProfileQueue.removeProfileUpdate(userId);

            if (onSuccess) {
              onSuccess(response);
            }

            console.log(
              '✅ Profile saved successfully online and Redux updated',
            );
            return {success: true, online: true, data: response.data};
          } else {
            console.error('❌ Server returned error:', response);
            throw new Error(response?.message || 'Failed to save profile');
          }
        } else {
          // Offline - queue the update
          console.log('📴 Offline, queueing profile update...');
          if (localImage) {
            console.log(
              '📷 Queueing with local image for later upload:',
              localImage.path,
            );
          }
          await offlineProfileQueue.addProfileUpdate(
            profileData,
            userId,
            localImage,
          );

          // Update local Redux state optimistically
          // For image, use local path if available for immediate UI update
          const displayImage = localImage?.path || profileData.profile_image;

          const updatedUser = {
            ...currentUser,
            worker: {
              ...currentUser.worker,
              first_name: profileData.first_name,
              middle_name: profileData.middle_name,
              last_name: profileData.last_name,
              address: profileData.address,
              city: profileData.city,
              province: profileData.province,
              postal_code: profileData.postal_code,
              country: profileData.country,
              street_address: profileData.street_address,
              profile_image: displayImage,
              region: profileData.region,
              phone: profileData.phone,
            },
          };

          dispatch(setUserData(updatedUser));
          setSyncStatus('pending');
          setPendingUpdate(
            await offlineProfileQueue.getUserProfileUpdate(userId),
          );

          if (onSuccess) {
            onSuccess({
              error: false,
              message: 'Profile saved offline and will sync when online',
              offline: true,
            });
          }

          console.log('✅ Profile saved offline');
          return {success: true, offline: true, queued: true};
        }
      } catch (error) {
        console.error('❌ Error saving profile:', error);
        setSyncStatus('failed');

        // If online and failed, try to queue it
        if (isOnline) {
          console.log('📴 Online save failed, queueing for retry...');
          await offlineProfileQueue.addProfileUpdate(
            profileData,
            userId,
            localImage,
          );
          setPendingUpdate(
            await offlineProfileQueue.getUserProfileUpdate(userId),
          );
        }

        if (onError) {
          onError(error);
        }

        return {success: false, error: error.message};
      }
    },
    [isOnline, token, userId, currentUser, dispatch],
  );

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async () => {
    if (isOnline && token) {
      await profileSyncService.syncProfiles(token);
    }
  }, [isOnline, token]);

  /**
   * Get pending update status
   */
  const getPendingUpdate = useCallback(async () => {
    const pending = await offlineProfileQueue.getUserProfileUpdate(userId);
    setPendingUpdate(pending);
    return pending;
  }, [userId]);

  /**
   * Register callback for sync status updates
   */
  useEffect(() => {
    if (userId) {
      profileSyncService.registerCallback(userId, async (status, data) => {
        console.log(
          `🔔 Profile sync callback - Status: ${status}, User: ${userId}`,
        );
        setSyncStatus(status);

        if (status === 'synced' && data) {
          console.log(
            '✅ Profile synced callback - Updating Redux with:',
            data,
          );

          // Get the latest pending update to access profileData
          const latestPendingUpdate =
            await offlineProfileQueue.getUserProfileUpdate(userId);

          // Update Redux state with synced data from server
          const updatedProfile = {
            ...data.profile,
            middle_name:
              latestPendingUpdate?.profileData?.middle_name ||
              data.profile?.middle_name,
          };

          // Use ref to get latest user data
          const latestUser = currentUserRef.current;
          const updatedUser = {
            ...latestUser,
            worker: {
              ...latestUser.worker,
              ...updatedProfile,
            },
          };

          console.log(
            '🔄 Dispatching updated user data to Redux:',
            updatedUser.worker,
          );
          dispatch(setUserData(updatedUser));
          setPendingUpdate(null);
          console.log('✅ Redux state updated with synced profile data');
        } else if (status === 'pending' || status === 'failed') {
          // Refresh pending update
          console.log(
            `🔄 Status changed to ${status}, refreshing pending update`,
          );
          getPendingUpdate();
        }
      });

      return () => {
        profileSyncService.unregisterCallback(userId);
      };
    }
  }, [userId, currentUser, dispatch, getPendingUpdate, pendingUpdate]);

  return {
    saveProfile,
    triggerSync,
    getPendingUpdate,
    syncStatus,
    pendingUpdate,
    isOnline,
  };
};

export default useOfflineProfile;
