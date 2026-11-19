// Only bulky optional fields are referenced. Coordinates, aim and health in a
// fire request always describe that request, even when the previous reply was lost.
const fields=['appearance','traffic'];

function fingerprint(value){
  if(!value)return null;
  const text=JSON.stringify(value);
  let hash=2166136261;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return (hash>>>0).toString(36)+'.'+text.length.toString(36);
}

export function stateReferences(state){
  return fields.map(field=>fingerprint(state[field]));
}

export function restoreStateFields(source,keep,previous){
  if(!Array.isArray(keep)||!source||!Number.isFinite(source.x)||!Number.isFinite(source.y))return source;
  const state={...source};
  for(let i=0;i<fields.length;i++){
    const field=fields[i];
    if(typeof keep[i]==='string'&&!Object.hasOwn(state,field)&&previous[field])state[field]=previous[field];
  }
  return state;
}

export function createStateEncoder(){
  let acknowledged=[],sent=[];
  return {
    packet(state,joining){
      if(joining)acknowledged=[];
      const body={...state},keep=[null,null];
      sent=fields.map((field,i)=>{
        const value=state[field],prior=acknowledged[i];
        if(!value)return null;
        const encoded=JSON.stringify(value);
        if(prior&&prior.encoded===encoded){
          delete body[field];keep[i]=prior.ref;
        }
        return {encoded,required:keep[i]};
      });
      return keep.some(Boolean)?{state:body,keepState:keep}:{state:body};
    },
    ack(refs){
      acknowledged=sent.map((item,i)=>{
        const ref=Array.isArray(refs)?refs[i]:null;
        // If the server retained a different baseline, send the complete field next time.
        return item&&typeof ref==='string'&&(!item.required||item.required===ref)?{encoded:item.encoded,ref}:null;
      });
    }
  };
}
