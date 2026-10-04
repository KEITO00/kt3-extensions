// Bitcrusher: holds each sample for DOWN samples and rounds it to BITS bits.
// The processor name must be "<extension id>/<processor>".
registerProcessor('keito.bitcrusher/crush', class extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bits', defaultValue: 6, minValue: 1, maxValue: 16 },
      { name: 'down', defaultValue: 8, minValue: 1, maxValue: 40 },
      { name: 'mix', defaultValue: 100, minValue: 0, maxValue: 100 },
    ];
  }

  constructor() {
    super();
    this.hold = [0, 0];
    this.count = 0;
  }

  process(inputs, outputs, params) {
    const input = inputs[0], output = outputs[0];
    const step = Math.pow(2, Math.round(params.bits[0]) - 1);
    const down = Math.max(1, Math.round(params.down[0]));
    const mix = params.mix[0] / 100;
    let count = this.count;
    for (let c = 0; c < output.length; c++) {
      const x = input[c] || input[0], y = output[c];
      count = this.count;
      if (!x) { y.fill(0); continue; }
      for (let i = 0; i < y.length; i++) {
        if (count % down === 0) this.hold[c] = Math.round(x[i] * step) / step;
        count++;
        y[i] = x[i] * (1 - mix) + this.hold[c] * mix;
      }
    }
    this.count = count % 1000000;
    return true;
  }
});
