import cookies from "js-cookie";

export function loadAuthState() {
  const { access_token, refresh_token } = cookies.getJSON("sid") || {
    access_token: null,
    refresh_token: null
  };
  return {
    profile: cookies.getJSON("profile") || null,
    access_token,
    refresh_token
  };
}

export function setAuthState(access_token, refresh_token, profile) {
  cookies.set(
    "sid",
    {
      access_token,
      refresh_token
    },
    { secure: false }
  );
  if (profile) cookies.set("profile", profile, { secure: false });
}
