#!/usr/bin/env python3
"""Rover Link. PiCar-X adapter; validate physical calibration before driving."""
import asyncio, contextlib, hmac, io, json, math, os, signal, threading, time
from pathlib import Path
from aiohttp import web, WSMsgType

class Guard:
    def __init__(self, robot, camera_ok=lambda: True):
        self.robot, self.camera_ok = robot, camera_ok
        self.lock = threading.RLock()
        self.armed, self.last = False, 0.0
    def stop(self):
        with self.lock:
            self.armed = False
            self.robot.stop()
    def arm(self):
        with self.lock:
            self.robot.stop()
            if not self.camera_ok():
                raise ValueError('Caméra indisponible : activation refusée.')
            self.armed, self.last = True, time.monotonic()
    def tick(self):
        with self.lock:
            if self.armed and (time.monotonic()-self.last > .35 or not self.camera_ok()):
                self.stop()
                return True
        return False
    def drive(self, m):
        with self.lock:
            values = [m.get(k, 0) for k in ('throttle', 'steer', 'pan', 'tilt')]
            if any(isinstance(v, bool) or not isinstance(v, (int,float)) or not math.isfinite(v) for v in values):
                self.stop()
                raise ValueError('Commande invalide.')
            if not self.armed:
                return
            if time.monotonic()-self.last > .35 or not self.camera_ok():
                self.stop()
                return
            t,s,p,v = values
            t=max(-35,min(35,t)); s=max(-25,min(25,s))
            self.robot.set_dir_servo_angle(s)
            self.robot.set_cam_pan_angle(max(-60,min(60,p)))
            self.robot.set_cam_tilt_angle(max(-25,min(25,v)))
            if t > 0: self.robot.forward(t)
            elif t < 0: self.robot.backward(-t)
            else: self.robot.stop()
            self.last=time.monotonic()

class Camera:
    def __init__(self):
        from picamera2 import Picamera2
        self.pi=Picamera2()
        self.pi.configure(self.pi.create_video_configuration(main={'size':(640,480)}))
        self.pi.start()
        self.frame=None; self.last=0; self.error=None; self.quit=threading.Event()
        self.thread=threading.Thread(target=self.loop,daemon=True); self.thread.start()
    def loop(self):
        while not self.quit.is_set():
            try:
                buff=io.BytesIO(); self.pi.capture_file(buff,format='jpeg')
                self.frame=buff.getvalue(); self.last=time.monotonic()
            except Exception as e:
                self.error=str(e); return
            self.quit.wait(.1)
    def ok(self): return time.monotonic()-self.last < .8
    def close(self):
        self.quit.set(); self.thread.join(timeout=2); self.pi.stop(); self.pi.close()

async def main():
    token=os.environ.get('ROVER_TOKEN','')
    if len(token)<20: raise SystemExit('ROVER_TOKEN requis (20 caractères minimum).')
    origins=set(filter(None,os.environ.get('ROVER_ORIGINS','').split(',')))
    if not origins: raise SystemExit('ROVER_ORIGINS requis : origines exactes autorisées, séparées par une virgule.')
    from picarx import Picarx
    robot=Picarx(); robot.stop()
    camera=None
    try:
        camera=Camera()
        guard=Guard(robot,camera.ok); done=threading.Event(); fault=threading.Event()
        def watchdog():
            while not done.wait(.04):
                try:
                    if guard.tick(): fault.set()
                except Exception:
                    fault.set(); guard.armed=False
                    with contextlib.suppress(Exception): robot.stop()
        thread=threading.Thread(target=watchdog,daemon=True); thread.start()
        active=None
        async def ws_handler(request):
            nonlocal active
            if request.headers.get('Origin') not in origins: raise web.HTTPForbidden(text='Origine refusée')
            ws=web.WebSocketResponse(max_msg_size=4096,heartbeat=5)
            await ws.prepare(request)
            try:
                first=await asyncio.wait_for(ws.receive_json(),5)
                if not isinstance(first,dict) or first.get('type')!='auth' or not isinstance(first.get('token'),str) or not hmac.compare_digest(first['token'],token):
                    await ws.send_json({'type':'error','message':'Clé incorrecte.'}); await ws.close(); return ws
            except Exception:
                await ws.close(); return ws
            if active is not None:
                await ws.send_json({'type':'error','message':'Un autre pilote est déjà connecté.'}); await ws.close(); return ws
            active=ws; guard.stop(); fault.clear()
            await ws.send_json({'type':'ready'})
            async def stream():
                previous=None
                while not ws.closed:
                    if fault.is_set():
                        fault.clear(); await ws.send_json({'type':'fault','message':'Arrêt automatique : commandes ou vidéo interrompues. Réactive manuellement.'})
                    frame=camera.frame
                    if frame is not None and frame is not previous:
                        await asyncio.wait_for(ws.send_bytes(frame),.5); previous=frame
                    await asyncio.sleep(.08)
            task=asyncio.create_task(stream())
            def stream_done(t):
                if not t.cancelled() and t.exception():
                    guard.stop(); asyncio.create_task(ws.close())
            task.add_done_callback(stream_done)
            try:
                async for msg in ws:
                    if msg.type!=WSMsgType.TEXT: break
                    try:
                        data=json.loads(msg.data)
                        if not isinstance(data,dict): raise ValueError('Message invalide.')
                        if data.get('type')=='arm': guard.arm()
                        elif data.get('type')=='stop': guard.stop()
                        elif data.get('type')=='drive': guard.drive(data)
                        else: raise ValueError('Message inconnu.')
                    except Exception:
                        guard.stop(); await ws.send_json({'type':'fault','message':'Commande refusée : rover arrêté.'})
            finally:
                guard.stop(); task.cancel()
                with contextlib.suppress(asyncio.CancelledError,Exception): await task
                active=None
            return ws
        app=web.Application(); app.router.add_get('/ws',ws_handler)
        static=Path(__file__).resolve().parent.parent/'web'
        if static.exists():
            app.router.add_get('/',lambda r:web.FileResponse(static/'index.html'))
            app.router.add_get('/guide',lambda r:web.FileResponse(static.parent/'GUIDE.html'))
            app.router.add_static('/',static,show_index=False)
        runner=web.AppRunner(app); await runner.setup()
        await web.TCPSite(runner,os.environ.get('ROVER_HOST','127.0.0.1'),8080).start()
        print('Rover Link prêt sur le port 8080. Commandes désactivées au démarrage.')
        halt=asyncio.Event()
        loop=asyncio.get_running_loop()
        for sig in (signal.SIGINT,signal.SIGTERM): loop.add_signal_handler(sig,halt.set)
        try: await halt.wait()
        finally:
            guard.stop()
            if active: await active.close()
            await runner.cleanup(); done.set(); thread.join(timeout=1)
    finally:
        robot.stop()
        if camera: camera.close()

if __name__=='__main__': asyncio.run(main())
