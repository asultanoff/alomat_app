class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this.port.onmessage = this.onmessage.bind(this);
  }

  onmessage(event) {
    if (event.data.command === "stop") {
      this.port.postMessage(this._buffer);
      this._buffer = [];
    }
  }

  process(inputs) {
    this._buffer.push(inputs[0][0].slice(0));
    return true;
  }
}

registerProcessor("worklet-processor", RecorderProcessor);
