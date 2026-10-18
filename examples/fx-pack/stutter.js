// Stutter: from the next beat, records LEN of the sound and repeats it while the effect is on.
// LEN 1-4 = 1/8, 1/4, 1/2 and 1 beat. The beat comes from processorOptions.transport.
const LENS = [1 / 8, 1 / 4, 1 / 2, 1];
const MAX_SECONDS = 4;
const FADE = 64;

registerProcessor('keito.fx-pack/stutter', class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'len', defaultValue: 2, minValue: 1, maxValue: 4 },
      { name: 'mix', defaultValue: 100, minValue: 0, maxValue: 100 },
      { name: 'rev', defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }

  constructor(options) {
    super();
    this.t = new Float64Array(options.processorOptions.transport);
    this.buf = [new Float32Array(sampleRate * MAX_SECONDS), new Float32Array(sampleRate * MAX_SECONDS)];
    this.lastFrame = -Infinity;
    this.reset();
  }

  reset() {
    this.state = 'wait';
    this.size = 0;
    this.n = 0;
    this.read = 0;
  }

  process(inputs, outputs, params) {
    const input = inputs[0], output = outputs[0], N = output[0].length, t = this.t;
    // process() is not called while the effect is OFF, so a gap in currentFrame means it was just turned on.
    if (currentFrame - this.lastFrame > N * 4) this.reset();
    this.lastFrame = currentFrame;

    const rate = Math.abs(t[2]), beat = 60 / (t[4] || 120), first = t[5];
    const mix = params.mix[0] / 100, rev = params.rev[0] >= 0.5;
    const len = LENS[Math.max(0, Math.min(3, Math.round(params.len[0]) - 1))];
    const L = input[0], R = input[1] || input[0];
    const step = rate / sampleRate;
    let pos = t[1] - step * N;

    for (let i = 0; i < N; i++, pos += step) {
      const xl = L ? L[i] : 0, xr = R ? R[i] : 0;
      let yl = xl, yr = xr;
      if (this.state === 'wait' && t[3] && rate > 0.01 && Math.floor((pos + step - first) / beat) > Math.floor((pos - first) / beat)) {
        this.state = 'rec';
        this.n = 0;
        this.size = Math.min(this.buf[0].length, Math.round(len * beat / rate * sampleRate));
      }
      if (this.state === 'rec') {
        this.buf[0][this.n] = xl;
        this.buf[1][this.n] = xr;
        if (++this.n >= this.size) { this.state = 'loop'; this.read = 0; }
      } else if (this.state === 'loop') {
        const k = rev ? this.size - 1 - this.read : this.read;
        const fade = Math.min(1, this.read / FADE, (this.size - this.read) / FADE);
        yl = this.buf[0][k] * fade;
        yr = this.buf[1][k] * fade;
        if (++this.read >= this.size) this.read = 0;
      }
      output[0][i] = xl + (yl - xl) * mix;
      if (output[1]) output[1][i] = xr + (yr - xr) * mix;
    }
    return true;
  }
});
