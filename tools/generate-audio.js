const fs = require("fs");
const path = require("path");

const sampleRate = 22050;
const outputDir = path.join(__dirname, "..", "assets", "audio");

function wav(name, duration, generator) {
  const frames = Math.floor(sampleRate * duration);
  const dataSize = frames * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < frames; index += 1) {
    const time = index / sampleRate;
    const sample = Math.max(-1, Math.min(1, generator(time, duration)));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  fs.writeFileSync(path.join(outputDir, name), buffer);
}

const sine = (frequency, time, phase = 0) => Math.sin(Math.PI * 2 * frequency * time + phase);
const triangle = (frequency, time) => (2 / Math.PI) * Math.asin(sine(frequency, time));
const envelope = (time, duration, attack = .02, release = .15) =>
  Math.min(1, time / attack) * Math.min(1, (duration - time) / release);

fs.mkdirSync(outputDir, { recursive: true });

wav("garden-loop.wav", 16, (time) => {
  const chordRoots = [220, 196, 174.61, 196];
  const chord = Math.floor(time / 4) % 4;
  const root = chordRoots[chord];
  const local = time % 4;
  const pad = sine(root, time) * .055 + sine(root * 1.5, time) * .038 + sine(root * 2, time) * .022;
  const notes = [1, 1.5, 2, 1.5, 1.25, 1.5, 2.5, 2];
  const noteIndex = Math.floor(local * 2) % notes.length;
  const noteTime = (local * 2) % 1 / 2;
  const pluckEnv = Math.exp(-noteTime * 7) * Math.min(1, noteTime / .018);
  const pluck = (sine(root * notes[noteIndex], time) + triangle(root * notes[noteIndex] * 2, time) * .22) * pluckEnv * .085;
  const breeze = sine(.11, time) * sine(880, time) * .004;
  return pad + pluck + breeze;
});

wav("slide.wav", .32, (time, duration) => {
  const progress = time / duration;
  const frequency = 260 + progress * 190;
  return (sine(frequency, time) * .12 + triangle(frequency * .5, time) * .04)
    * envelope(time, duration, .012, .12) * (1 - progress * .45);
});

wav("settle.wav", .38, (time, duration) => {
  const body = sine(330, time) * .15 + sine(495, time) * .08;
  return body * envelope(time, duration, .006, .3) * Math.exp(-time * 7);
});

wav("hint.wav", .72, (time, duration) => {
  const notes = [659.25, 783.99, 987.77];
  let value = 0;
  notes.forEach((frequency, index) => {
    const start = index * .14;
    const local = time - start;
    if (local >= 0) value += sine(frequency, local) * Math.exp(-local * 5.5) * .12;
  });
  return value * envelope(time, duration, .008, .18);
});

wav("complete.wav", 1.75, (time, duration) => {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  let value = 0;
  notes.forEach((frequency, index) => {
    const start = index * .22;
    const local = time - start;
    if (local >= 0) {
      value += (sine(frequency, local) + sine(frequency * 2, local) * .18)
        * Math.exp(-local * 2.7) * .105;
    }
  });
  return value * envelope(time, duration, .01, .35);
});

wav("reward.wav", .9, (time, duration) => {
  const sparkle = sine(880, time) * .08 + sine(1320, time) * .055 + sine(1760, time) * .025;
  return sparkle * envelope(time, duration, .008, .38) * Math.exp(-time * 3.2);
});

wav("transition.wav", .55, (time, duration) => {
  const progress = time / duration;
  return (sine(180 + progress * 420, time) * .085 + sine(360 + progress * 520, time) * .035)
    * envelope(time, duration, .025, .2);
});

wav("button.wav", .16, (time, duration) => {
  const click = sine(520, time) * .11 + sine(780, time) * .055;
  return click * envelope(time, duration, .004, .11) * Math.exp(-time * 15);
});

wav("drag.wav", .42, (time, duration) => {
  const progress = time / duration;
  const breeze = sine(210 + progress * 125, time) * .075;
  const texture = triangle(420 + progress * 180, time) * .025;
  return (breeze + texture) * envelope(time, duration, .02, .16) * (1 - progress * .35);
});

console.log(`Generated audio assets in ${outputDir}`);
