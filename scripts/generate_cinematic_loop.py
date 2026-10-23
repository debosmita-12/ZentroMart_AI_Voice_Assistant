"""Generates a seamless 5-second cinematic looping video (hero-loop.mp4)
and high-resolution poster for the ZentroMart hero background.
Strictly reproduces the visual direction from 'Cinematic Sites in Ten Minutes':
- pitch black environment
- gentle undulating fluid light ribbon across the lower third
- subtle luminous particles
- identical start and end frames for 100% invisible seam
"""
import math
import numpy as np
import imageio
from PIL import Image
import os

OUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "media")
)
os.makedirs(OUT_DIR, exist_ok=True)
VIDEO_PATH = os.path.join(OUT_DIR, "hero-loop.mp4")
POSTER_PATH = os.path.join(OUT_DIR, "hero-poster.jpg")

WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 5
TOTAL_FRAMES = FPS * DURATION_SEC

# Set seed for reproducible floating particles
np.random.seed(42)
N_PARTICLES = 40
particle_x = np.random.uniform(0, WIDTH, N_PARTICLES)
particle_y_base = np.random.uniform(HEIGHT * 0.4, HEIGHT * 0.9, N_PARTICLES)
particle_speed = np.random.uniform(0.5, 1.5, N_PARTICLES)
particle_size = np.random.randint(1, 3, N_PARTICLES)
particle_brightness = np.random.uniform(0.3, 0.8, N_PARTICLES)


def render_frame(frame_idx: int) -> np.ndarray:
    phase = 2.0 * math.pi * (frame_idx / TOTAL_FRAMES)
    
    # Base dark pitch canvas
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float32)
    # Pitch black with ultra subtle vignette
    y_coords, x_coords = np.mgrid[0:HEIGHT, 0:WIDTH]
    
    # Generate undulating ribbon across lower third
    # Centerline at y = HEIGHT * 0.72
    base_y = HEIGHT * 0.72
    wave1 = 45.0 * np.sin(2.0 * math.pi * x_coords / WIDTH + phase)
    wave2 = 25.0 * np.cos(4.0 * math.pi * x_coords / WIDTH - phase)
    wave3 = 15.0 * np.sin(6.0 * math.pi * x_coords / WIDTH + 2 * phase)
    center_curve = base_y + wave1 + wave2 + wave3

    dist = np.abs(y_coords - center_curve)
    
    # Ribbon thickness falloff
    ribbon_mask = np.exp(-0.5 * (dist / 38.0) ** 2)
    outer_glow = np.exp(-0.5 * (dist / 95.0) ** 2) * 0.35

    # Color palette: soft emerald / lime / cyan / platinum highlights
    color_shift = 0.5 + 0.5 * np.sin(2.0 * math.pi * x_coords / (WIDTH * 0.8) + phase)
    r_chan = ribbon_mask * 0.15 + outer_glow * 0.08
    g_chan = ribbon_mask * (0.65 + 0.25 * color_shift) + outer_glow * 0.35
    b_chan = ribbon_mask * (0.50 + 0.30 * (1 - color_shift)) + outer_glow * 0.28

    img[:, :, 0] += r_chan
    img[:, :, 1] += g_chan
    img[:, :, 2] += b_chan

    # Thin luminous crest line
    crest_dist = np.abs(y_coords - (center_curve - 12.0))
    crest = np.exp(-0.5 * (crest_dist / 3.5) ** 2) * 0.85
    img[:, :, 0] += crest * 0.8
    img[:, :, 1] += crest * 0.95
    img[:, :, 2] += crest * 0.9

    # Add gentle drifting luminous particles
    for i in range(N_PARTICLES):
        px = int((particle_x[i] + math.sin(phase + i) * 30.0) % WIDTH)
        py = int(particle_y_base[i] + math.sin(phase * 2.0 + i * 1.5) * 18.0)
        s = particle_size[i]
        b = particle_brightness[i] * (0.7 + 0.3 * math.sin(phase + i))
        
        y_min = max(0, py - s)
        y_max = min(HEIGHT, py + s + 1)
        x_min = max(0, px - s)
        x_max = min(WIDTH, px + s + 1)
        
        img[y_min:y_max, x_min:x_max, :] += b

    # Clip to [0, 1] and convert to uint8
    np.clip(img, 0.0, 1.0, out=img)
    return (img * 255.0).astype(np.uint8)


def main():
    print(f"Generating seamless 5s cinematic loop ({TOTAL_FRAMES} frames @ {FPS}fps)...")
    writer = imageio.get_writer(
        VIDEO_PATH,
        fps=FPS,
        format="FFMPEG",
        codec="libx264",
        pixelformat="yuv420p",
        ffmpeg_params=["-crf", "22", "-preset", "slow", "-an"],
    )

    first_frame = None
    for i in range(TOTAL_FRAMES):
        frame = render_frame(i)
        if i == 0:
            first_frame = frame
        writer.append_data(frame)
        if (i + 1) % 30 == 0:
            print(f"Rendered {i + 1}/{TOTAL_FRAMES} frames...")

    writer.close()
    print(f"Video saved successfully to: {VIDEO_PATH} ({os.path.getsize(VIDEO_PATH)} bytes)")

    # Save first frame as poster
    if first_frame is not None:
        poster = Image.fromarray(first_frame)
        poster.save(POSTER_PATH, quality=95)
        print(f"Poster image saved to: {POSTER_PATH}")


if __name__ == "__main__":
    main()
