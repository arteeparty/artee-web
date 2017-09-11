import { getExpiration } from "./jwt";
import moment from "moment";

const TODAY = moment("2013-02-08 24:00:00.000").valueOf();
Date.now = jest.fn(() => TODAY);

describe("test getExpiration", () => {
  it("should return TODAY", () => {
    expect(moment().valueOf()).toEqual(TODAY);
  });

  it("should return a diff of millisends between now and token expiry", () => {
    const token =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJleHAiOjEzOTMyODY4OTMsImlhdCI6MTM5MzI2ODg5M30.4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo";
    const exp = 1393286893;
    expect(getExpiration(token)).toEqual(
      moment(exp * 1000).diff(moment(), "millisecnds")
    );
  });
});
