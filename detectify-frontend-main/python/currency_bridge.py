import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

# Use ultralytics YOLO instead of local code
from ultralytics import YOLO


def normalize_label(raw_label):
    text = str(raw_label).strip()
    numbers = re.findall(r"\d+", text)
    if not numbers:
        return text
    if len(numbers) == 1:
        return numbers[0]
    # Labels like "1- 10 Rupees" should return the actual denomination, not the class index.
    return numbers[-1]


def detect_objects(image_path: str, model_path: str, is_currency=False):
    model = YOLO(model_path)
    
    results = model.predict(
        image_path,
        conf=0.25,
        iou=0.45,
        max_det=1000,
        verbose=False,
        show=False,
        save=False,
    )
    
    detections = []
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                cls = int(box.cls[0].cpu().numpy())
                label = result.names[cls] if result.names else str(cls)
                if is_currency:
                    label = normalize_label(label)
                detections.append({
                    "label": label,
                    "confidence": round(float(conf) * 100, 1),
                    "box": [float(x1), float(y1), float(x2), float(y2)]
                })
    
    if is_currency:
        if not detections:
            return {
                "note": "No Matches",
                "confidence": 0,
                "status": "No currency note was detected by the YOLO model.",
                "matchedTemplate": Path(model_path).name,
                "goodMatches": 0,
                "detections": [],
            }
        top = max(detections, key=lambda x: x["confidence"])
        return {
            "note": top["label"],
            "confidence": top["confidence"],
            "status": "Currency note detected successfully.",
            "matchedTemplate": Path(model_path).name,
            "goodMatches": len(detections),
            "detections": detections,
        }
    else:
        return {
            "detections": detections
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--currency", action="store_true")
    args = parser.parse_args()

    result = detect_objects(args.image, args.model_path, args.currency)
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
