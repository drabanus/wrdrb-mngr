import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, '..', 'static');
const svgPath = join(staticDir, 'favicon.svg');
const svgBuffer = readFileSync(svgPath);

// Generate PNG icons at various sizes
async function generatePngs() {
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 }
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(staticDir, name));
    console.log(`Generated ${name}`);
  }
}

// Generate ICO file (contains 16x16, 32x32, 48x48 PNGs packed into ICO format)
async function generateIco() {
  const sizes = [16, 32, 48];
  const images = [];

  for (const size of sizes) {
    const png = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    images.push({ size, data: png });
  }

  // ICO file format
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);       // reserved
  header.writeUInt16LE(1, 2);       // type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // number of images

  const dirEntries = [];
  const imageDataParts = [];
  let offset = 6 + images.length * 16; // header + directory entries

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size < 256 ? img.size : 0, 0);   // width
    entry.writeUInt8(img.size < 256 ? img.size : 0, 1);   // height
    entry.writeUInt8(0, 2);           // color palette
    entry.writeUInt8(0, 3);           // reserved
    entry.writeUInt16LE(1, 4);        // color planes
    entry.writeUInt16LE(32, 6);       // bits per pixel
    entry.writeUInt32LE(img.data.length, 8);  // image data size
    entry.writeUInt32LE(offset, 12);  // offset to image data
    dirEntries.push(entry);
    imageDataParts.push(img.data);
    offset += img.data.length;
  }

  const ico = Buffer.concat([header, ...dirEntries, ...imageDataParts]);
  writeFileSync(join(staticDir, 'favicon.ico'), ico);
  console.log('Generated favicon.ico');
}

await generatePngs();
await generateIco();
console.log('All icons generated successfully.');
