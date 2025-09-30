#!/usr/bin/env python3
"""
OCR Image Analysis Script
Usage: python script.py img.jpeg
"""

import sys
import os
from PIL import Image
import pytesseract
import cv2
import numpy as np

def preprocess_image(image_path):
    """
    Preprocess the image to improve OCR accuracy
    """
    # Read image with OpenCV
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply denoising
    denoised = cv2.fastNlMeansDenoising(gray)
    
    # Apply threshold to get binary image
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return thresh

def extract_text_with_confidence(image_path):
    """
    Extract text from image with confidence scores
    """
    try:
        processed_img = preprocess_image(image_path)
        # Preprocess image
        
        # Convert back to PIL Image for pytesseract
        pil_img = Image.fromarray(processed_img)
        
        # Extract text with detailed data
        data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
        
        # Extract text with confidence
        extracted_text = []
        confidences = []
        
        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            conf = int(data['conf'][i])
            
            if text and conf > 30:  # Only include text with reasonable confidence
                extracted_text.append(text)
                confidences.append(conf)
        
        return ' '.join(extracted_text), confidences
        
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return None, []

def analyze_image_content(image_path):
    """
    Analyze the image and extract comprehensive information
    """
    print(f"Analyzing image: {image_path}")
    print("=" * 50)
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' not found.")
        return
    
    try:
        # Get image information
        with Image.open(image_path) as img:
            print(f"Image Format: {img.format}")
            print(f"Image Size: {img.size[0]}x{img.size[1]} pixels")
            print(f"Image Mode: {img.mode}")
        
        print("\n" + "=" * 50)
        print("OCR RESULTS:")
        print("=" * 50)
        
        # Extract text using simple method
        simple_text = pytesseract.image_to_string(Image.open(image_path))
        
        # Extract text with preprocessing and confidence
        processed_text, confidences = extract_text_with_confidence(image_path)
        
        if simple_text.strip():
            print("\n--- Raw OCR Output ---")
            print(simple_text)
        
        if processed_text:
            print("\n--- Processed OCR Output ---")
            print(processed_text)
            
            if confidences:
                avg_confidence = sum(confidences) / len(confidences)
                print(f"\nAverage Confidence: {avg_confidence:.2f}%")
                print(f"Min Confidence: {min(confidences)}%")
                print(f"Max Confidence: {max(confidences)}%")
        
        # Try different OCR Engine Modes (OEM) and Page Segmentation Modes (PSM)
        print("\n--- Alternative OCR Configurations ---")
        
        # PSM 6: Assume a single uniform block of text
        custom_config = r'--oem 3 --psm 6'
        alt_text = pytesseract.image_to_string(Image.open(image_path), config=custom_config)
        if alt_text.strip() and alt_text.strip() != simple_text.strip():
            print("PSM 6 (Single text block):")
            print(alt_text.strip())
        
        # PSM 8: Treat the image as a single word
        custom_config = r'--oem 3 --psm 8'
        word_text = pytesseract.image_to_string(Image.open(image_path), config=custom_config)
        if word_text.strip() and len(word_text.strip().split()) <= 3:
            print(f"\nPSM 8 (Single word): {word_text.strip()}")
        
        # Detect orientation and script
        try:
            osd = pytesseract.image_to_osd(Image.open(image_path))
            print(f"\n--- Image Orientation & Script Detection ---")
            print(osd)
        except:
            print("\n--- Could not detect orientation/script ---")
        
        if not simple_text.strip() and not processed_text:
            print("\nNo text detected in the image.")
            print("Tips:")
            print("- Ensure the image contains readable text")
            print("- Try with higher resolution images")
            print("- Check if text is in a supported language")
    
    except Exception as e:
        print(f"Error analyzing image: {e}")

def main():
    """
    Main function to handle command line arguments
    """
    if len(sys.argv) != 2:
        print("Usage: python script.py <image_file>")
        print("Example: python script.py img.jpeg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Check if tesseract is installed
    try:
        pytesseract.get_tesseract_version()
    except pytesseract.TesseractNotFoundError:
        print("Error: Tesseract OCR not found!")
        print("Please install Tesseract OCR:")
        print("- Ubuntu/Debian: sudo apt-get install tesseract-ocr")
        print("- macOS: brew install tesseract")
        print("- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
        sys.exit(1)
    
    analyze_image_content(image_path)

if __name__ == "__main__":
    main()