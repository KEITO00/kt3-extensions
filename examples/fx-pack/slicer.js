// Slicer: cuts the sound on and off in 16th notes. The pattern is locked to the beat of the track,
// so it stays in time after seeking or changing the pitch.
const PATTERNS = [
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
];

registerProcessor('keito.fx-pack/slicer', class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'pattern', defaultValue: 1, minValue: 1, maxValue: 4 },
      { name: 'depth', defaultValue: 100, minValue: 0, maxValue: 100 },
      { name: 'smooth', defaultValue: 4, minValue: 1, maxValue: 30 },
    ];
  }

  constructor(options) {
    super();
    this.t = new Float64Array(options.processorOptions.transport);
    this.gain = 1;
  }

  process(inputs, outputs, params) {
    const input = inputs[0], output = outputs[0], N = output[0].length, t = this.t;
    const beat = 60 / (t[4] || 120), first = t[5], step = t[2] / sampleRate;
    const pattern = PATTERNS[Math.max(0, Math.min(3, Math.round(params.pattern[0]) - 1))];
    const depth = params.depth[0] / 100;
    const k = 1 - Math.exp(-1 / (params.smooth[0] / 1000 * sampleRate));
    let pos = t[1] - step * N;

    for (let i = 0; i < N; i++, pos += step) {
      const s = Math.floor((pos - first) / beat * 4);
      const target = pattern[((s % 16) + 16) % 16] ? 1 : 1 - depth;
      this.gain += (target - this.gain) * k;
      for (let c = 0; c < output.length; c++) {
        const x = input[c] || input[0];
        output[c][i] = x ? x[i] * this.gain : 0;
      }
    }
    return true;
  }
});
