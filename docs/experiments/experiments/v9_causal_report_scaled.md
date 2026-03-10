# V9 Causal Model Report (Scaled 200k)

## Overview
Trained on 200,000 samples to verify scalability and production readiness.

| Model Variant | ROC AUC | Recall (Churn) | Precision (Churn) |
| :--- | :---: | :---: | :---: |
| **With Satisfaction** | 0.7302 | 0.74 | 0.48 |
| **Without Satisfaction** | 0.7321 | 0.73 | 0.49 |

## Conclusion
AUC Drop when removing Satisfaction: **-0.0020**
