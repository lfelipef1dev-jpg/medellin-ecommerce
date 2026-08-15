/**
 * Minifica CSS para reduzir payload (~3 KiB economia em transferência).
 * Usa clean-css se instalado; senão fallback com regex.
 * Uso: node scripts/minify-css.js [arquivo.css]
 * Deploy: minifica _deploy_temp_pages/style.css
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'style.css');

if (!fs.existsSync(file)) {
  console.error('Arquivo não encontrado:', file);
  process.exit(1);
}

let css = fs.readFileSync(file, 'utf8');

function simpleMinify(css) {
  css = css.replace(/\/\*(?!\!)[\s\S]*?\*\//g, '');
  css = css.replace(/\s+/g, ' ');
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');
  css = css.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3(?![0-9a-fA-F])/g, '#$1$2$3');
  css = css.replace(/\b0(?:px|rem|em|pt|ex|ch|vh|vw|vmin|vmax)\b/g, '0');
  css = css.replace(/;}/g, '}');
  return css.trim();
}

try {
  const CleanCSS = require('clean-css');
  const out = new CleanCSS({ level: 2 }).minify(css);
  if (out.errors && out.errors.length) throw new Error(out.errors[0]);
  css = out.styles;
} catch (_) {
  css = simpleMinify(css);
}

fs.writeFileSync(file, css, 'utf8');
console.log('OK minificado:', file, '(' + (Buffer.byteLength(css, 'utf8') / 1024).toFixed(1) + ' KiB)');
