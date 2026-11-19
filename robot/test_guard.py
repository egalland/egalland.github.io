import time, unittest
from server import Guard
class Robot:
    def __init__(self): self.speed=0
    def stop(self): self.speed=0
    def forward(self,v): self.speed=v
    def backward(self,v): self.speed=-v
    def set_dir_servo_angle(self,v): pass
    def set_cam_pan_angle(self,v): pass
    def set_cam_tilt_angle(self,v): pass
class SafetyTests(unittest.TestCase):
    def setUp(self): self.r=Robot();self.g=Guard(self.r)
    def test_requires_arm_and_clamps(self):
        self.g.drive({'throttle':99});self.assertEqual(self.r.speed,0)
        self.g.arm();self.g.drive({'throttle':99});self.assertEqual(self.r.speed,35)
    def test_timeout_latches_stop(self):
        self.g.arm();self.g.drive({'throttle':20});self.g.last-=1
        self.assertTrue(self.g.tick());self.assertEqual(self.r.speed,0)
        self.g.drive({'throttle':20});self.assertEqual(self.r.speed,0)
    def test_stop_and_bad_input(self):
        self.g.arm();self.g.drive({'throttle':-20});self.assertEqual(self.r.speed,-20)
        with self.assertRaises(ValueError):self.g.drive({'throttle':float('nan')})
        self.assertFalse(self.g.armed);self.assertEqual(self.r.speed,0)
    def test_camera_failure(self):
        self.g.camera_ok=lambda:False
        with self.assertRaises(ValueError):self.g.arm()
        self.assertFalse(self.g.armed)
    def test_expired_command_cannot_restart(self):
        self.g.arm();self.g.last-=1;self.g.drive({'throttle':20})
        self.assertFalse(self.g.armed);self.assertEqual(self.r.speed,0)
if __name__=='__main__':unittest.main()
