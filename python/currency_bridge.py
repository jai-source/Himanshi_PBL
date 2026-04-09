import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

# Add repository root to Python path so the local YOLOv5 code is used
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from models.common import DetectMultiBackend
from utils.general import (check_img_size, letterbox, non_max_suppression, scale_boxes)
from utils.torch_utils import select_device


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
    global device
    device = select_device("")
    model = DetectMultiBackend(model_path, device=device, dnn=False, data=None, fp16=False)
    stride, names = model.stride, model.names
    imgsz = check_img_size((640, 640), s=stride)

    image = Image.open(image_path).convert("RGB")
    original_shape = image.size[::-1]  # (height, width)
    image = np.asarray(image)[:, :, ::-1]  # RGB to BGR
    image = np.ascontiguousarray(image)
    image = letterbox(image, imgsz, stride=stride, auto=True)[0]
    image = image.transpose((2, 0, 1))[None]
    image = np.ascontiguousarray(image)
    im = torch.from_numpy(image).to(device).float() / 255.0

    if im.ndimension() == 3:
        im = im.unsqueeze(0)

    with torch.no_grad():
        pred = model(im)

    pred = non_max_suppression(pred, 0.25, 0.45, max_det=1000)[0]

    detections = []
    if pred is not None and len(pred):
        pred[:, :4] = scale_boxes(im.shape[2:], pred[:, :4], original_shape).round()
        for *xyxy, conf, cls in pred.tolist():
            class_index = int(cls)
            label = names[class_index]
            if is_currency:
                label = normalize_label(label)
            detections.append({
                "label": label,
                "confidence": round(float(conf) * 100, 1),
                "box": [float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])],
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
