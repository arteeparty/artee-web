import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import actions from "../ducks/auth/actions";
import { Redirect } from "react-router-dom";

class Login extends React.Component {
  static propTypes = {
    loginUser: PropTypes.func.isRequired,
    confirmUser: PropTypes.func.isRequired,
    login: PropTypes.object.isRequired,
    access_token: PropTypes.string
  };

  handleSubmit = async e => {
    e.preventDefault();
    this.props.loginUser(this.state.phone);
  };

  state = {
    phone: "",
    pin: ""
  };

  renderForm = () => {
    switch (this.props.login.step) {
      case 1:
        return (
          <div className="LoginStep">
            <label htmlFor="pin">Pin</label>
            <input
              name="pin"
              value={this.state.pin}
              onChange={e => {
                this.setState({ pin: e.target.value }, () => {
                  if (this.state.pin.length === 6) {
                    this.props.confirmUser(this.state.phone, this.state.pin);
                  }
                });
              }}
            />
          </div>
        );
      case 0:
        return (
          <div className="LoginStep">
            <label htmlFor="phone">Enter your phone number to begin</label>
            <input
              name="phone"
              value={this.state.phone}
              onChange={e => {
                this.setState({ phone: e.target.value });
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  render() {
    if (this.props.access_token) {
      return <Redirect to="/" />;
    }

    return (
      <div className="Splash">
        <form onSubmit={this.handleSubmit}>
          <div className="Login">
            <h2>Login</h2>
            {this.renderForm()}
            {this.props.login.step === 0 &&
              <button className="button button--primary">Submit</button>}
          </div>
        </form>
      </div>
    );
  }
}

export default connect(state => state.auth, actions)(Login);
