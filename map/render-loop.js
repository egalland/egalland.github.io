/** Demand rendering with exactly one pending RAF and no work when inactive. */
export function createDemandLoop(options                                                                                                                                          ){
 let frame=0,previous=0,drawing=false,disposed=false;
 const request=()=>{if(!disposed&&!drawing&&!frame&&options.active())frame=options.request(tick);};
 const tick=(time       )=>{frame=0;if(disposed||!options.active()){previous=0;return;}drawing=true;const delta=previous?Math.min(.05,Math.max(0,(time-previous)/1000)):0;previous=time;try{options.draw(delta);}finally{drawing=false;}if(!disposed&&options.continuous()&&options.active())request();else previous=0;};
 const pause=()=>{if(frame)options.cancel(frame);frame=0;previous=0;};
 return {request,pause,dispose:()=>{disposed=true;pause();}};
}
