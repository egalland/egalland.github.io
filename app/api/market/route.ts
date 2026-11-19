import {market} from '../../../lib/service';
export async function GET(){try{return Response.json(await market(),{headers:{'Cache-Control':'private, max-age=120'}})}catch(e){return Response.json({error:String(e)},{status:503})}}
