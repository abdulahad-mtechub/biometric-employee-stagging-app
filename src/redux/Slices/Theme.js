import {createSlice} from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    isDarkMode: false,
    buttonColors: null, // Only store button colors
    logo: null, // Added
    companyName: null, // Added
  },
  reducers: {
    toggleTheme: state => {
      state.isDarkMode = !state.isDarkMode;
    },
    setTheme: (state, action) => {
      state.isDarkMode = action.payload;
    },
    setButtonColors: (state, action) => {
      state.buttonColors = action.payload;

      if (action.payload?.logo) {
        state.logo = action.payload.logo;
      }
      if (action.payload?.company_name) {
        state.companyName = action.payload.company_name;
      }
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
    },
  },
});

export const {toggleTheme, setTheme, setDarkMode, setButtonColors} =
  themeSlice.actions;
export default themeSlice.reducer;
