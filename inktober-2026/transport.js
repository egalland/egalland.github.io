(() => {
 'use strict';
 window.inktoberTransport={async api(path,body){
  if(path!=='/api/calendar'||body!==undefined)throw new Error('Le calendrier est en lecture seule. Ses mises à jour sont publiées depuis le dépôt.');
  const response=await fetch('/inktober-2026/calendar.json',{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw new Error('Le calendrier ne peut pas être chargé. Réessayez.');
  return window.githubCalendarStore.parse(await response.json());
 }};
})();
