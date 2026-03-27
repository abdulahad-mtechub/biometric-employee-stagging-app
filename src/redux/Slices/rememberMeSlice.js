import {createSlice} from '@reduxjs/toolkit';

const rememberMeSlice = createSlice({
  name: 'rememberMe',
  initialState: {
    savedAccounts: [], // Store multiple user accounts
  },
  reducers: {
    saveAccount: (state, action) => {
      const newAccount = action.payload;
      // Prevent duplicates based on email
      const index = state.savedAccounts.findIndex(
        acc => acc.email === newAccount.email,
      );

      if (index !== -1) {
        // ✅ If email exists, update the password
        state.savedAccounts[index].password = newAccount.password;
      } else {
        // ✅ If email does not exist, add new account
        state.savedAccounts.push(newAccount);
      }
      // const exists = state.savedAccounts.some(
      //   (acc) => acc.email === newAccount.email
      // );
      // if (!exists) {
      //   state.savedAccounts.push(newAccount);
      // }
    },
    removeAccount: (state, action) => {
      // Remove an account by email
      state.savedAccounts = state.savedAccounts.filter(
        acc => acc.email !== action.payload,
      );
    },
    clearAccounts: state => {
      state.savedAccounts = [];
    },
  },
});

export const {saveAccount, removeAccount, clearAccounts} =
  rememberMeSlice.actions;
export default rememberMeSlice.reducer;
