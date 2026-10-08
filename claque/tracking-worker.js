let hands,face,busy=false,frameCount=0;
self.onmessage=async({data})=>{
 if(data.type==='init'){
  try{
   self.postMessage({type:'loading',message:'Chargement du suivi des mains…'});
   const {FilesetResolver,HandLandmarker,FaceLandmarker}=await import('./assets/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks(new URL('./assets/wasm',self.location.href).href);
   hands=await HandLandmarker.createFromOptions(files,{canvas:new OffscreenCanvas(640,480),baseOptions:{modelAssetPath:new URL('./assets/hand_landmarker.task',self.location.href).href,delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
   self.postMessage({type:'loading',message:'Chargement des effets du visage…'});
   face=await FaceLandmarker.createFromOptions(files,{canvas:new OffscreenCanvas(640,480),baseOptions:{modelAssetPath:new URL('./assets/face_landmarker.task',self.location.href).href,delegate:'CPU'},runningMode:'VIDEO',numFaces:1,minFaceDetectionConfidence:.5,minFacePresenceConfidence:.5,minTrackingConfidence:.5});
   self.postMessage({type:'ready'});
  }catch(e){self.postMessage({type:'error',message:String(e.message||e)})}
 }
 if(data.type==='frame'){
  if(busy||!hands||!face){data.bitmap.close();self.postMessage({type:'skipped'});return}busy=true;
  try{const h=hands.detectForVideo(data.bitmap,data.timestamp);let f=null;if(frameCount++%3===0)f=face.detectForVideo(data.bitmap,data.timestamp).faceLandmarks[0]||[];self.postMessage({type:'result',hands:h.landmarks,face:f,timestamp:data.timestamp,width:data.width,height:data.height})}catch(e){self.postMessage({type:'error',message:String(e.message||e)})}finally{data.bitmap.close();busy=false}
 }
};
