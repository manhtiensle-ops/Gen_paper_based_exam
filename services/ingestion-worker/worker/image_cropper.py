from PIL import Image

def crop_figure_box(page_image_path: str, box_2d: list[int], padding_px: int = 5) -> Image.Image:
    """
    Crops a diagram/figure from a full page image using normalized coordinates [ymin, xmin, ymax, xmax] (0-1000).
    Uses tight padding (default 5px) to strictly avoid surrounding table borders and preserve natural aspect ratio.
    """
    img = Image.open(page_image_path)
    width, height = img.size
    ymin, xmin, ymax, xmax = box_2d

    # Clamp coordinates to [0, 1000]
    ymin = max(0, min(1000, ymin))
    xmin = max(0, min(1000, xmin))
    ymax = max(0, min(1000, ymax))
    xmax = max(0, min(1000, xmax))

    left = max(0, int((xmin / 1000.0) * width) - padding_px)
    top = max(0, int((ymin / 1000.0) * height) - padding_px)
    right = min(width, int((xmax / 1000.0) * width) + padding_px)
    bottom = min(height, int((ymax / 1000.0) * height) + padding_px)

    if right <= left or bottom <= top:
        # Fallback to full image if box is degenerate
        return img

    return img.crop((left, top, right, bottom))
