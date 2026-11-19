// Appearance fields from Kikalmo's lib/profile.ts, public catalogue version 160.
const partCounts={"shape":6,"hair":8,"eyes":6,"nose":7,"mouth":6,"accessory":7,"outfit":6};
const baseAvatar={"shape":0,"hair":1,"eyes":0,"nose":1,"mouth":0,"accessory":0,"outfit":0,"color":"#f8d779"};
export const appearanceSchema={
  headwear: [1,2,3,4,5,6,7,8,9,10,11,12,17,18,19,20,21,22,42,45,58,59,60,61,62,63,64,65,200,202,204,206,208,210,212,214,216,218,220,222,224,226],
  adornment: [13,14,15,16,23,24,43,44,46,47,66,67,68,69,70,71,72,73,201,203,205,207,209,211,213,215,217,219,221,223,225,227],
  costume: [25,26,27,28,29,30,31,32,39,40,41,50,51,52,53,54,55,56,57,90,91,92,93,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,230,231,232,233,234],
  premiumHair: [33,34,35],
  premiumEyes: [36,37,38],
  fabric: [48,49,74,75,76,77,78,79],
  premiumFace: [80,81,82,83],
  facewear: [94,95,96]
};

export function normalizeAppearance(value) {
  if (!value || typeof value!=='object' || Array.isArray(value)) return null;
  if (!Object.hasOwn(value,'shape') && !Object.hasOwn(value,'outfit') && !Object.hasOwn(value,'costume')) return null;
  const avatar={...baseAvatar};
  for (const [key,count] of Object.entries(partCounts)) {
    const digit=value[key];
    if (Number.isInteger(digit) && digit>=0 && digit<count) avatar[key]=digit;
  }
  if (typeof value.color==='string' && /^#[a-f\d]{6}$/i.test(value.color)) avatar.color=value.color.toLowerCase();
  for (const [slot,ids] of Object.entries(appearanceSchema)) {
    const id=ids.includes(value[slot])?value[slot]:value.cosmetic;
    if (ids.includes(id)) avatar[slot]=id;
  }
  if (avatar.premiumFace) avatar.shape=({80:0,81:2,82:3,83:1})[avatar.premiumFace];
  return avatar;
}
