"""TC 3: Computer Vision Model"""

import io

import pytest
from PIL import Image

from wdsl.services import cv_model


def _sample_screenshot_bytes():
    image = Image.new("RGB", (400, 300), color=(120, 140, 200))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.slow
def test_3_1_screenshot_is_passed_to_cv_model():
    # classify_screenshot lazy-loads the model on first call; a successful
    # return proves the screenshot bytes made it through PIL -> tensor -> model.
    result = cv_model.classify_screenshot(_sample_screenshot_bytes())
    assert isinstance(result, dict)


@pytest.mark.slow
def test_3_2_cv_model_returns_prediction_and_confidence():
    result = cv_model.classify_screenshot(_sample_screenshot_bytes())
    assert result["class"] in ("machinery", "music", "sport", "tourism")
    assert 0 <= result["confidence"] <= 100
    assert set(result["all_probabilities"].keys()) == {"machinery", "music", "sport", "tourism"}
