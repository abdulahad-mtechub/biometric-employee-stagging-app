/**
 * OfflineDocumentQueue.js
 *
 * This service handles offline document upload storage and synchronization.
 * - Saves document uploads to AsyncStorage when offline
 * - Retrieves all pending documents
 * - Syncs pending documents when online
 * - Removes successfully synced documents
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DeviceEventEmitter} from 'react-native';
import {createDocument, uploadPdf} from '../Constants/api';

// Key for storing pending documents in AsyncStorage
const PENDING_DOCUMENTS_KEY = '@pending_documents';

// Event names for sync status
export const DOCUMENT_SYNC_COMPLETED_EVENT = 'OFFLINE_DOCUMENTS_SYNCED';
export const DOCUMENT_SYNC_STARTED_EVENT = 'OFFLINE_DOCUMENTS_SYNC_STARTED';
export const DOCUMENT_SYNC_ERROR_EVENT = 'OFFLINE_DOCUMENTS_SYNC_ERROR';

/**
 * Save a document upload to offline queue
 * @param {Object} documentData - The document metadata (name, description, category)
 * @param {Object} fileData - PDF file data
 * @param {string} token - User authentication token
 * @returns {Promise<boolean>} - Success status
 */
export const saveOfflineDocument = async (documentData, fileData, token) => {
  try {
    // Get existing pending documents
    const existingDocuments = await getPendingDocuments();

    // Create a new document object with timestamp and unique ID
    const newDocument = {
      id: Date.now().toString(), // Unique ID based on timestamp
      documentData: documentData, // {name, description, category}
      fileData: fileData, // PDF file object
      token: token,
      timestamp: new Date().toISOString(),
    };

    // Add to array
    const updatedDocuments = [...existingDocuments, newDocument];

    // Save back to AsyncStorage
    await AsyncStorage.setItem(
      PENDING_DOCUMENTS_KEY,
      JSON.stringify(updatedDocuments),
    );

    console.log('✅ Document saved to offline queue:', newDocument.id);
    return true;
  } catch (error) {
    console.error('❌ Error saving document to offline queue:', error);
    return false;
  }
};

/**
 * Get all pending documents from AsyncStorage
 * @returns {Promise<Array>} - Array of pending documents
 */
export const getPendingDocuments = async () => {
  try {
    const documentsJson = await AsyncStorage.getItem(PENDING_DOCUMENTS_KEY);
    if (!documentsJson) {
      return [];
    }
    return JSON.parse(documentsJson);
  } catch (error) {
    console.error('❌ Error retrieving pending documents:', error);
    return [];
  }
};

/**
 * Get count of pending documents
 * @returns {Promise<number>} - Count of pending documents
 */
export const getPendingDocumentsCount = async () => {
  const documents = await getPendingDocuments();
  return documents.length;
};

/**
 * Sync all pending documents with the server
 * This function uploads the PDF first, then creates the document record
 * @returns {Promise<Object>} - Sync results {success: number, failed: number}
 */
export const syncPendingDocuments = async () => {
  try {
    const pendingDocuments = await getPendingDocuments();

    if (pendingDocuments.length === 0) {
      console.log('ℹ️ No pending documents to sync');
      return {success: 0, failed: 0};
    }

    console.log(`📤 Syncing ${pendingDocuments.length} pending document(s)...`);

    // Emit sync started event
    DeviceEventEmitter.emit(DOCUMENT_SYNC_STARTED_EVENT, {
      count: pendingDocuments.length,
    });

    let successCount = 0;
    let failedCount = 0;
    const failedDocuments = [];

    // Process each document
    for (const document of pendingDocuments) {
      try {
        console.log(`📤 Syncing document ${document.id}...`);

        // Step 1: Upload PDF file
        const uploadResponse = await uploadPdf(
          document.fileData,
          document.token,
        );

        if (
          !uploadResponse ||
          !uploadResponse.data ||
          !uploadResponse.data.url
        ) {
          console.error(
            `❌ Failed to upload PDF for document ${document.id}`,
            uploadResponse,
          );
          failedCount++;
          failedDocuments.push(document);
          continue;
        }

        // Step 2: Create document record with uploaded file URL
        const payload = {
          name: document.documentData.name,
          description: document.documentData.description,
          file_id: uploadResponse.data.url,
          file_type: 'pdf',
          category: document.documentData.category,
        };

        const createResponse = await createDocument(payload, document.token);

        if (createResponse && createResponse.error === false) {
          console.log(`✅ Document ${document.id} synced successfully`);
          successCount++;
          // Remove successfully synced document
          await removeDocument(document.id);
        } else {
          console.error(
            `❌ Failed to create document ${document.id}:`,
            createResponse,
          );
          failedCount++;
          failedDocuments.push(document);
        }
      } catch (error) {
        console.error(`❌ Error syncing document ${document.id}:`, error);
        failedCount++;
        failedDocuments.push(document);
      }
    }

    // Save failed documents back (keep them for retry)
    if (failedDocuments.length > 0) {
      await AsyncStorage.setItem(
        PENDING_DOCUMENTS_KEY,
        JSON.stringify(failedDocuments),
      );
    }

    // Emit appropriate event based on results
    if (successCount > 0 && failedCount === 0) {
      DeviceEventEmitter.emit(DOCUMENT_SYNC_COMPLETED_EVENT, {
        success: successCount,
        failed: failedCount,
      });
      console.log(`✅ All ${successCount} document(s) synced successfully`);
    } else if (successCount > 0 && failedCount > 0) {
      DeviceEventEmitter.emit(DOCUMENT_SYNC_COMPLETED_EVENT, {
        success: successCount,
        failed: failedCount,
        partial: true,
      });
      console.log(
        `⚠️ Partial sync: ${successCount} succeeded, ${failedCount} failed`,
      );
    } else if (failedCount > 0) {
      DeviceEventEmitter.emit(DOCUMENT_SYNC_ERROR_EVENT, {
        success: successCount,
        failed: failedCount,
      });
      console.error(`❌ All ${failedCount} document(s) failed to sync`);
    }

    return {success: successCount, failed: failedCount};
  } catch (error) {
    console.error('❌ Error in syncPendingDocuments:', error);
    DeviceEventEmitter.emit(DOCUMENT_SYNC_ERROR_EVENT, {error: error.message});
    return {success: 0, failed: 0};
  }
};

/**
 * Remove a specific document from the queue
 * @param {string} documentId - The ID of the document to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeDocument = async documentId => {
  try {
    const documents = await getPendingDocuments();
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    await AsyncStorage.setItem(
      PENDING_DOCUMENTS_KEY,
      JSON.stringify(updatedDocuments),
    );
    console.log(`🗑️ Document ${documentId} removed from queue`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing document ${documentId}:`, error);
    return false;
  }
};

/**
 * Clear all pending documents (use with caution)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllPendingDocuments = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_DOCUMENTS_KEY);
    console.log('🗑️ All pending documents cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing pending documents:', error);
    return false;
  }
};
