from PIL import Image

def crop_figure_box(page_image_path: str, box_2d: list[int], padding_px: int = 15) -> Image.Image:
    """
    Crops a diagram/figure from a full page image using normalized coordinates [ymin, xmin, ymax, xmax] (0-1000).
    Adds padding and keeps within image boundaries.
    """
    img = Image.open(page_image_path)
    width, height = img.size
    ymin, xmin, ymax, xmax = box_2d
    
    left = max(0, int((xmin / 1000.0) * width) - padding_px)
    top = max(0, int((ymin / 1000.0) * height) - padding_px)
    right = min(width, int((xmax / 1000.0) * width) + padding_px)
    bottom = min(height, int((ymax / 1000.0) * height) + padding_px)
    
    return img.crop((left, top, right, bottom))
