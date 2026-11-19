import {SIDE} from './planet';

// Enter orbit when most of a face fits the available map area.
export const planetZoom=(width:number,height:number)=>Math.max(.035,.9*Math.min(width,height/.64)/SIDE);
export const FACTORY_ZOOM=4;
export const MAX_ZOOM=24;
const detail=(zoom:number)=>Math.max(0,Math.min(1,(zoom-.65)/1));
export const cameraSkew=(zoom:number)=>.64+.10*detail(zoom);
export const cameraRelief=(zoom:number)=>.8-.72*detail(zoom);
export const quarterTurn=(yaw:number,steps=1)=>((Math.round(yaw/(Math.PI/2))+steps)%4+4)%4*(Math.PI/2);
export const cameraBearing=(yaw:number)=>(['N','E','S','O'] as const)[((Math.round(yaw/(Math.PI/2))%4)+4)%4];
