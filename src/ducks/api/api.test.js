import {
  call,
  put,
  fork,
  take,
  race,
  select,
  takeEvery
} from "redux-saga/effects";
import { apiSaga, callAPI, PRIVATE, API_CALL, saga } from "./service";
import { fetchAPI } from "./utils";
import { actionTypes } from "../auth/actions";
import { selectAuth, selectToken } from "../auth/selectors";

const { handleAuth, handleUnauthorised, handleActions } = PRIVATE;

describe("api saga:", () => {
  describe("helpers", () => {
    it("should generate call api action with auto generated start, success and failure actions", () => {
      expect(callAPI("/route", {}, "test")).toEqual({
        type: API_CALL,
        payload: {
          route: "/route",
          config: {},
          actions: "test"
        },
        meta: {}
      });
    });

    it("should handle actions", () => {
      expect(handleActions("action").map(f => f())).toEqual([
        { type: "action_START" },
        { type: "action_SUCCESS" },
        { type: "action_FAILURE" }
      ]);
      const test = () => ({ type: "TEST_ACTION" });
      expect(handleActions([test, test, test]).map(f => f())).toEqual([
        { type: "TEST_ACTION" },
        { type: "TEST_ACTION" },
        { type: "TEST_ACTION" }
      ]);
    });
  });

  describe("successful api call", () => {
    const apiAction = {
      payload: {
        route: "/foo",
        config: { auth: true },
        actions: ["request", "success", "failure"]
      },
      meta: {
        attempt: 1
      }
    };
    const generator = apiSaga(apiAction);
    it("should handle authentication", () => {
      const output = generator.next().value;
      expect(output).toEqual(call(handleAuth, apiAction.payload.config));
    });

    it("should dispatch a request starting action", () => {
      const requestAction = {
        type: apiAction.payload.actions[0],
        payload: {
          route: apiAction.payload.route,
          config: apiAction.payload.config
        }
      };
      expect(generator.next().value).toEqual(put(requestAction));
    });

    it("should fetch the resource", () => {
      const apiCallAction = call(
        fetchAPI,
        apiAction.payload.route,
        apiAction.payload.config
      );
      expect(generator.next().value).toEqual(apiCallAction);
    });

    it("should dispatch a request success action", () => {
      const apiResponse = { foo: "bar" };
      const requestAction = {
        type: apiAction.payload.actions[1],
        payload: apiResponse
      };
      expect(generator.next(apiResponse).value).toEqual(put(requestAction));
    });
  });

  describe("failed api call", () => {
    const apiAction = {
      payload: {
        route: "/foo",
        config: { requiresAuth: true },
        actions: ["request", "success", "failure"]
      },
      meta: {
        attempt: 1
      }
    };
    const generator = apiSaga(apiAction);

    it("should handle authentication", () => {
      expect(generator.next().value).toEqual(
        call(handleAuth, apiAction.payload.config)
      );
    });

    it("should dispatch a request starting action", () => {
      const requestAction = {
        type: apiAction.payload.actions[0],
        payload: {
          route: apiAction.payload.route,
          config: apiAction.payload.config
        }
      };
      expect(generator.next().value).toEqual(put(requestAction));
    });

    it("should fetch the resource", () => {
      const apiCallAction = call(
        fetchAPI,
        apiAction.payload.route,
        apiAction.payload.config
      );
      expect(generator.next().value).toEqual(apiCallAction);
    });

    it("should dispatch a request failed action", () => {
      const apiResponse = { message: "foo happened" };
      const requestAction = {
        type: apiAction.payload.actions[2],
        error: apiResponse
      };
      expect(generator.throw(apiResponse).value).toEqual(put(requestAction));
    });
  });

  describe("unauthorized api call", () => {
    const apiAction = {
      payload: {
        route: "/foo",
        config: { requiresAuth: true },
        actions: ["request", "success", "failure"]
      },
      meta: {
        attempt: 1
      }
    };
    const generator = apiSaga(apiAction);

    it("should handle authentication", () => {
      expect(generator.next().value).toEqual(
        call(handleAuth, apiAction.payload.config)
      );
    });

    it("should dispatch a request starting action", () => {
      const requestAction = {
        type: apiAction.payload.actions[0],
        payload: {
          route: apiAction.payload.route,
          config: apiAction.payload.config
        }
      };
      expect(generator.next().value).toEqual(put(requestAction));
    });

    it("should fetch the resource", () => {
      const apiCallAction = call(
        fetchAPI,
        apiAction.payload.route,
        apiAction.payload.config
      );
      expect(generator.next().value).toEqual(apiCallAction);
    });

    it("should dispatch a request failure action", () => {
      const apiResponse = { status: 401 };
      const startUnauthorizedHandler = call(
        handleUnauthorised,
        apiAction.payload,
        apiAction.meta
      );
      expect(generator.throw(apiResponse).value).toEqual(
        startUnauthorizedHandler
      );
    });
  });

  describe("handle unauthorised requests", () => {
    const generator = handleUnauthorised(
      { route: "/failed", config: {}, actions: "request" },
      { attempt: 1 }
    );

    it("should start the refresh token process", () => {
      expect(generator.next().value).toEqual(
        put({
          type: actionTypes.REFRESH_TOKEN_START
        })
      );
    });

    it("should wait for the refresh process to either succeed or fail", () => {
      const action = race({
        success: take(actionTypes.REFRESH_TOKEN_SUCCESS),
        failure: take(actionTypes.REFRESH_TOKEN_FAILURE)
      });
      expect(generator.next().value).toEqual(action);
    });

    it("on success it should increment attempt by and retry", () => {
      expect(generator.next({ success: true }).value).toEqual(
        put(callAPI("/failed", {}, "request", { attempt: 2 }))
      );
    });

    it("on failure should not retry", () => {
      expect(generator.next({ success: false }).done).toEqual(true);
    });
  });

  describe("handle authed requests", () => {
    it("should not set header if auth is false", () => {
      const config = {
        auth: false,
        headers: {
          Header: "Text"
        }
      };
      const generator = handleAuth(config);
      generator.next();
      expect(config).toEqual(config);
    });

    it("should set header if auth is true", () => {
      const config = {
        auth: true
      };
      const generator = handleAuth(config);
      expect(generator.next().value).toEqual(select(selectToken));
    });

    it("should handle cases where auth is a string", () => {
      const config = {
        auth: "TOKEN"
      };
      const generator = handleAuth(config);
      generator.next();
      expect(config.headers.Authorization).toEqual("Bearer TOKEN");
    });
  });
});

describe("saga", () => {
  const generator = saga();
  it("should start the auth saga", () => {
    const output = generator.next().value;
    expect(output).toEqual(fork(takeEvery, API_CALL, apiSaga));
  });
});
