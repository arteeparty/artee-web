import { loadAuthState } from "./utils";
import { actionTypes } from "./actions";

// Reducer
const initialState = {
  profile: null,
  access_token: null,
  refresh_token: null,
  login: {
    loading: false,
    error: null,
    step: 0
  }
};

export const reducer = (
  state = {
    ...initialState,
    ...loadAuthState()
  },
  action
) => {
  switch (action.type) {
    case actionTypes.LOGIN_START:
      return {
        ...state,
        login: {
          ...state.login,
          loading: true
        }
      };
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        login: {
          ...state.login,
          step: 1,
          loading: false
        }
      };
    case actionTypes.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        access_token: action.payload.access_token
      };
    case actionTypes.CONFIRM_SUCCESS:
      return {
        ...state,
        access_token: action.payload.access_token,
        refresh_token: action.payload.refresh_token,
        profile: action.payload.profile,
        login: {
          ...state.login,
          loading: false,
          error: null
        }
      };
    case actionTypes.CONFIRM_FAILURE:
    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        login: {
          ...state.login,
          loading: false,
          error: action.error
        }
      };
    case actionTypes.LOGOUT:
      return initialState;
    default:
      return state;
  }
};
