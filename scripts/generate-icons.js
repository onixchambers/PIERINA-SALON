const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAllPwaIcons() {
  const logoPath = path.join(__dirname, '..', 'public', 'logo-pierina.png');
  const iconDir = path.join(__dirname, '..', 'public', 'icons');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  console.log('Generating PWA icons from:', logoPath);

  // 1. icon-192.png (any)
  await sharp(logoPath)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconDir, 'icon-192.png'));

  // 2. icon-512.png (any)
  await sharp(logoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconDir, 'icon-512.png'));

  // 3. icon-maskable-192.png (with soft cream/nude background #FAF6F0 and safe padding for Android)
  const inner192 = await sharp(logoPath)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 250, g: 246, b: 240, alpha: 1 }, // #FAF6F0
    },
  })
    .composite([{ input: inner192, gravity: 'center' }])
    .png()
    .toFile(path.join(iconDir, 'icon-maskable-192.png'));

  // 4. icon-maskable-512.png (with soft cream/nude background #FAF6F0)
  const inner512 = await sharp(logoPath)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 250, g: 246, b: 240, alpha: 1 }, // #FAF6F0
    },
  })
    .composite([{ input: inner512, gravity: 'center' }])
    .png()
    .toFile(path.join(iconDir, 'icon-maskable-512.png'));

  // 5. apple-touch-icon.png (180x180 for iOS)
  const inner180 = await sharp(logoPath)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 250, g: 246, b: 240, alpha: 1 }, // #FAF6F0
    },
  })
    .composite([{ input: inner180, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 6. favicon.png (64x64)
  await sharp(logoPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All Pierina Salón PWA icons generated successfully!');
}

generateAllPwaIcons().catch(console.error);
