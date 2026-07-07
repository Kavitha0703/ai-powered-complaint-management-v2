const fs = require('fs');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" /> <!-- Violet 500 -->
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" /> <!-- Blue 500 -->
    </linearGradient>
    <linearGradient id="ai-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" /> <!-- Violet 400 -->
      <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:1" /> <!-- Blue 400 -->
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#020617" /> <!-- Slate 950 -->

  <!-- Outer Ring -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#ai-grad)" stroke-width="6" opacity="0.4" stroke-dasharray="15 30" />

  <!-- Neural Network / AI Brain nodes -->
  <g>
    <!-- Connecting Lines -->
    <path d="M256 160 L320 220 L280 320 L200 300 L180 200 Z" fill="none" stroke="url(#ai-grad-light)" stroke-width="8" opacity="0.9" stroke-linejoin="round" />
    <path d="M256 256 L256 160 M256 256 L320 220 M256 256 L280 320 M256 256 L200 300 M256 256 L180 200" stroke="url(#ai-grad-light)" stroke-width="6" opacity="0.8" />
    
    <!-- Central AI Core -->
    <circle cx="256" cy="256" r="36" fill="url(#ai-grad)" />
    <circle cx="256" cy="256" r="18" fill="#ffffff" />
    
    <!-- Nodes -->
    <circle cx="256" cy="160" r="16" fill="#60a5fa" />
    <circle cx="320" cy="220" r="14" fill="#a78bfa" />
    <circle cx="280" cy="320" r="18" fill="#3b82f6" />
    <circle cx="200" cy="300" r="16" fill="#8b5cf6" />
    <circle cx="180" cy="200" r="14" fill="#60a5fa" />
  </g>
  
  <!-- Outer Orbiting Nodes -->
  <circle cx="256" cy="76" r="10" fill="#a78bfa" />
  <circle cx="400" cy="360" r="8" fill="#3b82f6" />
  <circle cx="112" cy="320" r="12" fill="#8b5cf6" />
</svg>`;

fs.writeFileSync('public/logo.svg', svgContent);

async function generate() {
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile('public/logo-192.png');
    
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile('public/logo-512.png');
    
  console.log("Icons generated successfully.");
}

generate().catch(console.error);
