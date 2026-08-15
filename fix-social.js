/**
 * fix-social.js — Fix Facebook/YouTube social links across all HTML files
 *
 * 1. Fix wrong Facebook URLs (discord.gg → correct Facebook URL)
 * 2. Fix wrong YouTube URLs (discord.gg → correct YouTube URL)
 * 3. Fix Facebook/YouTube SVG icons to use fill style
 * 4. Add Facebook + YouTube to index.html footer
 * 5. Add BEM modifiers to social links missing them
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const DRY_RUN = process.argv.includes('--dry-run');

const EXCLUDE = new Set(['404.html', 'testar-pagamento.html', 'preview-municao.html', 'entregar-duas-skins.html']);

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61575489497515';
const YOUTUBE_URL = 'https://www.youtube.com/@MedellinRoleplay';

// Correct Facebook SVG (fill style)
const FB_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';

// Correct YouTube SVG (fill style)
const YT_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';

// Full correct Facebook link element
const FB_FULL = `<a class="footer__social-link footer__social-link--facebook" href="${FACEBOOK_URL}" rel="noopener noreferrer" target="_blank" title="Facebook"><span class="footer__social-icon" aria-hidden="true">${FB_SVG}</span></a>`;

// Full correct YouTube link element
const YT_FULL = `<a class="footer__social-link footer__social-link--youtube" href="${YOUTUBE_URL}" rel="noopener noreferrer" target="_blank" title="YouTube"><span class="footer__social-icon" aria-hidden="true">${YT_SVG}</span></a>`;

let stats = { fixed: 0, indexFixed: false, errors: [] };

function main() {
    console.log(`\n=== Fix Social Links ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

    const allFiles = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && !EXCLUDE.has(f));

    for (const name of allFiles) {
        const filePath = path.join(DIR, name);
        let html = fs.readFileSync(filePath, 'utf-8');
        const original = html;

        if (name === 'index.html') {
            // Special: add Facebook + YouTube after TikTok
            if (!html.includes('title="Facebook"')) {
                // Find the TikTok closing </a> followed by closing </div>
                const tiktokPattern = /(title="TikTok"><span class="footer__social-icon" aria-hidden="true"><svg[^]*?<\/svg><\/span><\/a>)/;
                if (tiktokPattern.test(html)) {
                    html = html.replace(tiktokPattern, '$1\n                        ' + FB_FULL + '\n                        ' + YT_FULL);
                    stats.indexFixed = true;
                } else {
                    stats.errors.push(`index.html: could not find TikTok link`);
                }
            }
        }

        // Fix ALL Facebook links: replace entire <a> element with correct one
        // Match any Facebook <a> element regardless of URL
        const fbPattern = /<a\s+class="footer__social-link[^"]*"\s+href="[^"]*"\s+rel="noopener noreferrer"\s+target="_blank"\s+title="Facebook">[\s\S]*?<\/a>/g;
        html = html.replace(fbPattern, FB_FULL);

        // Fix ALL YouTube links: replace entire <a> element with correct one
        const ytPattern = /<a\s+class="footer__social-link[^"]*"\s+href="[^"]*"\s+rel="noopener noreferrer"\s+target="_blank"\s+title="YouTube">[\s\S]*?<\/a>/g;
        html = html.replace(ytPattern, YT_FULL);

        if (html !== original) {
            if (!DRY_RUN) fs.writeFileSync(filePath, html, 'utf-8');
            console.log(`  ✔ ${name}`);
            stats.fixed++;
        }
    }

    console.log(`\n=== Resultado ===`);
    console.log(`  Arquivos corrigidos: ${stats.fixed}`);
    console.log(`  index.html FB/YT adicionado: ${stats.indexFixed ? 'SIM' : 'NÃO'}`);
    if (stats.errors.length) {
        console.log(`\n  ⚠ Erros: ${stats.errors.length}`);
        stats.errors.forEach(e => console.log(`    - ${e}`));
    }
    console.log('');
}

main();
