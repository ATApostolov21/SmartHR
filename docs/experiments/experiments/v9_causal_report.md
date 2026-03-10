# V9 Causal Model Report

## Hypothesis
By generating data where Churn is caused by *latent risks* (Overtime, Salary) rather than just Satisfaction, the model should maintain high Recall/AUC even when `Satisfaction_Score` is removed.

## Results Comparison

| Model Variant | ROC AUC | Recall (Churn) | Precision (Churn) | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **With Satisfaction** | 0.7108 | 0.78 | 0.45 | 0.58 |
| **Without Satisfaction** | 0.7112 | 0.80 | 0.45 | 0.57 |

## Analysis
✅ **SUCCESS:** The model remained robust! AUC drop was only -0.0004. Recall without Satisfaction is 0.80.

## Feature Importance (No Satisfaction)

| Feature | Importance |
| :--- | :---: |
| Monthly_Salary | 2510 |
| Training_Hours | 1694 |
| Age | 1417 |
| Overtime_Hours | 1252 |
| Projects_Handled | 1177 |
| Years_At_Company | 1101 |
| Sick_Days | 1050 |
| Team_Size | 992 |
| Work_Hours_Per_Week | 873 |
| Performance_Score | 838 |
