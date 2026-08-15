/**
 * Converte PNG e JPG na pasta assets/ para WebP (mesma estrutura).
 * Rode: npm run convert-webp   (na raiz do vip-store-web)
 * Depois suba os .webp para o R2 com _upload-r2-temp.ps1 (ou UPLOAD-R2-ASSETS.bat).
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const EXT = ['.png', '.jpg', '.jpeg'];
const WEBP_QUALITY = 85;

function walkDir(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full, list);
    else if (EXT.includes(path.extname(e.name).toLowerCase())) list.push(full);
  }
  return list;
}

async function main() {
  const files = walkDir(ASSETS);
  if (files.length === 0) {
    console.log('Pasta assets/ nao encontrada ou sem PNG/JPG.');
    return;
  }
  console.log('Convertendo', files.length, 'imagens para WebP (qualidade', WEBP_QUALITY + ')...');
  let ok = 0, err = 0;
  for (const file of files) {
    const ext = path.extname(file);
    const out = file.slice(0, -ext.length) + '.webp';
    try {
      await sharp(file)
        .webp({ quality: WEBP_QUALITY })
        .toFile(out);
      const inK = (fs.statSync(file).size / 1024).toFixed(1);
      const outK = (fs.statSync(out).size / 1024).toFixed(1);
      console.log('  OK', path.relative(ASSETS, out), '-', inK, 'KB ->', outK, 'KB');
      ok++;
    } catch (e) {
      console.error('  ERRO', path.relative(ASSETS, file), e.message);
      err++;
    }
  }
  console.log('Pronto:', ok, 'WebP gerados.', err ? err + ' erros.' : '');
}

main().catch((e) => { console.error(e); process.exit(1); });
