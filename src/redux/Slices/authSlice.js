import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  user: {}, // Store full data object here
  isLoggedIn: false,
  rememberMe: false,
  profile: {},
  // language: 'English',
  language: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      state.user = action.payload;
    },
    setLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload;
    },
    setProfileData: (state, action) => {
      state.profile = action.payload;
    },
    logout: state => {
      state.user = {};
      state.isLoggedIn = false;
      state.rememberMe = false;
      state.profile = {};
      // Clear persisted redux state on logout
      if (typeof window !== 'undefined' && window.AsyncStorage) {
        window.AsyncStorage.removeItem('persist:root');
      } else if (typeof global !== 'undefined' && global.AsyncStorage) {
        global.AsyncStorage.removeItem('persist:root');
      } else {
        try {
          // For React Native
          require('@react-native-async-storage/async-storage').default.removeItem(
            'persist:root',
          );
        } catch (e) {}
      }
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
  },
});

export const {
  setUserData,
  setLoggedIn,
  setRememberMe,
  setProfileData,
  logout,
  setLanguage,
} = authSlice.actions;
export default authSlice.reducer;
