import os
import requests
from PIL import Image

def generate_zoom_frames():
    # 1. Create the frames directory
    frames_dir = r"C:\Users\kiron\OneDrive\Desktop\professor-outreach\public\frames"
    os.makedirs(frames_dir, exist_ok=True)

    # 2. Download a high-quality placeholder image of an office desk
    print("Downloading base image...")
    image_url = "https://picsum.photos/seed/desk/1920/1080"
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(image_url, headers=headers)
    base_image_path = os.path.join(frames_dir, "base.jpg")
    with open(base_image_path, 'wb') as f:
        f.write(response.content)

    # 3. Load the image and define zoom parameters
    print("Generating 150 zoom frames...")
    img = Image.open(base_image_path)
    width, height = img.size
    
    num_frames = 150
    # Center of the image
    cx, cy = width / 2, height / 2

    # In frame 1, we show the whole image (scale = 1.0)
    # In frame 150, we zoom in extremely close (scale = 0.05, so we see 5% of the image)
    
    for i in range(num_frames):
        # Calculate scale (easing in from 1.0 to 0.05)
        progress = i / (num_frames - 1)
        # Using a smooth exponential-like curve for a natural camera zoom
        scale = 1.0 - (progress ** 1.5) * 0.98
        
        # Calculate the crop box
        w = width * scale
        h = height * scale
        
        # We want the zoom to drift slightly downwards to "land" on the center of the desk
        # Let's adjust the center y slightly based on progress
        current_cy = cy + (progress * height * 0.1)
        
        left = cx - w/2
        top = current_cy - h/2
        right = cx + w/2
        bottom = current_cy + h/2
        
        # Crop and resize back to original resolution to maintain quality/size consistency
        cropped = img.crop((left, top, right, bottom))
        frame = cropped.resize((width, height), Image.Resampling.LANCZOS)
        
        # Save as 0001.jpg, 0002.jpg...
        filename = f"{i+1:04d}.jpg"
        filepath = os.path.join(frames_dir, filename)
        frame.save(filepath, "JPEG", quality=85)
        
        if (i+1) % 25 == 0:
            print(f"Rendered {i+1} frames...")

    # Cleanup the base image
    if os.path.exists(base_image_path):
        os.remove(base_image_path)
    
    print("Done! All 150 frames are ready in public/frames")

if __name__ == "__main__":
    generate_zoom_frames()
