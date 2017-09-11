import React from "react";
import ReactDOM from "react-dom";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import Login from "./auth/Login";
import createStore from "./ducks/index";
import "./styles/index.css";

if (process.env.REACT_APP_VERSION) {
  console.log({ version: process.env.REACT_APP_VERSION });
}

class Index extends React.Component {
  render() {
    return (
      <Provider store={createStore()}>
        <BrowserRouter>
          <div className="Index">
            <Route exact path="/" component={App} />
            <Route path="/login" component={Login} />
          </div>
        </BrowserRouter>
      </Provider>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById("root"));
