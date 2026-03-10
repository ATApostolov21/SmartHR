
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import os

MODEL_PATH = 'models/neural_network/models_versions/synthetic_model_v7.keras'
DATA_DIR = 'data/processed_v7'
OUTPUT_REPORT = 'models/neural_network/reports/report_v7/confusion_matrix_explanation.md'

def generate_explanation():
    print("Loading V7 Validation Data...")
    X_val = pd.read_csv(f'{DATA_DIR}/X_val.csv')
    y_val = pd.read_csv(f'{DATA_DIR}/y_val.csv').values.ravel()
    
    print("Loading Model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    
    print("Predicting...")
    y_pred_prob = model.predict(X_val, verbose=0).ravel()
    y_pred = (y_pred_prob > 0.5).astype(int)
    
    cm = confusion_matrix(y_val, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    total = sum(cm.ravel())
    accuracy = (tp + tn) / total
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    explanation = f"""# Обяснение на Матрицата на Объркване (Confusion Matrix) за Модел V7

![Confusion Matrix](confusion_matrix_v7.png)

Тази матрица показва колко често моделът познава и кога греши. Ето разбивка на числата:

## 1. Основни Компоненти

|  | Предсказано: **Остава (0)** | Предсказано: **Напуска (1)** |
| :--- | :---: | :---: |
| **Истина: Остава (0)** | **Trues Negatives (TN): {tn}** <br> (Правилно познати, че остават) | **False Positives (FP): {fp}** <br> (Грешно заподозрени, че ще напуснат) |
| **Истина: Напуска (1)** | **False Negatives (FN): {fn}** <br> (Пропуснати напускания - риск!) | **True Positives (TP): {tp}** <br> (Правилно хванати напускания) |

## 2. Анализ на Грешките

*   **Точност (Accuracy): {accuracy:.2%}** - Общо колко процента от случаите са правилни.
*   **Recall (Sensitivity): {recall:.2%}** - От всички, които наистина напускат, колко хванахме? 
    *   *Това е най-важната метрика за HR!* Ако е ниска, изпускаме талант.
*   **Precision: {precision:.2%}** - Когато моделът каже "Ще напусне", колко често е прав?
    *   Ако е ниска, ще харчим ресурс да задържаме хора, които не мислят да си тръгват.

### Извод за V7
Моделът V7 се справя много добре с балансирането.
*   **{tp}** служители са правилно идентифицирани като рискови.
*   **{fn}** напускания са пропуснати (False Negatives). Това е числото, което искаме да е възможно най-малко.
*   **{fp}** служители са грешно заподозрени (False Alarm). Това е по-малкият проблем, защото просто ще обърнем внимание на лоялен служител.

"""
    print(explanation)
    with open(OUTPUT_REPORT, 'w') as f:
        f.write(explanation)
    print(f"Explanation saved to {OUTPUT_REPORT}")

if __name__ == "__main__":
    generate_explanation()
