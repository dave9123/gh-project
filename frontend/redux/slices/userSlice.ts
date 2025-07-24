import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserSession } from "next-auth";

const initialState: UserSession = {};
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state: UserSession, action: PayloadAction<UserSession>) {
      return Object.assign({}, state, { ...action.payload });
    },
    clearUser() {
      return initialState;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
