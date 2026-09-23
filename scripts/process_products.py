from PIL import Image, ImageDraw
import os

D = "/app/frontend/public/shop"

def to_jpg(name):
    im = Image.open(f"{D}/{name}.png").convert("RGB")
    im.save(f"{D}/{name}.jpg", quality=86, optimize=True)
    os.remove(f"{D}/{name}.png")
    return im

for n in ["groovmic-bt", "groovwah", "groovamp-12", "groovamp-10", "groovamp-7", "strings-green", "strings-purple", "strings-blue", "storm-v"]:
    to_jpg(n)

# Lightning V: composite transparent PNG onto studio-dark backdrop
fv = Image.open("/app/frontend/public/jamnow/flying-v.png").convert("RGBA")
W, H = 900, 1300
bg = Image.new("RGB", (W, H), (4, 8, 16))
d = ImageDraw.Draw(bg)
for i in range(60):
    r = int(500 - i * 7)
    c = (int(10 + i * 0.6), int(30 + i * 1.6), int(60 + i * 2.6))
    d.ellipse([W // 2 - r, H // 2 - r, W // 2 + r, H // 2 + r], fill=c)
scale = (H * 0.92) / fv.height
fv2 = fv.resize((int(fv.width * scale), int(fv.height * scale)), Image.LANCZOS)
bg.paste(fv2, ((W - fv2.width) // 2, (H - fv2.height) // 2), fv2)
bg.save(f"{D}/lightning-v.jpg", quality=88, optimize=True)

# Close-up crops: (name, [(label, x0,y0,x1,y1)])
CROPS = {
    "galaxy-v": [("headstock", 0.55, 0.03, 0.95, 0.25), ("pickups", 0.3, 0.5, 0.65, 0.72), ("finish", 0.08, 0.68, 0.6, 0.95)],
    "lightning-v": [("headstock", 0.3, 0.04, 0.7, 0.2), ("pickups", 0.3, 0.52, 0.7, 0.72), ("finish", 0.15, 0.7, 0.85, 0.97)],
    "storm-v": [("headstock", 0.3, 0.02, 0.7, 0.2), ("pickups", 0.3, 0.55, 0.7, 0.75), ("finish", 0.2, 0.7, 0.8, 0.95)],
}
for name, crops in CROPS.items():
    im = Image.open(f"{D}/{name}.jpg")
    w, h = im.size
    for label, x0, y0, x1, y1 in crops:
        c = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
        c = c.resize((800, int(800 * c.height / c.width)), Image.LANCZOS)
        c.save(f"{D}/{name}-{label}.jpg", quality=86, optimize=True)
print(sorted(os.listdir(D)))
