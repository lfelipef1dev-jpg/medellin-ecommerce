/**
 * Minifica JavaScript para reduzir payload (~2,5 KiB em app.js).
 * Uso: node scripts/minify-js.js [arquivo.js ou pasta]
 * Deploy: minifica .js na pasta _deploy_temp_pages (exceto data/)
 */
const fs = require('fs');
const path = require('path');

const target = process.argv[2] || path.join(__dirname, '..');

function minifyFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  try {
    const Terser = require('terser');
    const result = Terser.minify_sync(code, {
      compress: { passes: 2 },
      mangle: true,
      format: { comments: false }
    });
    if (result.error) throw result.error;
    if (result.code == null) throw new Error('No output');
    code = result.code;
  } catch (_) {
    return false;
  }
  fs.writeFileSync(filePath, code, 'utf8');
  return true;
}

let ok = 0;
const stat = fs.statSync(target);

if (stat.isFile()) {
  if (target.endsWith('.js')) {
    if (minifyFile(target)) ok++;
  }
} else {
  const files = fs.readdirSync(target).filter(function (f) {
    return f.endsWith('.js') && !f.startsWith('.');
  });
  files.forEach(function (f) {
    const full = path.join(target, f);
    if (fs.statSync(full).isFile() && minifyFile(full)) ok++;
  });
}

console.log('OK minificado:', ok, 'arquivo(s) JS.');
