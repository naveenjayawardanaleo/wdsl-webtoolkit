"""Task 2: draw numbered bounding boxes over each violation's affected
element on a copy of the captured screenshot, for the developer's
technical report view."""

import io

from PIL import Image, ImageDraw, ImageFont

BOX_COLOR = (220, 38, 38)
LABEL_BG = (220, 38, 38)
LABEL_FG = (255, 255, 255)


def _load_font(size=16):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


def annotate_screenshot(screenshot_bytes, violations):
    image = Image.open(io.BytesIO(screenshot_bytes)).convert("RGB")
    draw = ImageDraw.Draw(image)
    font = _load_font()

    marker_number = 1
    for violation in violations:
        for element in violation.get("affected_elements", []):
            box = element.get("bounding_box")
            if not box:
                continue
            x, y, w, h = box.get("x"), box.get("y"), box.get("width"), box.get("height")
            if None in (x, y, w, h) or w <= 0 or h <= 0:
                continue

            rect = [x, y, x + w, y + h]
            draw.rectangle(rect, outline=BOX_COLOR, width=3)

            label = str(marker_number)
            text_bbox = draw.textbbox((0, 0), label, font=font)
            text_w = text_bbox[2] - text_bbox[0]
            text_h = text_bbox[3] - text_bbox[1]
            label_box = [x, max(0, y - text_h - 6), x + text_w + 8, max(text_h + 6, y)]
            draw.rectangle(label_box, fill=LABEL_BG)
            draw.text((label_box[0] + 4, label_box[1] + 2), label, fill=LABEL_FG, font=font)

            marker_number += 1

    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()
