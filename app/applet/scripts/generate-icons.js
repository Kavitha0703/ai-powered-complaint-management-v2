import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sizes = [16, 32, 48, 64, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024, 2048, 4096];

const svg = `
<svg width="4096" height="4096" viewBox="0 0 4096 4096" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with slight gradient and rounded corners (for the safe zone, but we make the background transparent, and add a rounded rect) -->
  <rect width="4096" height="4096" fill="transparent"/>
  
  <g transform="translate(448, 448) scale(0.78125)"> <!-- ~20% padding -->
    <!-- Safe zone rect: 4096 -> scaled down inside -->
    <rect width="4096" height="4096" rx="800" fill="url(#bg-grad)"/>
    
    <!-- Nodes and Connections -->
    <path d="M1200 2048 L2048 1200 L2896 2048 L2048 2896 Z" stroke="url(#line-grad)" stroke-width="120" stroke-linejoin="round"/>
    
    <!-- Central glowing core -->
    <circle cx="2048" cy="2048" r="400" fill="url(#core-grad)" filter="url(#glow)"/>
    
    <!-- Nodes -->
    <circle cx="1200" cy="2048" r="160" fill="#60A5FA"/>
    <circle cx="2896" cy="2048" r="160" fill="#60A5FA"/>
    <circle cx="2048" cy="1200" r="160" fill="#60A5FA"/>
    <circle cx="2048" cy="2896" r="160" fill="#60A5FA"/>
    
    <!-- Inner details -->
    <path d="M1600 2048 L2048 1600 L2496 2048 L2048 2496 Z" stroke="#FFFFFF" stroke-width="60" stroke-linejoin="round" opacity="0.8"/>
  </g>
  
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="4096" y2="4096" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="line-grad" x1="1200" y1="1200" x2="2896" y2="2896" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <radialGradient id="core-grad" cx="2048" cy="2048" r="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="80" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate favicon.ico (multi-size not strictly needed if we provide pngs, but we'll use 32x32 for ico to be simple, or just rely on pngs. Wait, sharp can't output .ico natively. We will just copy 32x32 to favicon.ico)
  
  for (const size of sizes) {
    const filename = size === 16 ? 'favicon-16x16.png' :
                     size === 32 ? 'favicon-32x32.png' :
                     size === 48 ? 'favicon-48x48.png' :
                     size === 180 ? 'apple-touch-icon.png' :
                     `logo-${size}.png`;
                     
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, filename));
    console.log(`Generated ${filename}`);
  }
  
  // Create a copy for favicon.ico
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');
  
  // Write the master 4096 SVG as well just in case
  fs.writeFileSync(path.join(publicDir, 'master-icon.svg'), svg);
  console.log('Generated master-icon.svg');
}

generateIcons().catch(console.error);
