"""
Poko — Cozy Red Panda Adaptive Desktop Pet (sharnikaj-dev/adaptive-desktop-pet)
Monitors your active window & work duration, rests curled up on a cushion in the desktop corner
until activated, roams & rolls around the screen, shares calming mind & love quotes when you
work hard, supports feeding snacks, and includes a 5-Minute Energy Relief play mode.

Run (uses Python standard library — works out-of-the-box on Windows):
    python main.py
"""

import ctypes
import json
import math
import os
import platform
import random
import time
import tkinter as tk
from dataclasses import dataclass, asdict

STATE_FILE = os.path.expanduser("~/.adaptive_desktop_pet_state.json")

CALM_AND_LOVE_QUOTES = [
    "Unclench your jaw, drop your shoulders, and take one slow breath with me.",
    "You are doing wonderfully, even on the days that feel heavy. I am proud of you.",
    "Your mind deserves quiet too. Rest your eyes for 20 seconds.",
    "You do not have to finish everything in this minute. Steady steps are enough.",
    "No matter how tough the task is, you are capable, resilient, and loved.",
    "Treat yourself with the same kindness you give to everyone else.",
    "Here is a warm virtual hug from the corner of your screen. You have got this.",
]

SNACKS = {
    "Berry Tart": 12.0,
    "Matcha Cake": 14.0,
    "Mini Ramen": 18.0,
    "Honey Cookie": 10.0,
}


class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]


def get_active_window_title() -> str:
    """Reads the currently focused Windows application title using stdlib ctypes."""
    if platform.system() != "Windows":
        return "Desktop Workspace"
    try:
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return "Desktop"
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return "Desktop"
        buff = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buff, length + 1)
        title = buff.value.strip()
        if " - " in title:
            return title.split(" - ")[-1][:28]
        return title[:28] or "Desktop"
    except Exception:
        return "Desktop"


def get_system_idle_seconds() -> float:
    """Returns seconds since last keyboard or mouse input on Windows."""
    if platform.system() != "Windows":
        return 0.0
    try:
        lii = LASTINPUTINFO()
        lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
        if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
            millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
            return max(0.0, millis / 1000.0)
    except Exception:
        pass
    return 0.0


@dataclass
class PetState:
    name: str = "Poko"
    species: str = "red_panda"
    mood: str = "SLEEPY"
    energy: float = 86.0
    bond: float = 54.0
    calm: float = 74.0
    laptop_work_seconds: int = 0


