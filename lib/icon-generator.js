const fs = require('fs');
const path = require('path');

// SVG de base pour ChantierPro - icône simple bâtiment/construction
const baseSVG = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Arrière-plan -->
  <rect width="512" height="512" fill="url(#bg)" rx="80"/>
  
  <!-- Bâtiment principal -->
  <rect x="160" y="180" width="192" height="252" fill="#ffffff" opacity="0.95"/>
  
  <!-- Toit -->
  <polygon points="140,180 256,120 372,180" fill="#ffffff"/>
  
  <!-- Fenêtres -->
  <rect x="180" y="220" width="40" height="40" fill="#2563eb"/>
  <rect x="292" y="220" width="40" height="40" fill="#2563eb"/>
  <rect x="180" y="300" width="40" height="40" fill="#2563eb"/>
  <rect x="292" y="300" width="40" height="40" fill="#2563eb"/>
  
  <!-- Porte -->
  <rect x="236" y="350" width="40" height="82" fill="#1d4ed8"/>
  
  <!-- Logo CP -->
  <text x="256" y="160" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#ffffff">CP</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Pour chaque taille, créer un fichier SVG adapté puis le convertir
sizes.forEach(size => {
  const fileName = `icon-${size}x${size}.png`;
  const filePath = path.join(iconsDir, fileName);
  
  // Créer SVG avec la bonne taille
  const svg = baseSVG.replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(svgPath, svg);
  
  console.log(`Créé: ${fileName}`);
});

// Créer aussi un favicon.ico basique
const faviconSVG = baseSVG.replace('viewBox="0 0 512 512"', 'viewBox="0 0 512 512" width="32" height="32"');
fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), faviconSVG);

console.log('Génération des icônes terminée');
console.log('Note: Pour convertir les SVG en PNG, utilisez un outil comme ImageMagick ou Sharp');
console.log('Commande ImageMagick : convert icon.svg -resize 192x192 icon-192x192.png');