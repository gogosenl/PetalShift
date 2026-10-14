const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const output = path.join(root, "play-store-assets");
const phoneDir = path.join(output, "phone");
const tablet7Dir = path.join(output, "tablet-7");
const tablet10Dir = path.join(output, "tablet-10");
const screenshotRoot = process.argv[2] || process.env.STORE_SCREENSHOT_DIR;

if (!screenshotRoot) {
  throw new Error("Provide the screenshot directory as the first argument or STORE_SCREENSHOT_DIR.");
}

const sources = {
  gameplay: path.join(screenshotRoot, "1.jpeg"),
  home: path.join(screenshotRoot, "WhatsApp Image 2026-07-31 at 10.09.33.jpeg"),
  levels: path.join(screenshotRoot, "2.jpeg"),
  background: path.join(root, "assets", "hd", "botanical-background.png"),
  appIcon: path.join(root, "assets", "hd", "app-icon.png"),
  companyLogo: path.join(root, "assets", "company-logo.png"),
};

for (const directory of [output, phoneDir, tablet7Dir, tablet10Dir]) {
  fs.mkdirSync(directory, { recursive: true });
}

const svg = (width, height, body) => Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${body}
  </svg>
`);

async function cropScreenshot(input, width, height, destination, top = 0) {
  await sharp(input)
    .extract({ left: 0, top, width: 720, height: 1280 })
    .resize(width, height, { fit: "fill" })
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(destination);
}

async function makeIcon() {
  await sharp(sources.appIcon)
    .resize(512, 512, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(path.join(output, "app-icon-512.png"));
}

async function makeFeatureGraphic() {
  const icon = await sharp(sources.appIcon).resize(270, 270).png().toBuffer();
  const company = await sharp(sources.companyLogo).resize(54, 54).png().toBuffer();
  const background = await sharp(sources.background)
    .resize(1024, 500, { fit: "cover", position: "center" })
    .modulate({ brightness: .86, saturation: .86 })
    .blur(.35)
    .toBuffer();
  const design = svg(1024, 500, `
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#163f35" stop-opacity=".92"/>
        <stop offset=".55" stop-color="#163f35" stop-opacity=".82"/>
        <stop offset="1" stop-color="#163f35" stop-opacity=".68"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#shade)"/>
    <rect x="48" y="48" width="928" height="404" rx="42" fill="none" stroke="#f1d98e" stroke-width="4" opacity=".7"/>
    <text x="365" y="190" fill="#fff8e7" font-family="Georgia, serif" font-size="61" font-weight="700">RÜZGÂR KORUSU</text>
    <text x="368" y="245" fill="#f1d98e" font-family="Arial, sans-serif" font-size="25" font-weight="700">Sürükle • Düşün • Bahçeyi Uyandır</text>
    <rect x="368" y="280" width="425" height="2" fill="#f1d98e" opacity=".65"/>
    <text x="368" y="332" fill="#fff8e7" font-family="Arial, sans-serif" font-size="22" font-weight="700">500 özgün bölüm • 10 bahçe katmanı</text>
    <text x="835" y="414" fill="#fff8e7" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">GÖRSEN GAMES</text>
  `);
  await sharp(background)
    .composite([
      { input: design, left: 0, top: 0 },
      { input: icon, left: 72, top: 115 },
      { input: company, left: 765, top: 379 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(path.join(output, "feature-graphic-1024x500.jpg"));
}

async function makePromoScreenshot() {
  const background = await sharp(sources.background)
    .resize(1080, 1920, { fit: "cover" })
    .modulate({ brightness: .72, saturation: .75 })
    .blur(1)
    .toBuffer();
  const icon = await sharp(sources.appIcon).resize(170, 170).png().toBuffer();
  const thumbs = await Promise.all(
    [sources.home, sources.gameplay, sources.levels].map((source) =>
      sharp(source)
        .extract({ left: 0, top: 0, width: 720, height: 1280 })
        .resize(280, 625)
        .jpeg({ quality: 91 })
        .toBuffer(),
    ),
  );
  const design = svg(1080, 1920, `
    <rect width="1080" height="1920" fill="#173f35" opacity=".77"/>
    <text x="540" y="360" text-anchor="middle" fill="#fff8e7" font-family="Georgia, serif" font-size="78" font-weight="700">Rüzgâr Korusu</text>
    <text x="540" y="445" text-anchor="middle" fill="#f1d98e" font-family="Arial, sans-serif" font-size="34" font-weight="700">Her esinti yeni bir yol açar</text>
    <rect x="62" y="622" width="296" height="641" rx="28" fill="#fff8e7" stroke="#e5c45a" stroke-width="7"/>
    <rect x="392" y="622" width="296" height="641" rx="28" fill="#fff8e7" stroke="#e5c45a" stroke-width="7"/>
    <rect x="722" y="622" width="296" height="641" rx="28" fill="#fff8e7" stroke="#e5c45a" stroke-width="7"/>
    <text x="540" y="1445" text-anchor="middle" fill="#fff8e7" font-family="Arial, sans-serif" font-size="48" font-weight="800">500 BÖLÜM • 10 KATMAN</text>
    <text x="540" y="1520" text-anchor="middle" fill="#f1d98e" font-family="Arial, sans-serif" font-size="31" font-weight="700">Sıraları kaydır, desenleri tamamla</text>
    <text x="540" y="1790" text-anchor="middle" fill="#fff8e7" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="5">GÖRSEN GAMES</text>
  `);
  await sharp(background)
    .composite([
      { input: design, left: 0, top: 0 },
      { input: icon, left: 455, top: 110 },
      { input: thumbs[0], left: 70, top: 630 },
      { input: thumbs[1], left: 400, top: 630 },
      { input: thumbs[2], left: 730, top: 630 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
    .toFile(path.join(phoneDir, "04-500-bolum.jpg"));
}

async function main() {
  await makeIcon();
  await makeFeatureGraphic();

  const ordered = [
    ["01-ana-ekran.jpg", sources.home, 60],
    ["02-oynanis.jpg", sources.gameplay, 0],
    ["03-bolumler.jpg", sources.levels, 0],
  ];

  for (const [name, source, top] of ordered) {
    await cropScreenshot(source, 1080, 1920, path.join(phoneDir, name), top);
    await cropScreenshot(source, 1080, 1920, path.join(tablet7Dir, name), top);
    await cropScreenshot(source, 1440, 2560, path.join(tablet10Dir, name), top);
  }

  await makePromoScreenshot();
  console.log(`Google Play assets created in ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
