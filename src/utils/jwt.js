import moment from "moment";
import jwtDecode from "jwt-decode";

export const getExpiration = token => {
  const { exp } = jwtDecode(token);
  const then = moment(exp * 1000);
  const now = moment();
  return then.diff(now, "milliseconds");
};
