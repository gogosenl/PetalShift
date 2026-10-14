from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "store-screenshots" / "petalshift-appstore-5set"
IPHONE_DIR = OUT_ROOT / "iphone-1242x2688"
IPAD_DIR = OUT_ROOT / "ipad-2048x2732"

ASSETS = {
    "bg": ROOT / "assets" / "hd" / "botanical-background.png",
    "icon": ROOT / "assets" / "hd" / "app-icon.png",
    "gate": ROOT / "assets" / "ui-v3" / "chapter-gate.png",
    "levels": ROOT / "assets" / "ui-v4" / "icon-levels.png",
    "shop": ROOT / "assets" / "ui-v4" / "icon-shop.png",
    "settings": ROOT / "assets" / "ui-v4" / "icon-settings.png",
    "hint": ROOT / "assets" / "ui-v3" / "icon-hint.png",
    "reset": ROOT / "assets" / "ui-v3" / "icon-reset.png",
    "leaf": ROOT / "assets" / "ui-v4" / "icon-currency-leaf.png",
    "stone": ROOT / "assets" / "ui-v3" / "icon-currency-stone.png",
    "noads": ROOT / "assets" / "ui-v4" / "icon-no-ads-red.png",
    "star": ROOT / "assets" / "ui-v4" / "star-filled.png",
    "star_empty": ROOT / "assets" / "ui-v4" / "star-empty.png",
    "company": ROOT / "assets" / "company-logo.png",
}

FLOWERS = [
    ROOT / "assets" / "ui-v3" / "flower-sage.png",
    ROOT / "assets" / "ui-v3" / "flower-coral.png",
    ROOT / "assets" / "ui-v3" / "flower-gold.png",
    ROOT / "assets" / "ui-v3" / "flower-lavender.png",
    ROOT / "assets" / "ui-v3" / "flower-neutral.png",
]

SOIL_ASSETS = [
    ROOT / "assets" / "ui-v3" / "soil-sage.png",
    ROOT / "assets" / "ui-v3" / "soil-coral.png",
    ROOT / "assets" / "ui-v3" / "soil-gold.png",
    ROOT / "assets" / "ui-v3" / "soil-lavender.png",
    ROOT / "assets" / "ui-v3" / "soil-cream.png",
]
SOILS = ["#BCDCC2", "#F4C9AF", "#F0DFA2", "#C9C3DF", "#EFE3C7"]

C = {
    "cream": "#F6EBCF",
    "paper": "#FFF8E7",
    "deep": "#164B3A",
    "muted": "#687760",
    "green": "#466F55",
    "gold": "#E5C45A",
    "coral": "#CF675C",
    "board": "#607C59",
}


