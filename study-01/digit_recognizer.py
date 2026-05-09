"""
Handwritten Digit Recognizer
Draws on a canvas and predicts the digit (0-9) using a neural network
trained on the MNIST dataset.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import os
import threading
import pickle

MODEL_PATH = "digit_model.pkl"

# ---------------------------------------------------------------------------
# Model training
# ---------------------------------------------------------------------------

def train_model():
    """Download MNIST and train an MLP classifier. Returns the fitted model."""
    from sklearn.datasets import fetch_openml
    from sklearn.neural_network import MLPClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline

    print("Downloading MNIST dataset (this may take a minute)...")
    mnist = fetch_openml("mnist_784", version=1, as_frame=False, parser="liac-arff")
    X, y = mnist.data, mnist.target.astype(int)

    # Use the standard 60 000 / 10 000 split
    X_train, y_train = X[:60000], y[:60000]

    print("Training neural network...")
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("mlp", MLPClassifier(
            hidden_layer_sizes=(256, 128),
            activation="relu",
            max_iter=20,
            random_state=42,
            verbose=True,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=5,
        )),
    ])
    model.fit(X_train, y_train)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print("Model saved to", MODEL_PATH)
    return model


def load_or_train_model(status_var=None):
    """Load a cached model or train a new one."""
    if os.path.exists(MODEL_PATH):
        if status_var:
            status_var.set("Loading saved model...")
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print("Model loaded from", MODEL_PATH)
    else:
        if status_var:
            status_var.set("Training model on MNIST (first run — may take ~2 min)...")
        model = train_model()
    return model


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

CANVAS_SIZE = 280   # pixels of the drawing canvas
MODEL_SIZE  = 28    # MNIST input size

def preprocess_canvas_image(pil_image: Image.Image) -> np.ndarray:
    """
    Convert a PIL image (drawn on canvas) into a 784-dim feature vector
    that matches MNIST's preprocessing:
      - grayscale, invert (white digit on black → black digit on white)
      - center the bounding box
      - resize to 28×28 (aspect-ratio preserved, centered — matches MNIST layout)
      - soft Gaussian blur to match MNIST's anti-aliased strokes
      - flatten
    """
    gray = pil_image.convert("L")

    # Invert: canvas is white background + black strokes → MNIST is black bg + white digit
    inverted = ImageOps.invert(gray)

    bbox = inverted.getbbox()
    if bbox is None:
        return np.zeros((1, 784))

    cropped = inverted.crop(bbox)

    # Preserve aspect ratio: scale so the longest side fits in 20px (MNIST convention).
    # Without this, tall-thin digits like 1 and 7 get squashed horizontally.
    w, h = cropped.size
    scale = 20.0 / max(w, h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    scaled = cropped.resize((new_w, new_h), Image.LANCZOS)

    # Center in a 28×28 black canvas
    canvas28 = Image.new("L", (MODEL_SIZE, MODEL_SIZE), 0)
    x_off = (MODEL_SIZE - new_w) // 2
    y_off = (MODEL_SIZE - new_h) // 2
    canvas28.paste(scaled, (x_off, y_off))

    # Slight blur so stroke edges match MNIST's handwritten texture
    canvas28 = canvas28.filter(ImageFilter.GaussianBlur(radius=0.8))

    arr = np.array(canvas28, dtype=np.float32).flatten()
    return arr.reshape(1, -1)


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

class DigitRecognizerApp:
    BRUSH_RADIUS = 10   # drawing brush half-width in pixels
    LINE_WIDTH   = 20   # line width for smooth strokes

    def __init__(self, root: tk.Tk, model):
        self.root = root
        self.model = model
        self.root.title("Handwritten Digit Recognizer")
        self.root.resizable(False, False)

        self._build_ui()

        # Internal PIL image used for prediction (always in sync with canvas)
        self._pil_image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
        self._pil_draw  = ImageDraw.Draw(self._pil_image)

        self._last_x = None
        self._last_y = None

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self):
        bg = "#1e1e2e"
        self.root.configure(bg=bg)

        # ---- title ----
        tk.Label(
            self.root, text="Draw a digit (0 – 9)",
            font=("Segoe UI", 16, "bold"), bg=bg, fg="#cdd6f4"
        ).pack(pady=(16, 4))

        # ---- canvas ----
        canvas_frame = tk.Frame(self.root, bg="#313244", bd=0, relief="flat")
        canvas_frame.pack(padx=20)

        self.canvas = tk.Canvas(
            canvas_frame,
            width=CANVAS_SIZE, height=CANVAS_SIZE,
            bg="white", cursor="crosshair",
            highlightthickness=2, highlightbackground="#89b4fa"
        )
        self.canvas.pack()

        self.canvas.bind("<ButtonPress-1>",   self._on_press)
        self.canvas.bind("<B1-Motion>",       self._on_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_release)

        # ---- result panel ----
        result_frame = tk.Frame(self.root, bg=bg)
        result_frame.pack(fill="x", padx=20, pady=12)

        tk.Label(
            result_frame, text="Prediction:",
            font=("Segoe UI", 13), bg=bg, fg="#a6adc8"
        ).pack(side="left")

        self.prediction_var = tk.StringVar(value="—")
        tk.Label(
            result_frame, textvariable=self.prediction_var,
            font=("Segoe UI", 48, "bold"), bg=bg, fg="#a6e3a1", width=3
        ).pack(side="left", padx=8)

        self.confidence_var = tk.StringVar(value="")
        tk.Label(
            result_frame, textvariable=self.confidence_var,
            font=("Segoe UI", 11), bg=bg, fg="#6c7086"
        ).pack(side="left")

        # ---- probability bar chart ----
        bars_outer = tk.Frame(self.root, bg=bg)
        bars_outer.pack(fill="x", padx=20, pady=(0, 8))

        tk.Label(
            bars_outer, text="Confidence per digit",
            font=("Segoe UI", 10), bg=bg, fg="#6c7086"
        ).pack(anchor="w")

        self.bar_canvas = tk.Canvas(
            bars_outer, width=CANVAS_SIZE, height=80,
            bg="#181825", highlightthickness=0
        )
        self.bar_canvas.pack()
        self._init_bars()

        # ---- buttons ----
        btn_frame = tk.Frame(self.root, bg=bg)
        btn_frame.pack(pady=(4, 16))

        tk.Button(
            btn_frame, text="Clear",
            font=("Segoe UI", 11, "bold"),
            bg="#45475a", fg="#cdd6f4", activebackground="#585b70",
            relief="flat", padx=16, pady=6,
            command=self._clear
        ).pack(side="left", padx=6)

        tk.Button(
            btn_frame, text="Predict",
            font=("Segoe UI", 11, "bold"),
            bg="#89b4fa", fg="#1e1e2e", activebackground="#74c7ec",
            relief="flat", padx=16, pady=6,
            command=self._predict
        ).pack(side="left", padx=6)

    def _init_bars(self):
        """Draw 10 empty bar slots (digits 0-9)."""
        self._bar_ids   = []
        self._label_ids = []
        w = CANVAS_SIZE
        bar_w = w // 10
        h = 80
        for i in range(10):
            x0 = i * bar_w + 3
            x1 = (i + 1) * bar_w - 3
            # background slot
            self.bar_canvas.create_rectangle(x0, 4, x1, h - 20, fill="#313244", outline="")
            # filled bar (height 0 initially)
            bid = self.bar_canvas.create_rectangle(x0, h - 20, x1, h - 20, fill="#89b4fa", outline="")
            self._bar_ids.append(bid)
            # digit label
            lid = self.bar_canvas.create_text(
                (x0 + x1) // 2, h - 10,
                text=str(i), fill="#6c7086", font=("Segoe UI", 9)
            )
            self._label_ids.append(lid)

    # ------------------------------------------------------------------
    # Drawing handlers
    # ------------------------------------------------------------------

    def _on_press(self, event):
        self._last_x = event.x
        self._last_y = event.y
        self._draw_dot(event.x, event.y)

    def _on_drag(self, event):
        if self._last_x is not None:
            self._draw_line(self._last_x, self._last_y, event.x, event.y)
        self._last_x = event.x
        self._last_y = event.y
        # Auto-predict while drawing
        self._predict()

    def _on_release(self, event):
        self._last_x = None
        self._last_y = None
        self._predict()

    def _draw_dot(self, x, y):
        r = self.BRUSH_RADIUS
        self.canvas.create_oval(x - r, y - r, x + r, y + r, fill="black", outline="")
        self._pil_draw.ellipse([x - r, y - r, x + r, y + r], fill="black")

    def _draw_line(self, x0, y0, x1, y1):
        w = self.LINE_WIDTH
        self.canvas.create_line(x0, y0, x1, y1, fill="black", width=w, capstyle="round", joinstyle="round")
        self._pil_draw.line([x0, y0, x1, y1], fill="black", width=w)

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def _predict(self):
        arr = preprocess_canvas_image(self._pil_image)
        if arr.sum() == 0:
            return

        proba = self.model.predict_proba(arr)[0]   # shape (10,)
        digit = int(np.argmax(proba))
        conf  = proba[digit]

        self.prediction_var.set(str(digit))
        self.confidence_var.set(f"{conf * 100:.1f}%")
        self._update_bars(proba, digit)

    def _update_bars(self, proba: np.ndarray, best: int):
        h      = 80
        max_bar = h - 24   # max drawable height in pixels
        bar_w   = CANVAS_SIZE // 10

        for i, p in enumerate(proba):
            bar_h = int(p * max_bar)
            x0 = i * bar_w + 3
            x1 = (i + 1) * bar_w - 3
            y_top = h - 20 - bar_h
            y_bot = h - 20

            color = "#a6e3a1" if i == best else "#89b4fa"
            self.bar_canvas.coords(self._bar_ids[i], x0, y_top, x1, y_bot)
            self.bar_canvas.itemconfig(self._bar_ids[i], fill=color)
            self.bar_canvas.itemconfig(self._label_ids[i], fill="#cdd6f4" if i == best else "#6c7086")

    # ------------------------------------------------------------------
    # Clear
    # ------------------------------------------------------------------

    def _clear(self):
        self.canvas.delete("all")
        self._pil_image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
        self._pil_draw  = ImageDraw.Draw(self._pil_image)
        self.prediction_var.set("—")
        self.confidence_var.set("")
        self._reset_bars()

    def _reset_bars(self):
        h = 80
        for bid in self._bar_ids:
            coords = self.bar_canvas.coords(bid)
            self.bar_canvas.coords(bid, coords[0], h - 20, coords[2], h - 20)
            self.bar_canvas.itemconfig(bid, fill="#89b4fa")
        for lid in self._label_ids:
            self.bar_canvas.itemconfig(lid, fill="#6c7086")


# ---------------------------------------------------------------------------
# Splash / loading window shown during model training
# ---------------------------------------------------------------------------

def show_splash_and_load():
    """Show a loading window, train/load the model, then open the main app."""
    splash = tk.Tk()
    splash.title("Loading…")
    splash.geometry("400x160")
    splash.resizable(False, False)
    splash.configure(bg="#1e1e2e")

    tk.Label(
        splash, text="Handwritten Digit Recognizer",
        font=("Segoe UI", 14, "bold"), bg="#1e1e2e", fg="#cdd6f4"
    ).pack(pady=(24, 6))

    status_var = tk.StringVar(value="Starting…")
    tk.Label(
        splash, textvariable=status_var,
        font=("Segoe UI", 10), bg="#1e1e2e", fg="#6c7086", wraplength=360
    ).pack()

    progress = ttk.Progressbar(splash, mode="indeterminate", length=340)
    progress.pack(pady=14)
    progress.start(12)

    model_holder = [None]

    def _load():
        model_holder[0] = load_or_train_model(status_var)
        splash.after(0, _on_done)

    def _on_done():
        progress.stop()
        splash.destroy()
        _launch_main(model_holder[0])

    t = threading.Thread(target=_load, daemon=True)
    t.start()
    splash.mainloop()


def _launch_main(model):
    root = tk.Tk()
    app = DigitRecognizerApp(root, model)
    root.mainloop()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    show_splash_and_load()
