// src/redux/slices/messageCountSlice.js
import {createSlice} from '@reduxjs/toolkit';

const messageCountSlice = createSlice({
  name: 'messageCount',
  initialState: {
    totalCount: 0,
    isLoading: false,
    error: null,
    // Whether we've received authoritative counts from the server/socket
    initialized: false,
    // Total unread count across all threads
    totalUnreadCount: 0,
    // Count per thread: { threadId: count }
    threadCounts: {},
    // Last message timestamp per thread for sorting
    lastMessageTimestamps: {},
    // Separate counts for sidebar display
    superAdminCount: 0,
    companyAdminCount: 0,
  },
  reducers: {
    // Update count - can increase or decrease based on action payload
    updateCount: (state, action) => {
      const {type} = action.payload;
      if (type === 'increment') {
        state.totalCount += 1;
      } else if (type === 'decrement') {
        state.totalCount = Math.max(0, state.totalCount - 1);
      }
      state.error = null;
    },

    // Set specific count value
    setCount: (state, action) => {
      state.totalCount = action.payload;
      state.error = null;
    },

    // Reset count to 0
    resetCount: state => {
      state.totalCount = 0;
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Initialize thread count (when thread is created or loaded)
    initializeThreadCount: (state, action) => {
      const {threadId, initialCount = 0} = action.payload;

      state.threadCounts[threadId] = initialCount;
      state.lastMessageTimestamps[threadId] = new Date().toISOString();
      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      // keep sidebar total in sync with per-thread totals
      state.totalCount = state.totalUnreadCount;
    },

    // Increment count for a specific thread (when receiving a message)
    incrementThreadCount: (state, action) => {
      const {threadId, timestamp} = action.payload;

      if (!state.threadCounts[threadId]) {
        state.threadCounts[threadId] = 0;
      }

      state.threadCounts[threadId] += 1;
      state.lastMessageTimestamps[threadId] =
        timestamp || new Date().toISOString();
      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      // keep sidebar total in sync with per-thread totals
      state.totalCount = state.totalUnreadCount;

      // Debug log
      console.log('🔔 incrementThreadCount:', {
        threadId,
        newCount: state.threadCounts[threadId],
        totalUnreadCount: state.totalUnreadCount,
        totalCount: state.totalCount,
      });
    },

    // Decrement count for a specific thread (when sending a message)
    decrementThreadCount: (state, action) => {
      const {threadId, timestamp} = action.payload;

      if (state.threadCounts[threadId] && state.threadCounts[threadId] > 0) {
        state.threadCounts[threadId] -= 1;
      }

      state.lastMessageTimestamps[threadId] =
        timestamp || new Date().toISOString();
      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      // keep sidebar total in sync with per-thread totals
      state.totalCount = state.totalUnreadCount;
    },

    // Clear count for a specific thread (when thread is opened/read)
    clearThreadCount: (state, action) => {
      const {threadId} = action.payload;

      if (state.threadCounts[threadId]) {
        state.threadCounts[threadId] = 0;
      }

      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      // keep sidebar total in sync with per-thread totals
      state.totalCount = state.totalUnreadCount;

      // Debug log
      console.log('🔔 clearThreadCount:', {
        threadId,
        totalUnreadCount: state.totalUnreadCount,
        totalCount: state.totalCount,
      });
    },

    // Clear all counts (when user logs out)
    clearAllCounts: state => {
      state.totalUnreadCount = 0;
      state.threadCounts = {};
      state.lastMessageTimestamps = {};
      state.totalCount = 0;
      // Mark as not-initialized so UI won't show transient/stale badges
      state.initialized = false;
    },

    // Set count for a specific thread (when loading from server)
    setThreadCount: (state, action) => {
      const {threadId, count, timestamp} = action.payload;

      state.threadCounts[threadId] = count || 0;
      state.lastMessageTimestamps[threadId] =
        timestamp || new Date().toISOString();
      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      // keep sidebar total in sync with per-thread totals
      state.totalCount = state.totalUnreadCount;
    },

    // Update multiple thread counts (when loading threads from server)
    updateMultipleThreadCounts: (state, action) => {
      const {threadCounts} = action.payload;

      // Reset counts
      state.threadCounts = {};
      state.lastMessageTimestamps = {};

      // Set new counts
      Object.entries(threadCounts).forEach(([threadId, data]) => {
        // support value shapes: { count } or numeric count
        if (typeof data === 'object' && data !== null) {
          state.threadCounts[threadId] = data.count || 0;
          state.lastMessageTimestamps[threadId] =
            data.timestamp || new Date().toISOString();
        } else {
          state.threadCounts[threadId] = Number(data) || 0;
          state.lastMessageTimestamps[threadId] = new Date().toISOString();
        }
      });

      state.totalUnreadCount = Object.values(state.threadCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
    },

    // Set unread counts from a full payload (total + per-thread + roleBased)
    // Accepts { total, threads, roleBased }
    setUnreadCounts: (state, action) => {
      const {total = 0, threads = [], roleBased = {}} = action.payload || {};

      // Normalize threads into { [threadId]: count }
      const normalized = {};

      if (Array.isArray(threads)) {
        threads.forEach(t => {
          const id = t.threadId != null ? String(t.threadId) : null;
          if (!id) return;
          normalized[id] = Number(t.unreadCount || t.count || 0) || 0;
          state.lastMessageTimestamps[id] =
            t.timestamp || t.last_message_at || new Date().toISOString();
        });
      } else if (typeof threads === 'object' && threads !== null) {
        Object.entries(threads).forEach(([k, v]) => {
          // support v being numeric or object
          if (typeof v === 'object' && v !== null) {
            normalized[k] = Number(v.count || 0) || 0;
            state.lastMessageTimestamps[k] =
              v.timestamp || new Date().toISOString();
          } else {
            normalized[k] = Number(v) || 0;
            state.lastMessageTimestamps[k] = new Date().toISOString();
          }
        });
      }

      state.threadCounts = normalized;
      state.totalCount = Number(total) || 0;
      const calculatedUnreadCount = Object.values(state.threadCounts).reduce(
        (s, c) => s + c,
        0,
      );

      // Use API total if it exists, otherwise use calculated
      state.totalUnreadCount = Number(total) || calculatedUnreadCount;

      // Debug log
      console.log('🔔 setUnreadCounts:', {
        inputTotal: total,
        apiTotalCount: state.totalCount,
        calculatedFromThreads: calculatedUnreadCount,
        finalTotalUnreadCount: state.totalUnreadCount,
        threadCountKeys: Object.keys(state.threadCounts),
      });

      // We've received authoritative counts from the server — mark initialized
      state.initialized = true;

      // Update role-based counts if provided
      if (roleBased && typeof roleBased === 'object') {
        state.superAdminCount =
          Number(
            roleBased.superadmin ||
              roleBased.superAdmin ||
              state.superAdminCount,
          ) || state.superAdminCount;
        state.companyAdminCount =
          Number(
            roleBased.company_admin ||
              roleBased.companyAdmin ||
              state.companyAdminCount,
          ) || state.companyAdminCount;
      }
    },

    // Get count for a specific thread
    getThreadCount: (state, action) => {
      const {threadId} = action.payload;
      return state.threadCounts[threadId] || 0;
    },

    // Update Super Admin count
    updateSuperAdminCount: (state, action) => {
      const {type} = action.payload;
      if (type === 'increment') {
        state.superAdminCount += 1;
      } else if (type === 'decrement') {
        state.superAdminCount = Math.max(0, state.superAdminCount - 1);
      } else if (type === 'set') {
        state.superAdminCount = action.payload.count || 0;
      }
    },

    // Update Company Admin count
    updateCompanyAdminCount: (state, action) => {
      const {type} = action.payload;
      if (type === 'increment') {
        state.companyAdminCount += 1;
      } else if (type === 'decrement') {
        state.companyAdminCount = Math.max(0, state.companyAdminCount - 1);
      } else if (type === 'set') {
        state.companyAdminCount = action.payload.count || 0;
      }
    },

    // Reset both sidebar counts
    resetSidebarCounts: state => {
      state.superAdminCount = 0;
      state.companyAdminCount = 0;
    },
  },
});

export const {
  updateCount,
  setCount,
  resetCount,
  setLoading,
  setError,
  initializeThreadCount,
  incrementThreadCount,
  decrementThreadCount,
  clearThreadCount,
  clearAllCounts,
  setThreadCount,
  updateMultipleThreadCounts,
  setUnreadCounts,
  getThreadCount,
  updateSuperAdminCount,
  updateCompanyAdminCount,
  resetSidebarCounts,
} = messageCountSlice.actions;

export default messageCountSlice.reducer;
