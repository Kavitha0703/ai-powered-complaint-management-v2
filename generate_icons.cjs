const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  const svg = fs.readFileSync('public/logo.svg');
  await sharp(svg).resize(192, 192).toFile('public/logo-192.png');
  await sharp(svg).resize(512, 512).toFile('public/logo-512.png');
  await sharp(svg).resize(32, 32).toFile('public/favicon.ico');
  console.log('Icons generated successfully.');
}
generate().catch(console.error);
