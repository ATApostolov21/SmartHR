# Доклад за Обучение на Модел V6 (След PDP Преструктуриране)

## Обобщение
Модел V6 беше успешно обучен върху новия набор от данни (`processed_v5`), който включва промените базирани на PDP анализа (binning на удовлетвореността и burnout, опростяване на повишенията).

### Ключови Метрики (Validation Set)
*   **AUC (Area Under Curve):** **0.9200**
*   **Accuracy (Точност):** **81.21%**
*   **Loss (Binary Crossentropy):** **0.3477**

> [!TIP]
> Резултатът AUC от 0.92 е отличен и показва, че моделът много добре разграничава напускащите служители.

## Графики и Анализ

### 1. История на Обучението
![Training History](/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/models/neural_network/reports/report_v6/training_history_v6.png)
*   Моделът се обучава стабилно в продължение на 50 епохи.
*   Няма значително преобучение (overfitting) - кривите за Train и Val са близки.

### 2. Матрица на Объркване (Confusion Matrix)
![Confusion Matrix](/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/models/neural_network/reports/report_v6/confusion_matrix_v6.png)
*   Матрицата показва баланс между True Positives и True Negatives.

### 3. ROC Крива
![ROC Curve](/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/models/neural_network/reports/report_v6/roc_curve_v6.png)
*   Кривата е близо до горния ляв ъгъл, което потвърждава високото качество на класификатора.

## Заключение
Преструктурирането на данните доведе до създаването на robust (устойчив) и точен модел. Новите характеристики (`Satisfaction_Level`, `Burnout_Category`) вероятно помагат на модела да взема по-ясни решения в критичните зони.

**Следващи стъпки:**
*   Моделът `synthetic_model_v6.keras` е готов за използване или деплоймънт.
*   Може да се направи детайлен анализ на грешките (Error Analysis), ако е необходимо още по-висока точност.
