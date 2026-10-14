import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


TARGET_SIZE = (1242, 2688)
IPAD_TARGET_SIZE = (2064, 2752)


def prepare(source: Path, destination: Path) -> None:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")

    width, height = image.size
    # Remove Android status/navigation chrome while retaining the complete game UI.
    clean = image.crop((0, round(height * 0.05), width, round(height * 0.96)))

    # Match the required App Store aspect ratio without stretching. Only a tiny
    # amount of the decorative left/right background is cropped.
    # Bias the tiny horizontal crop toward the right so the currency capsules
    # remain fully visible; the left side contains only a small background margin.
    result = ImageOps.fit(clean, TARGET_SIZE, Image.Resampling.LANCZOS, centering=(0.67, 0.5))

    destination.parent.mkdir(parents=True, exist_ok=True)
    result.save(destination, "JPEG", quality=95, subsampling=0, optimize=True)


def prepare_ipad(source: Path, destination: Path, botanical_background: Path) -> None:
    with Image.open(botanical_background) as opened:
        background = ImageOps.fit(
            ImageOps.exif_transpose(opened).convert("RGB"),
            IPAD_TARGET_SIZE,
            Image.Resampling.LANCZOS,
        ).convert("RGBA")

    with Image.open(source) as opened:
        screenshot = ImageOps.contain(
            ImageOps.exif_transpose(opened).convert("RGBA"),
            (IPAD_TARGET_SIZE[0] - 720, IPAD_TARGET_SIZE[1] - 152),
            Image.Resampling.LANCZOS,
        )

    x = (IPAD_TARGET_SIZE[0] - screenshot.width) // 2
    y = (IPAD_TARGET_SIZE[1] - screenshot.height) // 2
    radius = 42

    shadow_layer = Image.new("RGBA", IPAD_TARGET_SIZE, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.rounded_rectangle(
        (x - 12, y + 12, x + screenshot.width + 12, y + screenshot.height + 28),
        radius=radius + 8,
        fill=(25, 55, 45, 76),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(22))
    background.alpha_composite(shadow_layer)

    frame = Image.new("RGBA", (screenshot.width + 16, screenshot.height + 16), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle(frame.getbbox() or (0, 0, frame.width - 1, frame.height - 1), radius=radius + 8, fill=(82, 112, 88, 255))

    mask = Image.new("L", screenshot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, screenshot.width - 1, screenshot.height - 1), radius=radius, fill=255)
    frame.paste(screenshot, (8, 8), mask)
    background.alpha_composite(frame, (x - 8, y - 8))

    destination.parent.mkdir(parents=True, exist_ok=True)
    background.convert("RGB").save(destination, "JPEG", quality=95, subsampling=0, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Petal Shift App Store screenshots.")
    parser.add_argument("source_dir", type=Path, help="Folder containing the three source screenshots")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "app-store-assets" / "screenshots" / "iphone-6.5",
    )
    args = parser.parse_args()
    source_dir = args.source_dir.resolve()
    output_dir = args.output_dir.resolve()
    files = [
        (source_dir / "WhatsApp Image 2026-07-31 at 10.09.33.jpeg", output_dir / "01-home-1242x2688.jpg"),
        (source_dir / "1.jpeg", output_dir / "02-gameplay-1242x2688.jpg"),
        (source_dir / "2.jpeg", output_dir / "03-levels-1242x2688.jpg"),
    ]
    for source, destination in files:
        prepare(source, destination)
        print(f"{destination.name}: {Image.open(destination).size}, {destination.stat().st_size} bytes")

    ipad_output_dir = output_dir.parent / "ipad-13"
    botanical_background = Path(__file__).resolve().parents[1] / "assets" / "hd" / "botanical-background.png"
    ipad_files = [
        (output_dir / "01-home-1242x2688.jpg", ipad_output_dir / "01-home-2064x2752.jpg"),
        (output_dir / "02-gameplay-1242x2688.jpg", ipad_output_dir / "02-gameplay-2064x2752.jpg"),
        (output_dir / "03-levels-1242x2688.jpg", ipad_output_dir / "03-levels-2064x2752.jpg"),
    ]
    for source, destination in ipad_files:
        prepare_ipad(source, destination, botanical_background)
        print(f"{destination.name}: {Image.open(destination).size}, {destination.stat().st_size} bytes")


if __name__ == "__main__":
    main()
