import {
  all,
  cancel,
  select,
  race,
  fork,
  call,
  take,
  put
} from "redux-saga/effects";
import { delay } from "redux-saga";
import { getExpiration } from "../../utils/jwt";
import actions, { actionTypes } from "./actions";
import { setAuthState } from "./utils";
import { selectToken, selectRefreshToken, selectLoggedIn } from "./selectors";

function* refreshTokenSaga() {
  let refresh_token = yield select(selectRefreshToken);
  while (refresh_token) {
    // Get new token and check for expiration
    const token = yield select(selectToken);
    const expiresIn = getExpiration(token);
    // Wait for expiration or refresh action
    yield race({
      request: take(actionTypes.REFRESH_TOKEN_START),
      delay: call(delay, expiresIn)
    });
    const [{ payload }] = yield all([
      take(actionTypes.REFRESH_TOKEN_SUCCESS),
      put(actions.refreshToken(refresh_token))
    ]);
    yield call(setAuthState, payload.access_token, refresh_token);

    // Get the current refresh_token (it could have been removed/changed in other saga)
    refresh_token = yield select(selectRefreshToken);
  }
}

function* loggedOutSaga() {
  yield take(actionTypes.CONFIRM_START);
  const { payload } = yield take(actionTypes.CONFIRM_SUCCESS);
  const { access_token, refresh_token, profile } = payload;
  yield call(setAuthState, access_token, refresh_token, profile);
}

function* loggedInSaga() {
  const refreshSaga = yield fork(refreshTokenSaga);

  yield race({
    manualLogOut: take(actionTypes.LOGOUT),
    failedRefresh: take(actionTypes.REFRESH_TOKEN_FAILURE)
  });

  yield cancel(refreshSaga);
}

export function* authSaga() {
  while (true) {
    if (yield select(selectLoggedIn)) {
      yield call(loggedInSaga);
    } else {
      yield call(loggedOutSaga);
    }
  }
}

export default function* saga() {
  yield all([fork(authSaga)]);
}

export const PRIVATE = {
  loggedInSaga,
  loggedOutSaga,
  refreshTokenSaga,
  setAuthState
};
