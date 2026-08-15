/**
 * Gera versões redimensionadas para LCP e cards VIP.
 * - Hero: 1200w → medellin-banner-hero-1200.webp
 * - Cards VIP (exibidos 547px): 600w e 1100w → vips/vip-*-600.webp, vip-*-1100.webp
 * Rode: npm run responsive
 * Depois suba os novos .webp para o R2 (UPLOAD-R2-ASSETS.bat ou _upload-r2-temp.ps1).
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const HERO_WIDTH = 1200;
const CARD_WIDTH = 1100;
const CARD_WIDTH_SMALL = 600; // exibição 547px → 600w evita oversize (~258 KiB economia)
const WEBP_QUALITY = 85;

const HERO_SOURCE = path.join(ASSETS, 'medellin-banner-hero.webp');
const HERO_OUT = path.join(ASSETS, 'medellin-banner-hero-1200.webp');

const VIP_CARDS = [
  'vip-black.webp',
  'vip-platinum.webp',
  'vip-black-assinatura.webp',
  'vip-platinum-assinatura.webp',
  'vip-prata.webp',
  'vip-prata-assinatura.webp',
  'vip-policia.webp',
  'vip-policia-assinatura.webp',
  'vip-ouro-assinatura.webp',
  'vip-ouro-permanente.webp',
];

const VOUCHER_CARDS = [
  'vale-casa-emerald.webp',
  'vale-casa-diamond.webp',
  'vale-casa-ruby.webp',
  'vale-casa-sapphire.webp',
  'vale-casa-amethyst.webp',
];

const MOD_CARDS = ['telao.webp'];

async function main() {
  let ok = 0, err = 0;

  if (fs.existsSync(HERO_SOURCE)) {
    try {
      await sharp(HERO_SOURCE)
        .resize(HERO_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(HERO_OUT);
      console.log('  OK medellin-banner-hero-1200.webp');
      ok++;
    } catch (e) {
      console.error('  ERRO hero', e.message);
      err++;
    }
  } else {
    console.log('  (pulando hero: medellin-banner-hero.webp não encontrado)');
  }

  const vipsDir = path.join(ASSETS, 'vips');
  if (!fs.existsSync(vipsDir)) {
    console.log('  (pasta assets/vips não encontrada)');
  } else {
    for (const name of VIP_CARDS) {
      const src = path.join(vipsDir, name);
      const base = name.replace(/\.webp$/, '');
      if (!fs.existsSync(src)) {
        console.log('  (pulando', name + ': não encontrado)');
        continue;
      }
      for (const [w, label] of [[CARD_WIDTH_SMALL, '600'], [CARD_WIDTH, '1100']]) {
        const out = path.join(vipsDir, base + '-' + label + '.webp');
        try {
          await sharp(src)
            .resize(w, w, { fit: 'cover', withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(out);
          console.log('  OK vips/' + base + '-' + label + '.webp');
          ok++;
        } catch (e) {
          console.error('  ERRO', name, label, e.message);
          err++;
        }
      }
    }
  }

  async function processCardDir(dirName, files) {
    const dir = path.join(ASSETS, dirName);
    if (!fs.existsSync(dir)) return;
    for (const name of files) {
      const src = path.join(dir, name);
      const base = name.replace(/\.webp$/, '');
      if (!fs.existsSync(src)) continue;
      for (const [w, label] of [[CARD_WIDTH_SMALL, '600'], [CARD_WIDTH, '1100']]) {
        const out = path.join(dir, base + '-' + label + '.webp');
        try {
          await sharp(src)
            .resize(w, w, { fit: 'cover', withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(out);
          console.log('  OK ' + dirName + '/' + base + '-' + label + '.webp');
          ok++;
        } catch (e) {
          console.error('  ERRO', dirName, name, label, e.message);
          err++;
        }
      }
    }
  }

  await processCardDir('vouchers', VOUCHER_CARDS);
  await processCardDir('modificacoes', MOD_CARDS);

  console.log('Pronto:', ok, 'imagens responsivas geradas.', err ? err + ' erros.' : '');
}

main().catch((e) => { console.error(e); process.exit(1); });
