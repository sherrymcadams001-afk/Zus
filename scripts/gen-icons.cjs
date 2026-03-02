const sharp = require("sharp");
const path = require("path");

const src = path.join(__dirname, "..", "public", "logo.png");
const outDir = path.join(__dirname, "..", "public");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generate() {
  for (const { name, size } of sizes) {
    const padding = Math.round(size * 0.12);
    const logoSize = size - (padding * 2);
    const resizedLogo = await sharp(src)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 11, g: 16, b: 21, alpha: 1 } })
      .flatten({ background: { r: 11, g: 16, b: 21 } })
      .toBuffer();
    await sharp({ create: { width: size, height: size, channels: 3, background: { r: 11, g: 16, b: 21 } } })
      .composite([{ input: resizedLogo, gravity: "centre" }])
      .removeAlpha()
      .png()
      .toFile(path.join(outDir, name));
    console.log(name, size + "x" + size, "OK");
  }
}
generate().catch(e => { console.error(e); process.exit(1); });
