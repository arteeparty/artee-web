import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect } from "react-router";

const PrivateRoute = props => {
  const { component: Component, authed, ...rest } = props;
  return (
    <Route
      {...rest}
      render={props => {
        return authed
          ? <Component {...props} />
          : <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location }
              }}
            />;
      }}
    />
  );
};

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  location: PropTypes.string,
  authed: PropTypes.bool
};

export default PrivateRoute;
