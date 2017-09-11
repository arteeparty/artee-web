import {
  all,
  put,
  cancel,
  fork,
  take,
  call,
  select,
  race
} from "redux-saga/effects";
import { delay } from "redux-saga";
import { createMockTask } from "redux-saga/utils";
import cookies from "js-cookie";
import * as selectors from "./selectors";
import { reducer } from "./reducer";
import saga, { authSaga, PRIVATE } from "./sagas";
import { actionTypes, actions } from "./actions";
import { callAPI } from "../api";
import { loadAuthState, setAuthState } from "./utils";
import * as jwt from "../../utils/jwt";

const VALID_TOKEN = "VALID_TOKEN";
const EXPIRED_TOKEN = "EXPIRED_TOKEN";
const getExp = token => (token === EXPIRED_TOKEN ? -500 : 500);
const decode = token => token === VALID_TOKEN || token === EXPIRED_TOKEN;
jest.mock("../../utils/jwt");

describe("auth selectors", () => {
  it("getAuth should return auth state", () => {
    expect(selectors.selectAuth({ auth: 1 })).toBe(1);
  });

  it("getToken should return the access_token", () => {
    expect(selectors.selectToken({ auth: { access_token: 1 } })).toBe(1);
  });

  it("getRefreshToken should return the refresh_token", () => {
    expect(selectors.selectRefreshToken({ auth: { refresh_token: 1 } })).toBe(
      1
    );
  });

  it("getLoggedIn should check if access_token is not null", () => {
    expect(selectors.selectLoggedIn({ auth: { access_token: 1 } })).toBe(true);
    expect(selectors.selectLoggedIn({ auth: { access_token: null } })).toBe(
      false
    );
  });

  it("getProfile", () => {
    expect(selectors.selectProfile({ auth: { profile: true } })).toBe(true);
  });

  it("getUserId", () => {
    expect(selectors.selectUserId({ auth: { profile: { id: true } } })).toBe(
      true
    );
  });
});

describe("auth reducer", () => {
  it("should return initalState", () => {
    expect(reducer(undefined, {})).toEqual({
      profile: null,
      access_token: null,
      refresh_token: null,
      login: {
        loading: false,
        error: null,
        step: 0
      }
    });
  });

  it("should handle LOGIN_START", () => {
    expect(
      reducer(undefined, { type: actionTypes.LOGIN_START }).login.loading
    ).toBe(true);
  });

  it("should handle LOGIN_SUCCESS", () => {
    const action = {
      type: actionTypes.LOGIN_SUCCESS,
      payload: {
        access_token: VALID_TOKEN,
        refresh_token: VALID_TOKEN,
        profile: {}
      }
    };
    expect(reducer(undefined, action)).toEqual({
      access_token: VALID_TOKEN,
      refresh_token: VALID_TOKEN,
      login: {
        loading: false
      },
      register: {
        loading: false,
        step: 0,
        error: null
      },
      profile: {}
    });
  });

  it("should handle REFRESH_TOKEN_SUCCESS", () => {
    const action = {
      type: actionTypes.REFRESH_TOKEN_SUCCESS,
      payload: {
        access_token: VALID_TOKEN
      }
    };
    expect(reducer(undefined, action).access_token).toBe(VALID_TOKEN);
  });

  it("should handle LOGIN_FAILURE", () => {
    const action = {
      type: actionTypes.LOGIN_FAILURE,
      error: "Error"
    };
    expect(reducer(undefined, action).login.error).toBe("Error");
  });

  it("should handle LOGOUT", () => {
    expect(reducer(undefined, { type: actionTypes.LOGOUT })).toEqual({
      profile: null,
      access_token: null,
      refresh_token: null,
      login: {
        loading: false,
        error: null
      },
      register: {
        loading: false,
        error: null,
        step: 0
      }
    });
  });

  it("should handle unknown action type", () => {
    expect(reducer(undefined, "UNKNOWN")).toEqual({
      access_token: null,
      login: { error: null, loading: false },
      profile: null,
      refresh_token: null,
      register: { error: null, loading: false, step: 0 }
    });
  });
});

describe("auth action creators", () => {
  it("logout", () => {
    expect(actions.logout()).toEqual({ type: actionTypes.LOGOUT });
  });
  it("login", () => {
    expect(actions.loginUser("test@test.com", "password")).toEqual(
      callAPI(
        "/auth/login",
        {
          method: "POST",
          body: { email: "test@test.com", password: "password" },
          auth: false
        },
        [
          actionTypes.LOGIN_START,
          actionTypes.LOGIN_SUCCESS,
          actionTypes.LOGIN_FAILURE
        ]
      )
    );
  });
});

