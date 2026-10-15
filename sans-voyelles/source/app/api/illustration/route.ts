import {QUESTIONS} from '../../../lib/game';
const headers={'Cache-Control':'public,max-age=86400'};
export async function GET(req:Request){
 const title=new URL(req.url).searchParams.get('title');
 const question=QUESTIONS.find(q=>q.wiki===title);
 if(!question)return Response.json({}, {status:400});
 // Selected article images are resolved once with the bank, not on every round.
 if(question.illustration)return Response.json(question.illustration,{headers});
 for(const [language,article] of [['fr',question.wiki],['en',question.wikiEn]]){
  if(!article)continue;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),1800);
  try{
   const r=await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/`+encodeURIComponent(article),{signal:controller.signal,headers:{'User-Agent':'SansVoyelles/1.1 (educational word game)'}});
   if(!r.ok)continue;const d=await r.json() as any;
   if(d.thumbnail?.source)return Response.json({url:d.thumbnail.source,page:d.content_urls?.desktop?.page||null,description:d.description||'',credit:'Wikipédia — source et crédits sur la fiche'},{headers});
  }catch{}finally{clearTimeout(timer);}
 }
 return Response.json({url:null,page:'https://fr.wikipedia.org/wiki/'+encodeURIComponent(question.wiki)},{headers});
}
