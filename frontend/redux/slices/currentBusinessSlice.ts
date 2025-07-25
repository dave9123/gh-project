import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CurrentBusinessState {
  name?: string;
  slug?: string;
  phoneNumber?: string;
  ownerEmail?: string;
}

const initialState: CurrentBusinessState = {
  name: undefined,
  slug: undefined,
  phoneNumber: undefined,
  ownerEmail: undefined,
};

const currentBusinessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    setBusinessData(
      state: typeof initialState,
      action: PayloadAction<CurrentBusinessState>
    ) {
      return Object.assign({}, state, { ...action.payload });
    },
    clearBusinessData() {
      return initialState;
    },
  },
});

export const { setBusinessData, clearBusinessData } =
  currentBusinessSlice.actions;
export default currentBusinessSlice.reducer;