def font(name: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if name == "serif":
        candidates = [
            Path("C:/Windows/Fonts/georgiab.ttf") if bold else Path("C:/Windows/Fonts/georgia.ttf"),
            Path("C:/Windows/Fonts/timesbd.ttf") if bold else Path("C:/Windows/Fonts/times.ttf"),
        ]
    else:
        candidates = [
            Path("C:/Windows/Fonts/arialbd.ttf") if bold else Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/segoeuib.ttf") if bold else Path("C:/Windows/Fonts/segoeui.ttf"),
        ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def open_img(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def paste_fit(dst: Image.Image, path: Path, box: tuple[int, int, int, int]) -> None:
    if not path.exists():
        return
    img = open_img(path)
    x, y, w, h = box
    img.thumbnail((w, h), Image.Resampling.LANCZOS)
    px = x + (w - img.width) // 2
    py = y + (h - img.height) // 2
    dst.alpha_composite(img, (px, py))


def draw_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.ImageFont,
    fill: str,
    anchor: str = "mm",
    align: str = "center",
    max_width: int | None = None,
) -> None:
    if max_width is None:
        draw.text(xy, text, font=fnt, fill=fill, anchor=anchor, align=align)
        return
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = (line + " " + word).strip()
        if draw.textlength(test, font=fnt) <= max_width or not line:
            line = test
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    draw.multiline_text(xy, "\n".join(lines), font=fnt, fill=fill, anchor=anchor, align=align, spacing=int(fnt.size * 0.18))


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def background(w: int, h: int) -> Image.Image:
    img = Image.new("RGBA", (w, h), C["cream"])
    if ASSETS["bg"].exists():
        bg = open_img(ASSETS["bg"])
        scale = max(w / bg.width, h / bg.height)
        bg = bg.resize((int(bg.width * scale), int(bg.height * scale)), Image.Resampling.LANCZOS)
        img.alpha_composite(bg, ((w - bg.width) // 2, (h - bg.height) // 2))
    wash = Image.new("RGBA", (w, h), (255, 248, 231, 88))
    img.alpha_composite(wash)
    return img


def balance(img: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, icon: Path, value: str, s: float):
    bw, bh = int(168 * s), int(60 * s)
    rounded(draw, (x, y, x + bw, y + bh), int(30 * s), C["paper"], "#CDBE91", max(2, int(2 * s)))
    paste_fit(img, icon, (x + int(14 * s), y + int(9 * s), int(42 * s), int(42 * s)))
    draw.text((x + int(62 * s), y + bh // 2), value, font=font("sans", int(30 * s), True), fill=C["deep"], anchor="lm")


def header(img: Image.Image, draw: ImageDraw.ImageDraw, title: str, subtitle: str, leaves: int, s: float, w: int):
    draw.text((int(58 * s), int(48 * s)), "9:41", font=font("sans", int(20 * s), True), fill=(45, 55, 47, 145), anchor="lm")
    paste_fit(img, ASSETS["levels"], (int(80 * s), int(118 * s), int(74 * s), int(74 * s)))
    paste_fit(img, ASSETS["gate"], (int(172 * s), int(106 * s), int(96 * s), int(96 * s)))
    balance(img, draw, int(974 * s), int(114 * s), ASSETS["leaf"], str(leaves), s)
    draw.text((w // 2, int(154 * s)), title, font=font("serif", int(58 * s), True), fill=C["deep"], anchor="mm")
    draw.text((w // 2, int(222 * s)), subtitle, font=font("sans", int(25 * s), True), fill=C["muted"], anchor="mm")


def tile(img: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, size: int, color: int):
    shadow = Image.new("RGBA", (size + 18, size + 18), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((8, 11, size + 8, size + 11), radius=int(size * 0.16), fill=(67, 50, 31, 55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(1, size // 35)))
    img.alpha_composite(shadow, (x - 8, y - 8))
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, size, size), radius=int(size * 0.16), fill=255)
    if SOIL_ASSETS[color].exists():
        soil_src = open_img(SOIL_ASSETS[color])
        bbox = soil_src.getbbox()
        if bbox:
            soil_src = soil_src.crop(bbox)
        trim = max(2, int(min(soil_src.width, soil_src.height) * 0.055))
        soil_src = soil_src.crop((trim, trim, soil_src.width - trim, soil_src.height - trim))
        soil = soil_src.resize((size, size), Image.Resampling.LANCZOS)
        soil.putalpha(mask)
        img.alpha_composite(soil, (x, y))
    else:
        rounded(draw, (x, y, x + size, y + size), int(size * 0.16), SOILS[color])
    # Creamy bevel/glass line like the in-game pieces.
    draw.rounded_rectangle(
        (x + int(size * 0.02), y + int(size * 0.02), x + size - int(size * 0.02), y + size - int(size * 0.02)),
        radius=int(size * 0.16),
        outline="#FFF8E6CC",
        width=max(2, int(size * 0.035)),
    )
    shine = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shine)
    sd.rounded_rectangle(
        (int(size * 0.08), int(size * 0.06), int(size * 0.92), int(size * 0.34)),
        radius=int(size * 0.14),
        fill=(255, 255, 255, 34),
    )
    img.alpha_composite(shine, (x, y))
    paste_fit(img, FLOWERS[color], (x + int(size * 0.17), y + int(size * 0.15), int(size * 0.66), int(size * 0.66)))


def board(img: Image.Image, draw: ImageDraw.ImageDraw, rows: int, cols: int, colors: int, seed: int, x: int, y: int, bw: int) -> int:
    gap = max(8, int(bw * 0.018))
    pad = max(10, int(bw * 0.026))
    cell = int((bw - 2 * pad - (cols - 1) * gap) / cols)
    bh = 2 * pad + rows * cell + (rows - 1) * gap
    rounded(draw, (x - int(bw * 0.018), y - int(bw * 0.018), x + bw + int(bw * 0.018), y + bh + int(bw * 0.018)), int(bw * 0.055), "#8AA27A99", "#DFD2A6", max(5, int(bw * 0.012)))
    rounded(draw, (x, y, x + bw, y + bh), int(bw * 0.045), C["board"], "#6F916D", max(4, int(bw * 0.009)))
    glass = Image.new("RGBA", (bw, bh), (255, 255, 255, 0))
    gd = ImageDraw.Draw(glass)
    gd.rounded_rectangle((int(bw * 0.012), int(bh * 0.012), int(bw * 0.988), int(bh * 0.988)), radius=int(bw * 0.045), outline=(255, 255, 255, 62), width=max(3, int(bw * 0.008)))
    img.alpha_composite(glass, (x, y))
    i = 0
    for r in range(rows):
        for c in range(cols):
            color = (seed + r * cols + c * 2 + r * c + (r % 2) + (c % 3)) % colors
            tile(img, draw, x + pad + c * (cell + gap), y + pad + r * (cell + gap), cell, color)
            i += 1
    return bh


def round_icon(img: Image.Image, x: int, y: int, path: Path, size: int):
    paste_fit(img, path, (x, y, size, size))


def product_card(img: Image.Image, draw: ImageDraw.ImageDraw, x: int, y: int, ww: int, hh: int, icon: Path, amount: str, name: str, price: str, s: float):
    rounded(draw, (x, y, x + ww, y + hh), int(24 * s), "#EFE5CE", "#D5C79F", max(2, int(2 * s)))
    paste_fit(img, icon, (x + int(20 * s), y + int(22 * s), int(72 * s), int(72 * s)))
    draw.text((x + int(110 * s), y + int(40 * s)), amount, font=font("sans", int(30 * s), True), fill=C["deep"], anchor="lm")
    draw.text((x + int(110 * s), y + int(78 * s)), name, font=font("sans", int(16 * s), True), fill=C["muted"], anchor="lm")
    rounded(draw, (x + ww - int(136 * s), y + int(35 * s), x + ww - int(22 * s), y + int(86 * s)), int(16 * s), C["green"])
    draw.text((x + ww - int(79 * s), y + int(61 * s)), price, font=font("sans", int(18 * s), True), fill=C["paper"], anchor="mm")


def shot_game(w: int, h: int, out: Path, title: str, subtitle: str, copy: str, rows: int, cols: int, colors: int, seed: int, moves: int, leaves: int, board_y: int, board_w: int, actions=True, reward=False):
    s = w / 1242
    img = background(w, h)
    draw = ImageDraw.Draw(img)
    header(img, draw, title, subtitle, leaves, s, w)
    rounded(draw, (int(460 * s), int(286 * s), int(782 * s), int(362 * s)), int(38 * s), C["paper"])
    draw.text((w // 2, int(324 * s)), f"HAMLE · {moves}", font=font("sans", int(28 * s), True), fill=C["deep"], anchor="mm")
    draw.text((w // 2, int(430 * s)), copy, font=font("sans", int(27 * s), True), fill=C["muted"], anchor="mm")
    bw, by = int(board_w * s), int(board_y * s)
    bx = (w - bw) // 2
    bh = board(img, draw, rows, cols, colors, seed, bx, by, bw)
    if reward:
        card_y = by + bh + int(36 * s)
        rounded(draw, (int(120 * s), card_y, int(1122 * s), card_y + int(130 * s)), int(34 * s), "#FFF8E7EE", "#D5C79F", max(2, int(3 * s)))
        draw.text((w // 2, card_y + int(34 * s)), "BAHÇE UYANDI!", font=font("serif", int(36 * s), True), fill=C["deep"], anchor="mm")
        for i in range(3):
            paste_fit(img, ASSETS["star"], (w // 2 - int(102 * s) + i * int(72 * s), card_y + int(60 * s), int(58 * s), int(58 * s)))
        draw.text((w // 2, card_y + int(112 * s)), "ÖDÜLLER HAZIR", font=font("sans", int(18 * s), True), fill=C["muted"], anchor="mm")
    elif actions:
        ay = by + bh + int(60 * s)
        round_icon(img, int(392 * s), ay, ASSETS["reset"], int(78 * s))
        round_icon(img, int(582 * s), ay, ASSETS["hint"], int(78 * s))
        round_icon(img, int(772 * s), ay, ASSETS["shop"], int(78 * s))
    img.convert("RGB").save(out, quality=96)


def shot_home(w: int, h: int, out: Path):
    s = w / 1242
    img = background(w, h)
    draw = ImageDraw.Draw(img)
    balance(img, draw, int(820 * s), int(88 * s), ASSETS["leaf"], "69", s)
    paste_fit(img, ASSETS["icon"], (int(501 * s), int(145 * s), int(240 * s), int(240 * s)))
    draw.text((w // 2, int(455 * s)), "Petal Shift", font=font("serif", int(72 * s), True), fill=C["deep"], anchor="mm")
    draw.text((w // 2, int(528 * s)), "Slide. Match. Bloom.", font=font("sans", int(28 * s), True), fill=C["muted"], anchor="mm")
    rounded(draw, (int(80 * s), int(680 * s), int(1162 * s), int(982 * s)), int(42 * s), "#FFF8E7EE", "#6F916D", max(3, int(4 * s)))
    paste_fit(img, ASSETS["gate"], (int(130 * s), int(735 * s), int(195 * s), int(195 * s)))
    draw.text((int(390 * s), int(766 * s)), "DEVAM ET", font=font("sans", int(18 * s), True), fill=C["coral"], anchor="lm")
    draw.text((int(390 * s), int(832 * s)), "Filiz Avlusu", font=font("serif", int(48 * s), True), fill=C["deep"], anchor="lm")
    draw.text((int(392 * s), int(900 * s)), "Bölüm 12 / 20 · 3×3", font=font("sans", int(25 * s), True), fill=C["muted"], anchor="lm")
    rounded(draw, (int(80 * s), int(1055 * s), int(1162 * s), int(1148 * s)), int(30 * s), C["deep"], "#456F55", max(2, int(3 * s)))
    draw.text((w // 2, int(1102 * s)), "OYNA · Filiz 12", font=font("sans", int(30 * s), True), fill=C["paper"], anchor="mm")
    icons = [ASSETS["levels"], ASSETS["shop"], ASSETS["noads"], ASSETS["settings"]]
    labels = ["BÖLÜMLER", "MAĞAZA", "REKLAMSIZ", "AYARLAR"]
    for i, (ic, label) in enumerate(zip(icons, labels)):
        x = int((92 + (i % 2) * 540) * s)
        y = int((1225 + (i // 2) * 132) * s)
        rounded(draw, (x, y, x + int(500 * s), y + int(106 * s)), int(28 * s), C["paper"], "#D5C79F", max(2, int(3 * s)))
        paste_fit(img, ic, (x + int(130 * s), y + int(14 * s), int(70 * s), int(70 * s)))
        draw.text((x + int(220 * s), y + int(54 * s)), label, font=font("sans", int(23 * s), True), fill=C["deep"], anchor="lm")
    paste_fit(img, ASSETS["company"], (int(480 * s), int(2020 * s), int(64 * s), int(64 * s)))
    draw.text((int(560 * s), int(2054 * s)), "GÖRSEN GAMES", font=font("sans", int(22 * s), True), fill=C["deep"], anchor="lm")
    img.convert("RGB").save(out, quality=96)


def shot_levels(w: int, h: int, out: Path):
    s = w / 1242
    img = background(w, h)
    draw = ImageDraw.Draw(img)
    paste_fit(img, ASSETS["gate"], (int(76 * s), int(96 * s), int(84 * s), int(84 * s)))
    balance(img, draw, int(790 * s), int(92 * s), ASSETS["leaf"], "72", s)
    balance(img, draw, int(982 * s), int(92 * s), ASSETS["stone"], "8", s)
    draw.text((w // 2, int(230 * s)), "Bahçe Katmanları", font=font("serif", int(62 * s), True), fill=C["deep"], anchor="mm")
    draw.text((w // 2, int(298 * s)), "Katmanları aç, bölümleri sırayla çöz", font=font("sans", int(25 * s), True), fill=C["muted"], anchor="mm")
    tabs = [("3×3", "Filiz", True), ("4×3", "Yonca", True), ("4×4", "Rüzgâr", True), ("5×4", "Mercan", False)]
    for i, (size, name, unlocked) in enumerate(tabs):
        x = int((86 + i * 278) * s)
        fill = C["deep"] if i == 1 else C["paper"]
        tc = C["paper"] if i == 1 else C["deep"]
        rounded(draw, (x, int(370 * s), x + int(245 * s), int(490 * s)), int(28 * s), fill, "#CDBE91", max(2, int(3 * s)))
        draw.text((x + int(122 * s), int(405 * s)), size, font=font("sans", int(30 * s), True), fill=tc, anchor="mm")
        draw.text((x + int(122 * s), int(450 * s)), name if unlocked else "KİLİTLİ", font=font("sans", int(17 * s), True), fill=tc if unlocked else C["muted"], anchor="mm")
    rounded(draw, (int(80 * s), int(560 * s), int(1162 * s), int(790 * s)), int(34 * s), "#FFF8E7EE", "#6F916D", max(3, int(4 * s)))
    paste_fit(img, ASSETS["gate"], (int(126 * s), int(600 * s), int(160 * s), int(160 * s)))
    draw.text((int(330 * s), int(635 * s)), "Yonca Yolu", font=font("serif", int(46 * s), True), fill=C["deep"], anchor="lm")
    draw.text((int(334 * s), int(706 * s)), "4×3 · 8 / 40 tamamlandı", font=font("sans", int(24 * s), True), fill=C["muted"], anchor="lm")
    for i in range(30):
        x = int((108 + (i % 5) * 210) * s)
        y = int((880 + (i // 5) * 148) * s)
        fill = C["paper"] if i < 9 else "#EFE5CEAA"
        outline = C["gold"] if i == 8 else "#CDBE91"
        rounded(draw, (x, y, x + int(130 * s), y + int(130 * s)), int(24 * s), fill, outline, max(2, int(3 * s)))
        draw.text((x + int(65 * s), y + int(64 * s)), str(i + 1) if i < 9 else "•", font=font("sans", int(28 * s), True), fill=C["deep"] if i < 9 else C["muted"], anchor="mm")
    img.convert("RGB").save(out, quality=96)


def shot_shop(w: int, h: int, out: Path):
    s = w / 1242
    img = background(w, h)
    draw = ImageDraw.Draw(img)
    paste_fit(img, ASSETS["icon"], (int(521 * s), int(120 * s), int(200 * s), int(200 * s)))
    draw.text((w // 2, int(385 * s)), "Koru Dükkânı", font=font("serif", int(62 * s), True), fill=C["deep"], anchor="mm")
    balance(img, draw, int(300 * s), int(485 * s), ASSETS["leaf"], "69", s)
    balance(img, draw, int(660 * s), int(485 * s), ASSETS["stone"], "8", s)
    rounded(draw, (int(74 * s), int(650 * s), int(1168 * s), int(2260 * s)), int(48 * s), "#FFF8E7EE", "#BDAA79", max(3, int(4 * s)))
    draw.text((w // 2, int(735 * s)), "In-App Purchases", font=font("sans", int(30 * s), True), fill=C["muted"], anchor="mm")
    draw.text((int(120 * s), int(838 * s)), "İpucu Yaprakları", font=font("sans", int(32 * s), True), fill=C["deep"], anchor="lm")
    product_card(img, draw, int(120 * s), int(890 * s), int(1002 * s), int(138 * s), ASSETS["leaf"], "20", "İpucu Yaprağı", "₺29,99", s)
    product_card(img, draw, int(120 * s), int(1048 * s), int(1002 * s), int(138 * s), ASSETS["leaf"], "70", "İpucu Yaprağı", "₺69,99", s)
    draw.text((int(120 * s), int(1260 * s)), "Koru Taşları", font=font("sans", int(32 * s), True), fill=C["deep"], anchor="lm")
    product_card(img, draw, int(120 * s), int(1312 * s), int(1002 * s), int(138 * s), ASSETS["stone"], "35", "Koru Taşı", "₺99,99", s)
    product_card(img, draw, int(120 * s), int(1470 * s), int(1002 * s), int(138 * s), ASSETS["stone"], "100", "Koru Taşı", "₺249,99", s)
    draw.text((int(120 * s), int(1682 * s)), "Reklam Engelleme", font=font("sans", int(32 * s), True), fill=C["deep"], anchor="lm")
    product_card(img, draw, int(120 * s), int(1736 * s), int(1002 * s), int(150 * s), ASSETS["noads"], "∞", "Zorunlu geçiş reklamlarını kaldır", "₺149,99", s)
    draw.text((int(120 * s), int(1970 * s)), "Satın Alma Geçmişi", font=font("sans", int(30 * s), True), fill=C["deep"], anchor="lm")
    draw.text((int(120 * s), int(2020 * s)), "Son satın almaların burada görünür.", font=font("sans", int(18 * s), True), fill=C["muted"], anchor="lm")
    img.convert("RGB").save(out, quality=96)


def make_ipad_from_iphone(src: Path, out: Path):
    canvas = background(2048, 2732)
    phone = open_img(src)
    scale = 2732 / phone.height
    phone = phone.resize((int(phone.width * scale), 2732), Image.Resampling.LANCZOS)
    canvas.alpha_composite(phone, ((2048 - phone.width) // 2, 0))
    canvas.convert("RGB").save(out, quality=96)


def main():
    IPHONE_DIR.mkdir(parents=True, exist_ok=True)
    IPAD_DIR.mkdir(parents=True, exist_ok=True)
    w, h = 1242, 2688
    iphone_files = [
        IPHONE_DIR / "01-home.png",
        IPHONE_DIR / "02-game-rüzgar-4x4.png",
        IPHONE_DIR / "03-game-lavanta-5x5.png",
        IPHONE_DIR / "04-levels.png",
        IPHONE_DIR / "05-shop.png",
    ]
    shot_home(w, h, iphone_files[0])
    shot_game(w, h, iphone_files[1], "Rüzgâr", "BÖLÜM 32/50 · 4×4", "Bir sırayı istediğin kadar sürükle", 4, 4, 3, 5, 0, 69, 510, 980)
    shot_game(w, h, iphone_files[2], "Lavanta", "BÖLÜM 18/50 · 5×5", "Renkleri hedef bahçeyle eşleştir", 5, 5, 4, 8, 6, 84, 500, 1020)
    shot_levels(w, h, iphone_files[3])
    shot_shop(w, h, iphone_files[4])
    for src in iphone_files:
        make_ipad_from_iphone(src, IPAD_DIR / src.name)
    print(OUT_ROOT)


if __name__ == "__main__":
    main()
