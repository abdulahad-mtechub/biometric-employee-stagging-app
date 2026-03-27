import {combineReducers, configureStore} from '@reduxjs/toolkit';
import storageMiddleware from '../middleware/storageMiddleware';
import AuthSlice from '../Slices/authSlice';
import ThemeSlice from '../Slices/Theme';
import rememberMeSlice from '../Slices/rememberMeSlice';
import messageCountReducer from '../Slices/MessageCountSlice';

const rootReducer = combineReducers({
  auth: AuthSlice,
  theme: ThemeSlice,
  rememberMeSlice: rememberMeSlice,
  messageCount: messageCountReducer, // ✅ key name must match what you use in useSelector
});

export const Store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(storageMiddleware),
});
