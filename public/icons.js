const paths={
 gamepad:'<path d="M7 7h10c2 0 3 1 4 5l1 5c0 2-2 3-4 1l-2-2H8l-2 2c-2 2-4 1-4-1l1-5c1-4 2-5 4-5zM8 10v4m-2-2h4"/><path d="M16 10h.01m2 3h.01" stroke-width="3"/>',
 map:'<path d="m2 5 7-2 6 3 7-2v15l-7 2-6-3-7 2zm7-2v15m6-12v15"/>',
 people:'<circle cx="9" cy="7" r="3.4"/><path d="M2 20v-2c0-3.5 3-5.5 7-5.5s7 2 7 5.5v2M16 4c4 0 5 6 1 7m1 2c3 .4 4 2.4 4 5v2"/>',
 volume:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m3-12a10 10 0 0 1 0 16"/>',
 volumeOff:'<path d="M3 9h4l5-5v16l-5-5H3zM16 9l6 6m0-6-6 6"/>',
 settings:'<path d="m10 2-.7 2.5-2 .9-2.3-.7-2.1 3.6L4.6 10v2.9l-1.8 1.7L5 18.3l2.4-.5 2 1.1L10 21h4l.7-2.3 2-1.1 2.4.7 2-3.7-1.7-1.9v-2.4l1.7-1.8-2-3.7-2.4.7-2-1.1L14 2z"/><circle cx="12" cy="11.8" r="3.2"/>',
 pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.6"/>',
 heart:'<path d="M12 21 3 12V6l3-3h4l2 3 2-3h4l3 3v6z"/>',
 expand:'<path d="M15 3h6v6m-6 0 6-6M9 21H3v-6m6 0-6 6"/>',
 radar:'<circle cx="12" cy="12" r="9"/><path d="M12 12l7-7m-3 6a4 4 0 1 1-5-3"/>',
 pack:'<path d="M5 7h14l1 13H4zM8 7V4h8v3m-8 8h8"/>',
 chat:'<path d="M3 4h18v13H9l-5 4v-4H3z"/><path d="M7 9h10m-10 4h7"/>',
 chevronDown:'<path d="m6 9 6 6 6-6"/>',
 send:'<path d="m3 3 19 9-19 9 4-9zm4 9h15"/>',
 car:'<path d="m4 11 3-6h10l3 6m-17 0h18v8H3zm2 8v2m14-2v2m-13-6h2m8 0h2"/>',
 aim:'<circle cx="12" cy="12" r="7"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>',
 mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v7M6 10h12"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.2 3 4 3 4-3 4-3m-8-5h.1m7.8 0h.1"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9c0-4 7-4 7 0 0 2-4 2-4 5m0 3h.1"/>'
};
export function renderIcons(scope=document){for(const node of scope.querySelectorAll('i[data-icon]'))node.innerHTML=icon(node.dataset.icon);}
export function icon(name){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';}
