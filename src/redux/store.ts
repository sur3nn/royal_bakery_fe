import { configureStore } from '@reduxjs/toolkit';
import bakeryReducer from './slice/bakerySlice';

export const store = configureStore({
  reducer: {
    bakery: bakeryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
