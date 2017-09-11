import { callAPI } from "../api";
import { createActionTypes } from "../../utils/helpers";

export const actionTypes = createActionTypes("artee/auth", [
  "LOGIN_START",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "CONFIRM_START",
  "CONFIRM_SUCCESS",
  "CONFIRM_FAILURE",
  "REFRESH_TOKEN_START",
  "REFRESH_TOKEN_SUCCESS",
  "REFRESH_TOKEN_FAILURE",
  "LOGOUT"
]);

export default {
  ...actionTypes,
  confirmUser: (phone, token) => {
    return callAPI(
      "/auth/confirm",
      {
        method: "POST",
        body: { phone, token },
        auth: false
      },
      [
        actionTypes.CONFIRM_START,
        actionTypes.CONFIRM_SUCCESS,
        actionTypes.CONFIRM_FAILURE
      ]
    );
  },
  loginUser: phone => {
    return callAPI(
      "/auth/login",
      {
        method: "POST",
        body: { phone },
        auth: false
      },
      [
        actionTypes.LOGIN_START,
        actionTypes.LOGIN_SUCCESS,
        actionTypes.LOGIN_FAILURE
      ]
    );
  },
  logout: () => {
    return { type: actionTypes.LOGOUT };
  },
  refreshToken: token => {
    return callAPI(
      "/auth/refresh",
      {
        method: "POST",
        auth: token
      },
      [
        actionTypes.REFRESH_TOKEN_START,
        actionTypes.REFRESH_TOKEN_SUCCESS,
        actionTypes.REFRESH_TOKEN_FAILURE
      ]
    );
  }
};
