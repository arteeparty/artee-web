import { createSelector } from "reselect";

export const selectAuth = state => state.auth;
export const selectToken = createSelector(
  selectAuth,
  auth => auth.access_token
);
export const selectRefreshToken = createSelector(
  selectAuth,
  auth => auth.refresh_token
);
export const selectLoggedIn = createSelector(selectToken, token => !!token);
export const selectProfile = createSelector(selectAuth, auth => auth.profile);
export const selectUserId = createSelector(
  selectProfile,
  profile => profile.id
);
