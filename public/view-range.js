// Separate long-range geometry from detailed streets and gameplay entities.
export const cityViewRange=1120;
export const canvasViewRange=(portrait,quality=1)=>Math.round((portrait?875:1010)*(.82+quality*.18));
export const detailedCanvasRange=440;
export const streetViewRange=620;
