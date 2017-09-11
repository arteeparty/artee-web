import React from "react";
import PropTypes from "prop-types";

export default class Waveform extends React.Component {
  static defaultProps = {
    height: "100%",
    width: "100%"
  };

  static propTypes = {
    height: PropTypes.string.isRequired,
    width: PropTypes.string.isRequired
  };

  componentDidMount() {
    const { canvas } = this;
    canvas.style.display = "block";
    canvas.style.position = "relative";
    canvas.style.height = this.props.height;
    canvas.style.width = this.props.width;
    const canvasContext = canvas.getContext("2d");
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = "rgb(255,255,255)";
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const audioSource = audioContext.createMediaStreamSource(this.props.stream);
    audioSource.connect(analyser);
    this.setState(
      { audioSource, canvasContext, audioContext, analyser, dataArray },
      () => {
        this.renderFrame();
      }
    );
  }

  renderFrame = () => {
    const { analyser, dataArray, canvasContext } = this.state;
    const bufferLength = analyser.frequencyBinCount;
    const canvas = this.canvas;

    requestAnimationFrame(this.renderFrame.bind(null));
    analyser.getByteTimeDomainData(dataArray);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    var x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // End the line at the middle right, and draw the line.
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  };

  render() {
    return <canvas ref={c => (this.canvas = c)} height="150" width="300" />;
  }
}
