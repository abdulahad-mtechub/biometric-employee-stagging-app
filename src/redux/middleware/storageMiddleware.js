import {saveSlice, SLICE_KEYS} from '../../utils/reduxStorage';

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Debounced save functions for each slice
const debouncedSaves = {
  auth: debounce(state => saveSlice(SLICE_KEYS.auth, state), 500),
  theme: debounce(state => saveSlice(SLICE_KEYS.theme, state), 500),
  rememberMe: debounce(state => saveSlice(SLICE_KEYS.rememberMe, state), 500),
  // Use shorter debounce for messageCount to save faster
  messageCount: debounce(
    state => saveSlice(SLICE_KEYS.messageCount, state),
    100, // Reduced from 500ms to 100ms for faster persistence
  ),
};

// Middleware to auto-save slices
const storageMiddleware = store => next => action => {
  const result = next(action);
  const state = store.getState();

  // Auto-save auth slice
  if (state.auth) {
    debouncedSaves.auth(state.auth);
  }

  // Auto-save theme slice
  if (state.theme) {
    debouncedSaves.theme(state.theme);
  }

  // Auto-save rememberMe slice
  if (state.rememberMeSlice) {
    debouncedSaves.rememberMe(state.rememberMeSlice);
  }

  // Auto-save messageCount slice with shorter debounce
  if (state.messageCount) {
    console.log('💾 messageCount state changed, auto-saving...', {
      totalCount: state.messageCount.totalCount,
      totalUnreadCount: state.messageCount.totalUnreadCount,
      initialized: state.messageCount.initialized,
      threadCount: Object.keys(state.messageCount.threadCounts || {}).length
    });
    debouncedSaves.messageCount(state.messageCount);
  }

  return result;
};

export default storageMiddleware;