describe("auth saga", () => {
  describe("starting the auth saga", () => {
    const generator = authSaga();
    it("should check if the user is logged in", () => {
      expect(generator.next().value).toEqual(select(selectors.selectLoggedIn));
    });

    it("if the user is logged in, it should start the logged in saga", () => {
      expect(generator.next(true).value).toEqual(call(PRIVATE.loggedInSaga));
    });

    it("should check if the user is logged in again", () => {
      expect(generator.next().value).toEqual(select(selectors.selectLoggedIn));
    });

    it("if the user is logged out, it should start the logged out saga", () => {
      expect(generator.next(false).value).toEqual(call(PRIVATE.loggedOutSaga));
    });
  });

  describe("logged in saga", () => {
    const generator = PRIVATE.loggedInSaga();
    const refreshTokenSagaInstance = createMockTask();

    it("should start a saga to keep the user's token refreshed", () => {
      expect(generator.next().value).toEqual(fork(PRIVATE.refreshTokenSaga));
    });

    it("should watch for either a log out or bad token refresh action", () => {
      const raceCondition = {
        manualLogOut: take(actionTypes.LOGOUT),
        failedRefresh: take(actionTypes.REFRESH_TOKEN_FAILURE)
      };
      expect(generator.next(refreshTokenSagaInstance).value).toEqual(
        race(raceCondition)
      );
    });

    it("should cancel the refresh token sagas", () => {
      expect(generator.next().value).toEqual(cancel(refreshTokenSagaInstance));
    });

    it("should be done", () => {
      expect(generator.next().done).toEqual(true);
    });
  });

  describe("refresh token saga", () => {
    const generator = PRIVATE.refreshTokenSaga();

    it("should check the current refresh token", () => {
      expect(generator.next().value).toEqual(
        select(selectors.selectRefreshToken)
      );
    });

    it("should get the value of the new token", () => {
      expect(generator.next(VALID_TOKEN).value).toEqual(
        select(selectors.selectToken)
      );
    });

    it("should wait for a refresh token action or for the expiration of the current token", () => {
      const expiresIn = jwt.getExpiration(VALID_TOKEN);
      const raceCondition = {
        request: take(actionTypes.REFRESH_TOKEN_START),
        delay: call(delay, expiresIn)
      };
      const output = generator.next().value;
      expect(output).toEqual(race(raceCondition));
    });

    it("should refresh the token", () => {
      const output = generator.next().value;
      const expectedOutput = all([
        take(actionTypes.REFRESH_TOKEN_SUCCESS),
        put(actions.refreshToken(VALID_TOKEN))
      ]);
      delete expectedOutput.ALL[1].PUT.action.meta.uuid;
      delete output.ALL[1].PUT.action.meta.uuid;
      expect(output).toEqual(expectedOutput);
    });

    it("should set the new refresh_token", () => {
      const output = generator.next([
        { payload: { access_token: VALID_TOKEN } }
      ]);
      expect(output.value).toEqual(
        call(setAuthState, VALID_TOKEN, VALID_TOKEN)
      );
    });

    it("should get the current refresh token", () => {
      expect(generator.next().value).toEqual(
        select(selectors.selectRefreshToken)
      );
    });
  });

  describe("logged out saga", () => {
    const generator = PRIVATE.loggedOutSaga();
    it("should take a log in action", () => {
      expect(generator.next().value).toEqual(take(actionTypes.LOGIN_SUCCESS));
    });

    it("should dispatch an action to the auth state", () => {
      expect(
        generator.next({
          payload: {
            access_token: VALID_TOKEN,
            refresh_token: VALID_TOKEN,
            profile: {}
          }
        }).value
      ).toEqual(call(setAuthState, VALID_TOKEN, VALID_TOKEN, {}));
    });
  });

  describe("cookie auth storage", () => {
    beforeEach(() => {
      cookies.set = jest.fn();
      cookies.getJSON = jest.fn().mockImplementation(s => {
        if (s === "sid") {
          return { access_token: VALID_TOKEN, refresh_token: VALID_TOKEN };
        }
        if (s === "profile") {
          return { id: 123 };
        }
        return {};
      });
    });

    it("should handle saving tokens only to cookies", () => {
      setAuthState(VALID_TOKEN, VALID_TOKEN);
      expect(cookies.set.mock.calls.length).toBe(1);
      expect(cookies.set.mock.calls[0]).toEqual([
        "sid",
        { access_token: VALID_TOKEN, refresh_token: VALID_TOKEN },
        { secure: false }
      ]);
    });

    it("should handle saving tokens and profile to cookies", () => {
      setAuthState(VALID_TOKEN, VALID_TOKEN, { id: 123 });
      expect(cookies.set.mock.calls.length).toBe(2);
      expect(cookies.set.mock.calls[0]).toEqual([
        "sid",
        { access_token: VALID_TOKEN, refresh_token: VALID_TOKEN },
        { secure: false }
      ]);
      expect(cookies.set.mock.calls[1]).toEqual([
        "profile",
        { id: 123 },
        { secure: false }
      ]);
    });

    it("should handle loading tokens and profile from cookies", () => {
      const data = loadAuthState();
      expect(cookies.getJSON.mock.calls.length).toBe(2);
      expect(data).toEqual({
        profile: { id: 123 },
        access_token: VALID_TOKEN,
        refresh_token: VALID_TOKEN
      });
    });
  });
});

describe("saga", () => {
  const generator = saga();
  it("should start the auth and register saga", () => {
    expect(generator.next().value).toEqual(
      all([fork(authSaga), fork(PRIVATE.registerSaga)])
    );
  });
});
