export function themeUrl(theme, chapter, current = location.href) {
 const url = new URL(current);
 url.pathname = theme === 'dossier' ? '/dossier/' : '/';
 url.searchParams.set('theme', theme);
 url.hash = ({work:'market-plus', atelier:'livre', chrome:'home', parcours:theme==='dossier'?'parcours':'about', competences:theme==='dossier'?'competences':'about'})[chapter] || chapter;
 return url.pathname + url.search + url.hash;
}

export function themeSwitch() {
 const links = document.querySelectorAll('.theme-switch a');
 let previous;
 return chapter => {
  if (chapter === previous) return;
  previous = chapter;
  for (const link of links) link.href = themeUrl(link.dataset.themeChoice, chapter);
 };
}
