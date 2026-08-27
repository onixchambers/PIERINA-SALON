const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\Bryan\\.gemini\\antigravity\\brain\\94004059-0bb0-4ba7-a7db-9666153790c1\\.user_uploaded\\media_1787835765307.jpg';
const outputDir = path.join(__dirname, 'public');

async function processLogoWithPinkBorder() {
  console.log('Processing logo with pink border...');
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Find white ring boundary
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r > 160 && g > 160 && b > 160) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const innerRadius = Math.max((maxX - minX) / 2, (maxY - minY) / 2) + 1;
  const borderWidth = 12; // Ancho del borde rosado
  const outerRadius = innerRadius + borderWidth;

  // Color rosado elegante: RGB (212, 106, 133) / Hex #D46A85 a (184, 93, 117) / Hex #B85D75
  const pinkR = 212;
  const pinkG = 106;
  const pinkB = 133;

  const circleRgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const destIdx = (y * width + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      if (dist <= innerRadius) {
        // Dentro del círculo original (negro con letras blancas)
        circleRgba[destIdx] = r;
        circleRgba[destIdx + 1] = g;
        circleRgba[destIdx + 2] = b;
        circleRgba[destIdx + 3] = 255;
      } else if (dist <= outerRadius) {
        // En el anillo del borde rosado con degradado y antialiasing
        const ratio = (dist - innerRadius) / borderWidth;
        // Gradiente suave de rosa intenso #D46A85 a rosa oro #E07A5F
        circleRgba[destIdx] = Math.round(pinkR * (1 - ratio * 0.2) + 224 * (ratio * 0.2));
        circleRgba[destIdx + 1] = Math.round(pinkG * (1 - ratio * 0.2) + 122 * (ratio * 0.2));
        circleRgba[destIdx + 2] = Math.round(pinkB * (1 - ratio * 0.2) + 95 * (ratio * 0.2));
        circleRgba[destIdx + 3] = 255;
      } else if (dist <= outerRadius + 2) {
        // Antialiasing exterior del borde rosado
        const alpha = Math.max(0, Math.min(255, Math.round((1 - (dist - outerRadius) / 2) * 255)));
        circleRgba[destIdx] = pinkR;
        circleRgba[destIdx + 1] = pinkG;
        circleRgba[destIdx + 2] = pinkB;
        circleRgba[destIdx + 3] = alpha;
      } else {
        // Fondo 100% transparente
        circleRgba[destIdx + 3] = 0;
      }
    }
  }

  // Crop tightly around the circle + border
  const cropSize = Math.ceil(outerRadius * 2) + 16;
  const cropLeft = Math.max(0, Math.floor(centerX - outerRadius - 8));
  const cropTop = Math.max(0, Math.floor(centerY - outerRadius - 8));

  await sharp(circleRgba, { raw: { width, height, channels: 4 } })
    .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'logo-pierina.png'));

  console.log('Saved logo-pierina.png with pink border!');
}

processLogoWithPinkBorder().catch(console.error);
