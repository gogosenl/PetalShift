const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const generatedRoot = process.argv[2] || process.env.GENERATED_IMAGES_DIR;
if (!generatedRoot) {
  throw new Error("Provide the generated image directory as the first argument or GENERATED_IMAGES_DIR.");
}
const outputRoot = path.join(__dirname, "..", "assets", "ui-v4");

const icons = {
  "icon-currency-leaf.png": "call_FSQcvEp8D5RyQs1TtIxnWreT.png",
  "icon-levels.png": "call_kB6GSdtbMUuEq0E6sfVHyx0k.png",
  "icon-shop.png": "call_81v3BRZBbwtGTRwCARH9SCSj.png",
  "icon-settings.png": "call_0VfLxCy9VSlrX2NB0fDFHy9x.png",
};

async function extractIcon(source, destination) {
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);

  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const sourceOffset = pixel * 3;
    const targetOffset = pixel * 4;
    const red = data[sourceOffset];
    const green = data[sourceOffset + 1];
    const blue = data[sourceOffset + 2];
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    // Image generation previews use a neutral checkerboard. Colorfulness
    // separates the cream/green handcrafted icon from that neutral backdrop.
    const calculatedAlpha = Math.max(0, Math.min(255, Math.round(((chroma - 12) / 16) * 255)));
    const alpha = calculatedAlpha < 24 ? 0 : calculatedAlpha;
    rgba[targetOffset] = red;
    rgba[targetOffset + 1] = green;
    rgba[targetOffset + 2] = blue;
    rgba[targetOffset + 3] = alpha;
  }

  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize(420, 420, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 46,
      bottom: 46,
      left: 46,
      right: 46,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(destination);
}

async function main() {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const [destinationName, sourceName] of Object.entries(icons)) {
    await extractIcon(
      path.join(generatedRoot, sourceName),
      path.join(outputRoot, destinationName),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
