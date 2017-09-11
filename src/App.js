import React from "react";
import PropTypes from "prop-types";
import LovenseWebBluetooth from "./lib/LovenseWebBluetooth";
import { connect } from "twilio-video";
import Waveform from "./Waveform";
import { resolveURL } from "./ducks/api/utils.js";
import { connect as reduxConnect } from "react-redux";

class App extends React.Component {
  static defaultProps = {
    roomName: "test_room"
  };

  static propTypes = {
    roomName: PropTypes.string,
    access_token: PropTypes.string
  };

  state = {
    value: 0,
    device: null,
    room: null,
    error: null,
    loading: false,
    controlling: false,
    remoteAudio: null
  };

  componentDidMount() {
    this.ws = new WebSocket(resolveURL("/ws", "wss"));
    this.ws.onmessage = e =>
      e.data.split("\n").forEach(message => {
        message && this.handleMessage(JSON.parse(message));
      });
  }

  componentWillUnmount() {
    this.ws.close();
  }

  connectToVideo = async () => {
    this.setState({ loading: true });
    const token = await fetch(resolveURL("/token"), {
      headers: {
        Authorization: `Bearer ${this.props.access_token}`
      }
    })
      .then(response => {
        return response.json();
      })
      .then(response => response.token);
    connect(token, { name: this.props.roomName }).then(
      room => {
        this.setState({ room, loading: false }, () => {
          this.roomJoined();
        });
      },
      error => {
        this.setState({ error });
      }
    );
  };

  roomJoined = () => {
    const { room } = this.state;

    room.participants.forEach(participant => {
      participant.tracks.forEach(track => {
        track.attach(this.remote);
      });
    });

    room.localParticipant.tracks.forEach(track => {
      track.attach(this.local);
    });

    room.on("participantConnected", participant => {
      participant.tracks.forEach(track => {
        track.attach(this.remote);
      });
    });

    room.on("trackAdded", track => {
      if (track.kind === "audio") {
        this.setState({ remoteAudio: track });
        track.attach(this.remoteAudio);
        return;
      }
      track.attach(this.remote);
    });

    room.on("trackRemoved", track => {
      track.detach().forEach(el => {
        el.remove();
      });
      if (track.kind === "audio") {
        this.setState({ remoteAudio: null });
      }
    });

    room.on("participantDisconnected", participant => {
      participant.tracks.forEach(track => {
        if (track.kind === "audio") {
          this.state({ remoteAudio: null });
        }
        track.detach();
      });
      if (room.participants.values().next().value === undefined) {
        this.disconnect();
      }
    });
  };

  controlDevice = () => {
    this.setState({ controlling: true });
  };

  connectToDevice = () => {
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
      this.setState({ value: parseInt(v.message, 10) });
    }
  };

  handleChange = e => {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: "speed", message: e.target.value }));
    }
    this.setState({ value: e.target.value });
  };

  disconnect = () => {
    this.state.room && this.state.room.disconnect();
    this.setState({ room: null, loading: false });
  };

  renderRoomStatus() {
    let message = "";
    if (this.state.error) {
      return (
        <pre>
          {this.state.error.stack}
        </pre>
      );
    } else if (!this.state.room && this.state.loading) {
      message = "Connecting...";
    } else if (!this.state.room) {
      message = "Not connected";
    } else if (this.state.room.state === "disconnected") {
      message = "Disconnected";
    } else if (this.state.room) {
      message = "Connected";
    }
    return message !== ""
      ? <p className="status">
          {message}
        </p>
      : null;
  }

  renderSplash() {
    return (
      <div className="Splash">
        <button
          className="button button--primary"
          onClick={this.connectToVideo}
          disabled={this.state.loading}
        >
          {this.state.loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    );
  }

  renderWaveform() {
    const { remoteAudio } = this.state;
    const mediaStream = new MediaStream();
    mediaStream.addTrack(remoteAudio.mediaStreamTrack);
    return <Waveform stream={mediaStream} />;
  }

  renderApp() {
    return (
      <div className="App">
        <video ref={r => (this.local = r)} className="Video Video__local" />
        <video ref={r => (this.remote = r)} className="Video Video__remote" />
        <audio ref={r => (this.remoteAudio = r)} />
        <div className="Controls">
          <div className="Controls__top">
            {this.renderRoomStatus()}
          </div>
          <div className="Controls__bottom">
            {this.state.controlling &&
              <input
                type="range"
                value={this.state.value}
                onChange={this.handleChange}
                min="0"
                max="20"
              />}
            {!this.state.device &&
              <button onClick={this.connectToDevice}>Connect device</button>}
            {this.ws &&
              <button onClick={this.controlDevice}>Control device</button>}
            {!this.state.room
              ? <button
                  className="button button--green"
                  onClick={this.connectToVideo}
                >
                  Connect video
                </button>
              : <button
                  className="button button--red"
                  onClick={this.disconnect}
                >
                  Disconnect
                </button>}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return this.state.room ? this.renderApp() : this.renderSplash();
  }
}

export default reduxConnect(state => state.auth)(App);
