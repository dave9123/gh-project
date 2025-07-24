import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import userReducer from "./slices/userSlice";
import sessionReducer from "./slices/sessionSlice";

const rootReducer = combineReducers({
  session: sessionReducer,
  user: userReducer,
});

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: process.env.NODE_ENV !== "production",
  });

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;

export type AppDispatch = AppStore["dispatch"];
