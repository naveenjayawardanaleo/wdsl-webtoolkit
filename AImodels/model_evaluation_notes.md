# CV Model Evaluation — Validation vs. Inference Gap

**Task 7 investigation, 2026-08-21.** Numbers, what was checked, and an honest read for the dissertation's Model Evaluation section.

## The numbers

- Base EfficientNet-B0, 10 epochs: validation accuracy plateaus around **71%** (`training_curves.png`).
- Fine-tuned model (`wdsl_cv_finetuned.pth`), 10 more epochs: validation accuracy climbs to **~83–84%** (`finetuning_curves.png`), with train/val loss both still falling smoothly at the last epoch — no obvious sign of catastrophic overfitting in the curves themselves.
- A separate held-out inference test (200 screenshots, 50 per class) scores only **68%** (`inference_confusion_matrix.png`) — roughly 15–16 points below fine-tuning validation accuracy.
- Per-class breakdown on the held-out test: tourism strongest (38/50 correct), machinery weakest, with machinery's most common error being misclassification as sport (9/50).

## What was checked

- `inference_test.png` (sample predictions, one per class) was inspected directly. All four samples are genuine full-page website screenshots — a truck-dealer site (machinery, 92.4% confidence, correct), a band's site (music, 96.6%, correct), a martial-arts/sports club site (sport, 64.0%, correct but the second-lowest-margin call of the four, with tourism as a fairly close runner-up), and a boutique inn's site (tourism, 89.6%, correct). This rules out one hypothesis worth naming and dismissing explicitly: the gap is **not** because the held-out test set is some mismatched image type (e.g. stock photos vs. real screenshots) sneaking in — visually, it's the same kind of data the model is meant to classify.
- The current inference preprocessing (`backend/wdsl/services/cv_model.py`): resize to 224×224, standard ImageNet mean/std normalization, screenshots captured full-page at a 1366×900 Playwright viewport. This is what the deployed app actually does today.
- No training script or dataset is present anywhere in this repository (checked via file search) — only the two `.pth` checkpoints and the four result images. The model was evidently trained outside this repo (a notebook environment, going by the artifact naming) and only the outputs were copied in.

## Why a root cause can't be conclusively isolated

Because the training script and the exact train/validation/test split are not preserved in version control, the most likely and most common causes of exactly this pattern (high validation accuracy, meaningfully lower true held-out accuracy) can't be directly confirmed or ruled out from the code:

1. **Train/val split leakage** — near-duplicate screenshots of the same site (e.g. multiple pages of one site, or slightly-cropped augmented copies) ending up on both sides of the split. This is the single most common cause of this exact symptom for scraped-website datasets, and is the leading suspect here, but it can't be verified without the original split manifest.
2. **Preprocessing mismatch between training and inference** — if training used a different resize/crop or was fed screenshots captured at a different resolution than the 1366×900 full-page captures the deployed app now produces, that alone would shift the input distribution at inference time.
3. **Class imbalance during training** — the held-out test set is perfectly balanced (50/50/50/50), so imbalance wouldn't fully explain the aggregate accuracy drop, but it could explain the *pattern* of errors (e.g. if "sport" was overrepresented in training, that would line up with machinery's most common error being misclassified as sport).
4. **Genuine generalization gap** — the four categories are visually fuzzy by nature (a sports-club site and a tourism/hospitality site both lean on large hero photography and similar layouts), and 200 fresh, unseen websites is a meaningfully harder test than a validation split drawn from the same collection run as training. The confusion matrix's error pattern (machinery↔sport, tourism↔machinery) looks more like real visual ambiguity between categories than a random bug.

## Recommendation for the dissertation

Report both numbers honestly: fine-tuning validation accuracy (~83–84%) is a real result of the training run, but it is not the number that reflects how the model behaves on new websites — the 68% held-out inference figure is the more honest deployment-realistic accuracy and should be the headline figure, with the gap called out and explained rather than left unremarked. State plainly that the exact root cause could not be conclusively isolated because the training script and data split are not preserved in the project repository, and recommend, as a concrete fix going forward, committing the training script and a fixed split manifest (which files went to train/val/test) so this is reproducible and auditable in any future iteration.
