import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

copyFileSync('src/index.template.html', 'site/index.html');
copyFileSync('styles.css', 'site/styles.css');
copyFileSync('favicon.svg', 'site/favicon.svg');

// Script autonome après le DOM : corrige le problème d'ouverture de la V1.
const html = readFileSync('src/index.template.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const js = readFileSync('site/main.js', 'utf8');
const favicon = readFileSync('favicon.svg').toString('base64');
let standalone = html
  .replace('<link rel="icon" href="./favicon.svg" type="image/svg+xml" />', `<link rel="icon" href="data:image/svg+xml;base64,${favicon}" type="image/svg+xml" />`)
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n</style>`)
  .replace('  <script type="module" src="./main.js"></script>\n', '');
if (!standalone.includes('</body>')) throw new Error('Balise </body> manquante.');
standalone = standalone.replace('</body>', `  <script>\n${js.replaceAll('</script', '<\\/script')}\n</script>\n</body>`);
writeFileSync('index.html', standalone, 'utf8');
console.log('Site statique et HTML autonome prêts.');
