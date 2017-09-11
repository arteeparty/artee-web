import {
  fork,
  takeEvery,
  put,
  take,
  race,
  call,
  select
} from "redux-saga/effects";
import { fetchAPI } from "./utils";
import { actionTypes } from "../auth/actions";
import { selectToken } from "../auth/selectors";

export const API_CALL = "artee/api/API_CALL";

function* handleUnauthorised({ route, config, actions }, meta) {
  yield put({ type: actionTypes.REFRESH_TOKEN_START });
  const { success } = yield race({
    success: take(actionTypes.REFRESH_TOKEN_SUCCESS),
    failure: take(actionTypes.REFRESH_TOKEN_FAILURE)
  });

  if (success) {
    const attempt = meta.attempt + 1;
    yield put(callAPI(route, config, actions, { ...meta, attempt }));
  }
}

function* handleAuth(config) {
  if (config.auth) {
    let token;
    if (typeof config.auth === "string") {
      token = config.auth;
    } else {
      token = yield select(selectToken);
    }
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
}

export function callAPI(route, config, actions, meta = {}) {
  return {
    type: API_CALL,
    payload: { route, config, actions },
    meta
  };
}

function handleActions(actions) {
  actions =
    typeof actions === "string"
      ? [`${actions}_START`, `${actions}_SUCCESS`, `${actions}_FAILURE`]
      : actions;
  actions = actions.map((action, i) => {
    return typeof action === "function"
      ? action
      : payload =>
          i !== 2
            ? { type: action, payload }
            : { type: action, error: payload };
  });
  return actions;
}

export function* apiSaga({ payload, meta }) {
  let { route, config, actions } = payload;
  if (!meta.attempt) meta.attempt = 1;
  const originalActions = actions;
  const [requestAction, successAction, failureAction] = handleActions(actions);

  try {
    yield call(handleAuth, config);
    yield put(requestAction({ route, config }));
    const response = yield call(fetchAPI, route, config);
    yield put(successAction(response));
    return response;
  } catch (error) {
    if (error.status === 401 && meta.attempt === 1) {
      yield call(
        handleUnauthorised,
        { route, config, actions: originalActions },
        meta
      );
    } else {
      yield put(failureAction(error));
    }
  }
}

export function* saga() {
  yield fork(takeEvery, API_CALL, apiSaga);
}

export const PRIVATE = {
  handleAuth,
  handleUnauthorised,
  handleActions
};
