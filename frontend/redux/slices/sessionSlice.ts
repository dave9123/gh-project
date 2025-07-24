import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Session, Session as SessionType } from "next-auth";

const initialState: SessionType | any | null = null;

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionType>) {
      state.session = action.payload;
    },
    clearSession(state) {
      state.session = null;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
