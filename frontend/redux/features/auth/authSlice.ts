import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  token: "",
  user: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    registerUser: (state, action:PayloadAction<{token:string}>) => {
      state.token = action.payload.token;
    },
    loginUser: (state, action:PayloadAction<{accessToken:string,user:string}>) => {
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logoutUser: (state) => {
      state.token = "";
      state.user = "";
    },
  },
});
export const { registerUser, loginUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;