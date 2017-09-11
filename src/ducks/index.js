import { combineReducers } from "redux";
import {
  applyMiddleware,
  createStore as createReduxStore,
  compose
} from "redux";
import { reducer as auth } from "./auth/reducer";
import authSaga from "./auth/sagas";
import { saga as apiSaga } from "./api";
import createSagaMiddleware from "redux-saga";
import { fork, all } from "redux-saga/effects";

const reducers = combineReducers({
  auth
});

function* sagas() {
  yield all([fork(apiSaga), fork(authSaga)]);
}

export default function createStore() {
  const sagaMiddleware = createSagaMiddleware();
  let middleware = [sagaMiddleware];
  if (process.env.NODE_ENV !== "production") {
    let logger = require("redux-logger").default;
    middleware = [logger, ...middleware];
  }
  const store = createReduxStore(
    reducers,
    compose(applyMiddleware(...middleware))
  );
  sagaMiddleware.run(sagas);
  return store;
}