class AdaptiveDesktopPet:
    def __init__(self):
        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        self.transparent_bg = "#FF00FF"
        self.root.config(bg=self.transparent_bg)
        try:
            self.root.wm_attributes("-transparentcolor", self.transparent_bg)
        except tk.TclError:
            pass

        self.state = self.load_state()
        self.screen_w = self.root.winfo_screenwidth()
        self.screen_h = self.root.winfo_screenheight()

        self.win_w = 240
        self.win_h = 225
        self.corner_x = self.screen_w - self.win_w - 20
        self.corner_y = self.screen_h - self.win_h - 48
        self.x = float(self.corner_x)
        self.y = float(self.corner_y)
        self.vx = -2.1
        self.vy = 0.0

        self.is_active = False
        self.energy_mode_until = 0.0
        self.roll_until = 0.0
        self.wave_until = 0.0
        self.dragging = False
        self.drag_offset = (0, 0)
        self.tick = 0

        self.current_app = get_active_window_title()
        self.app_seconds = 0
        self.last_quote_time = 0.0
        self.quote_text = ""
        self.quote_until = 0.0

        self.canvas = tk.Canvas(
            self.root,
            width=self.win_w,
            height=self.win_h,
            bg=self.transparent_bg,
            highlightthickness=0,
        )
        self.canvas.pack()

        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_release)
        self.canvas.bind("<Double-Button-1>", self.on_double_click)
        self.canvas.bind("<Button-3>", self.show_menu)

        self.menu = tk.Menu(self.root, tearoff=0)
        self.menu.add_command(label="Activate / Corner Rest", command=self.toggle_active)
        self.menu.add_command(label="5-Min Energy Mode", command=self.start_energy_mode)
        self.menu.add_command(label="Happy Roll", command=self.trigger_roll)
        self.menu.add_command(label="Calming / Love Quote", command=self.show_random_quote)
        feed_menu = tk.Menu(self.menu, tearoff=0)
        for snack_name in SNACKS:
            feed_menu.add_command(
                label=snack_name,
                command=lambda s=snack_name: self.feed_snack(s),
            )
        self.menu.add_cascade(label="Feed Snack", menu=feed_menu)
        self.menu.add_separator()
        self.menu.add_command(label="Quit", command=self.quit_app)

        self.root.geometry(f"{self.win_w}x{self.win_h}+{int(self.x)}+{int(self.y)}")
        self.observe_loop()
        self.anim_loop()

    def load_state(self) -> PetState:
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    return PetState(**json.load(f))
            except Exception:
                pass
        return PetState()

    def save_state(self):
        try:
            with open(STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(asdict(self.state), f, indent=2)
        except Exception:
            pass

    def toggle_active(self):
        self.is_active = not self.is_active
        if self.is_active:
            self.state.mood = "CURIOUS"
            self.wave_until = time.time() + 1.8
            self.show_message(f"Awake! Watching {self.current_app}", 4.0)
        else:
            self.state.mood = "SLEEPY"
            self.x = float(self.corner_x)
            self.y = float(self.corner_y)
            self.root.geometry(f"{self.win_w}x{self.win_h}+{int(self.x)}+{int(self.y)}")

    def start_energy_mode(self):
        self.is_active = True
        self.energy_mode_until = time.time() + 300.0
        self.state.mood = "PLAYFUL"
        self.trigger_roll()
        self.show_message("5-Min Energy Mode! Let us play & recharge.", 5.0)

    def trigger_roll(self):
        self.roll_until = time.time() + 1.0
        self.vy = -5.5

    def show_random_quote(self):
        self.quote_text = random.choice(CALM_AND_LOVE_QUOTES)
        self.quote_until = time.time() + 8.0

    def show_message(self, msg: str, seconds: float = 5.0):
        self.quote_text = msg
        self.quote_until = time.time() + seconds

    def feed_snack(self, snack_name: str):
        boost = SNACKS.get(snack_name, 10.0)
        self.state.energy = min(100.0, self.state.energy + boost)
        self.state.bond = min(100.0, self.state.bond + 3.0)
        self.state.mood = "AFFECTIONATE"
        self.wave_until = time.time() + 1.5
        self.show_message(f"Yum! Loved the {snack_name}!", 4.0)
        self.save_state()

    def show_menu(self, event):
        self.menu.tk_popup(event.x_root, event.y_root)

    def on_press(self, event):
        self.dragging = True
        self.drag_offset = (event.x, event.y)

    def on_drag(self, event):
        if not self.is_active:
            return
        self.x = self.root.winfo_x() + (event.x - self.drag_offset[0])
        self.y = self.root.winfo_y() + (event.y - self.drag_offset[1])
        self.root.geometry(f"{self.win_w}x{self.win_h}+{int(self.x)}+{int(self.y)}")

    def on_release(self, _event):
        self.dragging = False

    def on_double_click(self, _event):
        if not self.is_active:
            self.toggle_active()
        else:
            self.state.bond = min(100.0, self.state.bond + 4.0)
            self.state.calm = min(100.0, self.state.calm + 3.0)
            self.state.mood = "AFFECTIONATE"
            self.wave_until = time.time() + 1.5
            self.show_random_quote()
            self.save_state()

    def observe_loop(self):
        if self.is_active:
            idle = get_system_idle_seconds()
            app = get_active_window_title()
            if app != self.current_app:
                self.current_app = app
                self.app_seconds = 0
            if idle < 20.0:
                self.app_seconds += 1
                self.state.laptop_work_seconds += 1

            now = time.time()
            if now < self.energy_mode_until:
                self.state.mood = "PLAYFUL"
                self.state.energy = min(100.0, self.state.energy + 0.3)
            elif idle > 45.0:
                self.state.mood = "ZEN"
            elif self.app_seconds > 0 and self.app_seconds % 1500 == 0:
                self.state.mood = "CONCERNED"
                self.show_random_quote()
                self.last_quote_time = now
            elif self.app_seconds >= 60 and now - self.last_quote_time > 600:
                self.state.mood = "FOCUSED"

            if self.state.laptop_work_seconds % 30 == 0:
                self.save_state()

        self.root.after(1000, self.observe_loop)

    def draw_red_panda(self):
        self.canvas.delete("all")
        now = time.time()
        cx = self.win_w // 2
        rolling = now < self.roll_until
        waving = now < self.wave_until

        if now < self.quote_until and self.quote_text:
            self.canvas.create_rectangle(
                12, 8, self.win_w - 12, 66, fill="#FFFFFF", outline="#2D160E", width=2
            )
            self.canvas.create_text(
                cx,
                37,
                text=self.quote_text,
                width=self.win_w - 34,
                fill="#2D160E",
                font=("Segoe UI", 8, "bold"),
                justify="center",
            )

        if not self.is_active:
            bob = math.sin(self.tick * 0.12) * 1.2
            cy = 152 + bob
            self.canvas.create_oval(cx - 50, 170, cx + 50, 194, fill="#FBF3E4", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 34, cy - 10, cx + 36, cy + 28, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 4, cy + 4, cx + 44, cy + 28, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_line(cx + 12, cy + 8, cx + 16, cy + 25, fill="#4A2518", width=5)
            self.canvas.create_line(cx + 26, cy + 7, cx + 30, cy + 24, fill="#4A2518", width=5)
            hx = cx - 14
            hy = cy - 4
            self.canvas.create_polygon(hx - 20, hy - 6, hx - 26, hy - 26, hx - 8, hy - 18, fill="#FFF3E2", outline="#2D160E", width=2)
            self.canvas.create_polygon(hx + 20, hy - 6, hx + 26, hy - 26, hx + 8, hy - 18, fill="#FFF3E2", outline="#2D160E", width=2)
            self.canvas.create_oval(hx - 24, hy - 18, hx + 24, hy + 18, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_oval(hx - 14, hy - 2, hx + 14, hy + 16, fill="#FFF3E2", outline="")
            self.canvas.create_line(hx - 12, hy + 2, hx - 5, hy + 2, fill="#2D160E", width=2)
            self.canvas.create_line(hx + 5, hy + 2, hx + 12, hy + 2, fill="#2D160E", width=2)
            self.canvas.create_text(cx + 42, cy - 32, text="Zzz", fill="#4A2518", font=("Segoe UI", 9, "bold"))
        elif rolling:
            bob = abs(math.sin(self.tick * 0.45)) * 12
            cy = 148 - bob
            self.canvas.create_oval(cx - 32, 186, cx + 32, 196, fill="#CBD5E1", outline="")
            self.canvas.create_oval(cx - 38, cy - 22, cx + 38, cy + 24, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 18, cy - 12, cx + 18, cy + 14, fill="#4A2518", outline="")
            self.canvas.create_oval(cx - 26, cy - 26, cx - 14, cy - 12, fill="#4A2518", outline="#2D160E", width=2)
            self.canvas.create_oval(cx + 14, cy - 26, cx + 26, cy - 12, fill="#4A2518", outline="#2D160E", width=2)
            self.canvas.create_text(cx, cy - 36, text="YAY!", fill="#D96236", font=("Segoe UI", 9, "bold"))
        else:
            bob = math.sin(self.tick * 0.22) * 2.5
            cy = 144 + bob
            self.canvas.create_oval(cx - 28, 188, cx + 28, 197, fill="#CBD5E1", outline="")
            self.canvas.create_oval(cx - 52, cy - 8, cx - 14, cy + 36, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_line(cx - 44, cy + 6, cx - 26, cy + 12, fill="#4A2518", width=5)
            self.canvas.create_line(cx - 42, cy + 20, cx - 24, cy + 24, fill="#4A2518", width=5)
            self.canvas.create_oval(cx - 22, cy - 4, cx + 22, cy + 44, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 13, cy + 6, cx + 13, cy + 36, fill="#4A2518", outline="")
            self.canvas.create_oval(cx - 28, cy + 4, cx - 16, cy + 24, fill="#4A2518", outline="#2D160E", width=2)
            if waving:
                self.canvas.create_oval(cx + 18, cy - 14, cx + 32, cy + 8, fill="#4A2518", outline="#2D160E", width=2)
                self.canvas.create_oval(cx + 22, cy - 10, cx + 28, cy - 4, fill="#F9A8D4", outline="")
            else:
                self.canvas.create_oval(cx + 16, cy + 4, cx + 28, cy + 24, fill="#4A2518", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 18, cy + 36, cx - 4, cy + 46, fill="#4A2518", outline="#2D160E", width=2)
            self.canvas.create_oval(cx + 4, cy + 36, cx + 18, cy + 46, fill="#4A2518", outline="#2D160E", width=2)
            self.canvas.create_polygon(cx - 26, cy - 20, cx - 34, cy - 46, cx - 12, cy - 34, fill="#FFF3E2", outline="#2D160E", width=2)
            self.canvas.create_polygon(cx + 26, cy - 20, cx + 34, cy - 46, cx + 12, cy - 34, fill="#FFF3E2", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 30, cy - 40, cx + 30, cy + 8, fill="#D96236", outline="#2D160E", width=2)
            self.canvas.create_oval(cx - 26, cy - 16, cx - 12, cy - 4, fill="#FFF3E2", outline="")
            self.canvas.create_oval(cx + 12, cy - 16, cx + 26, cy - 4, fill="#FFF3E2", outline="")
            self.canvas.create_oval(cx - 12, cy - 12, cx + 12, cy + 6, fill="#FFF3E2", outline="")
            self.canvas.create_oval(cx - 16, cy - 28, cx - 8, cy - 22, fill="#FFF3E2", outline="")
            self.canvas.create_oval(cx + 8, cy - 28, cx + 16, cy - 22, fill="#FFF3E2", outline="")
            self.canvas.create_oval(cx - 24, cy - 14, cx - 15, cy - 8, fill="#F48C8C", outline="")
            self.canvas.create_oval(cx + 15, cy - 14, cx + 24, cy - 8, fill="#F48C8C", outline="")
            self.canvas.create_oval(cx - 18, cy - 22, cx - 8, cy - 12, fill="#2D160E", outline="")
            self.canvas.create_oval(cx + 8, cy - 22, cx + 18, cy - 12, fill="#2D160E", outline="")
            self.canvas.create_oval(cx - 15, cy - 20, cx - 11, cy - 16, fill="#FFFFFF", outline="")
            self.canvas.create_oval(cx + 11, cy - 20, cx + 15, cy - 16, fill="#FFFFFF", outline="")
            self.canvas.create_oval(cx - 3, cy - 11, cx + 3, cy - 6, fill="#2D160E", outline="")
            self.canvas.create_arc(cx - 6, cy - 8, cx + 6, cy + 1, start=190, extent=160, style=tk.ARC, outline="#2D160E", width=2)

        status_label = (
            f"{self.state.name} · Right-click menu"
            if not self.is_active
            else f"{self.current_app} · {self.app_seconds // 60:02d}:{self.app_seconds % 60:02d}"
        )
        self.canvas.create_rectangle(
            cx - 88, 200, cx + 88, 218, fill="#FFFFFF", outline="#E2E8F0", width=1
        )
        self.canvas.create_text(
            cx, 209, text=status_label, fill="#2D160E", font=("Segoe UI", 8)
        )

    def anim_loop(self):
        self.tick += 1
        if self.is_active and not self.dragging:
            self.x += self.vx
            if self.x <= 16 or self.x >= self.screen_w - self.win_w - 16:
                self.vx *= -1
            if random.random() < 0.004:
                self.trigger_roll()
            if time.time() < self.energy_mode_until and random.random() < 0.03:
                self.vy = -5.0

            self.vy += 0.45
            self.y += self.vy
            if self.y >= self.corner_y:
                self.y = float(self.corner_y)
                self.vy = 0.0

            self.root.geometry(f"{self.win_w}x{self.win_h}+{int(self.x)}+{int(self.y)}")

        self.draw_red_panda()
        self.root.after(36, self.anim_loop)

    def quit_app(self):
        self.save_state()
        self.root.destroy()

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    pet = AdaptiveDesktopPet()
    pet.run()
