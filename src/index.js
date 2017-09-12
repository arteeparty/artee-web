import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { Route } from "react-router";
import PrivateRoute from "./components/PrivateRoute";
import { BrowserRouter } from "react-router-dom";
import { Provider, connect } from "react-redux";
import App from "./App";
import Login from "./auth/Login";
import createStore from "./ducks/index";
import "./styles/index.css";

if (process.env.REACT_APP_VERSION) {
  console.log({ version: process.env.REACT_APP_VERSION });
}

let Index = props => {
  return (
    <BrowserRouter>
      <div className="Index">
        <PrivateRoute
          exact
          path="/"
          component={App}
          authed={!!props.access_token}
        />
        <Route path="/login" component={Login} />
      </div>
    </BrowserRouter>
  );
};

Index.propTypes = {
  access_token: PropTypes.string
};

Index = connect(state => state.auth)(Index);

ReactDOM.render(
  <Provider store={createStore()}>
    <Index />
  </Provider>,
  document.getElementById("root")
);
