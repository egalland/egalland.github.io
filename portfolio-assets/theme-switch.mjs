export function themeUrl(theme, chapter, current = location.href) {
 const url = new URL(current);
 url.pathname = '/';
 url.searchParams.set('theme', theme);
 url.hash = ({work:'market-plus', atelier:'livre', chrome:'home'})[chapter] || chapter;
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
