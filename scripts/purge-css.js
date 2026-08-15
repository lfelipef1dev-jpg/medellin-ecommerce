/**
 * Remove CSS não usado (PurgeCSS) usando os HTML da pasta como referência.
 * Uso: node scripts/purge-css.js [pasta]
 * Deploy: roda em _deploy_temp_pages antes de minify-css.
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const cssPath = path.join(dir, 'style.css');

if (!fs.existsSync(cssPath)) {
  console.error('style.css não encontrado em', dir);
  process.exit(1);
}

const htmlFiles = fs.readdirSync(dir)
  .filter(function (f) { return f.endsWith('.html'); })
  .map(function (f) { return path.join(dir, f); });

if (htmlFiles.length === 0) {
  process.exit(0);
}

(async function () {
  try {
    const { PurgeCSS } = require('purgecss');
    const purgecss = new PurgeCSS();
    const result = await purgecss.purge({
      content: htmlFiles,
      css: [{ raw: fs.readFileSync(cssPath, 'utf8') }],
      safelist: [
        'is-active', 'is-open', 'hidden', 'card--hidden',
        /^store-sidebar/, /^cat-menu/, /^store-cats/
      ]
    });
    if (result[0] && result[0].css != null) {
      fs.writeFileSync(cssPath, result[0].css, 'utf8');
      console.log('OK purge:', cssPath, '(' + (Buffer.byteLength(result[0].css, 'utf8') / 1024).toFixed(1) + ' KiB)');
    }
  } catch (e) {
    console.error('PurgeCSS:', e.message);
    process.exit(1);
  }
})();
