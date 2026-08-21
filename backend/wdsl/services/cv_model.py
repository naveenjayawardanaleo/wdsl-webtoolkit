import io
import json
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODEL_PATH = BASE_DIR / "AImodels" / "wdsl_cv_finetuned.pth"
CLASS_MAPPING_PATH = BASE_DIR / "AImodels" / "class_mapping.json"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IMAGE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

_model = None
_classes = None


def is_model_loaded():
    return _model is not None


def load_model():
    global _model, _classes

    with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
        class_mapping = json.load(f)
    _classes = [class_mapping[str(i)] for i in range(len(class_mapping))]

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
    num_classes = checkpoint.get("num_classes", len(_classes))

    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    _model = model


def classify_screenshot(screenshot_bytes):
    if _model is None:
        load_model()

    image = Image.open(io.BytesIO(screenshot_bytes)).convert("RGB")
    tensor = IMAGE_TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = _model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        confidence, predicted_idx = torch.max(probabilities, dim=0)

    return {
        "class": _classes[predicted_idx.item()],
        "confidence": round(confidence.item() * 100, 2),
        "all_probabilities": {
            _classes[i]: round(p.item() * 100, 2) for i, p in enumerate(probabilities)
        },
    }
