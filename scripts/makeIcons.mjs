// One-off icon generator: node scripts/makeIcons.mjs <source-image>
// Center-crops the source to a square and emits all PWA icon sizes into public/.
import sharp from 'sharp';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/makeIcons.mjs <source-image>');
  process.exit(1);
}

const outputs = [
  { file: 'public/pwa-512.png', size: 512 },
  { file: 'public/pwa-192.png', size: 192 },
  { file: 'public/apple-touch-icon.png', size: 180 },
];

for (const { file, size } of outputs) {
  await sharp(source).resize(size, size, { fit: 'cover' }).png().toFile(file);
  console.log(`wrote ${file} (${size}x${size})`);
}
