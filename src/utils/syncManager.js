// export const syncPendingActions = async () => {
//   const pending = await getPendingActions('postFormDataRequest');

import {postFormDataRequest} from '../Constants/api';
import {rebuildFormData} from './Helpers';
import {getPendingActions, removePendingAction} from './sqlite';

//   for (const action of pending) {
//     const {endpoint, formData, token} = JSON.parse(action.data);
//     const rebuiltFormData = rebuildFormData(formData);

//     try {
//       const result = await postFormDataRequest(
//         endpoint,
//         rebuiltFormData,
//         token,
//       );
//       if (result && result.error === false) {
//         console.log(`✅ Synced pending action with ID ${action.id}`);
//         await removePendingAction(action.id);
//       } else {
//         console.log(`❌ Failed to sync pending action ID ${action.id}`);
//       }
//     } catch (error) {
//       console.log(`🚨 Sync error for action ID ${action.id}:`, error);
//     }
//   }
// };

export const syncPendingActions = async () => {
  try {
    const pending = await getPendingActions('postFormDataRequest');
    // console.log('🔍 Syncing these pending actions:', pending);

    for (const action of pending) {
      const {endpoint, formData, token} = JSON.parse(action.data);
      const rebuiltFormData = rebuildFormData(formData); // rebuild for FormData

      try {
        const result = await postFormDataRequest(
          endpoint,
          rebuiltFormData,
          token,
        );
        if (result && result.error === false) {
          // console.log(`✅ Synced action ID ${action.id}`);
          await removePendingAction(action.id);
        } else {
          // console.log(`❌ Failed to sync action ID ${action.id}`);
        }
      } catch (error) {
        console.log(`🚨 Error syncing action ID ${action.id}:`, error);
      }
    }
  } catch (error) {
    console.error('🚨 syncPendingActions error:', error);
  }
};
