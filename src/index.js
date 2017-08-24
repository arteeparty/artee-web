import React from "react";
import ReactDOM from "react-dom";
import LovenseWebBluetooth from "./lib/LovenseWebBluetooth";
import "./styles/index.css";

class App extends React.Component {
  state = {
    value: 0,
    device: null
  };

  componentDidMount() {
    this.ws = new WebSocket("wss://api.artee.party/ws");
    this.ws.onmessage = e => this.handleMessage(JSON.parse(e.data));
  }

  componentWillUnmount() {
    this.ws.close();
  }

  connect = () => {
    LovenseWebBluetooth.findDevice().then(d => {
      if (!d) {
        return;
      }
      const device = new LovenseWebBluetooth(d);
      device.open();
      this.setState({ device });
    });
  };

  handleMessage = v => {
    if (v.type === "speed" && this.state.device) {
      this.state.device.vibrate(parseInt(v.message, 10));
    }
  };

  handleChange = e => {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: "speed", message: e.target.value }));
    }
    this.setState({ value: e.target.value });
  };

  render() {
    return (
      <div>
        <input
          type="range"
          value={this.state.value}
          onChange={this.handleChange}
          min="0"
          max="20"
        />
        <button onClick={this.connect}>Connect</button>
        {this.device && <span>Connected</span>}
      </div>
    );
  }
}

export default ReactDOM.render(<App />, document.getElementById("root"));
