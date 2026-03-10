import json

cells = []

def add_markdown(source):
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [s + "\\n" for s in source.split("\\n")]
    })

def add_code(source):
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [s + "\\n" for s in source.split("\\n")]
    })

add_markdown("# Сравнение и развитие на невронни мрежи\\n\\nТази тетрадка показва прогресията от базов модел (v1) до окончателен модел (v7).")
add_code("import pandas as pd\\nimport tensorflow as tf\\nfrom sklearn.metrics import classification_report, confusion_matrix\\nimport os")
add_markdown("Горната клетка зарежда основните библиотеки.")
add_code("data_path = '../../dataset/Extended_Employee_Performance_and_Productivity_Data.csv'\\ndf = pd.read_csv(data_path)")
add_markdown("В тази клетка зареждаме данните.")
add_markdown("## Архитектура и Обосновка (Критерии 1 и 2)\\nМногослойна перцептронна архитектура (MLP) е избрана за нелинейни зависимости при таблични данни.")
add_code("from sklearn.tree import DecisionTreeClassifier\\n# Обучение на базов модел Decision Tree за сравнение (Критерий 8)\\ndt = DecisionTreeClassifier(max_depth=10, random_state=42)\\ndt.fit(X_train_scaled, y_train)\\ny_pred_dt = dt.predict(X_test_scaled)\\ny_proba_dt = dt.predict_proba(X_test_scaled)[:, 1]\\n\\n# Оценка на моделите върху тестовия сет\\nresults = {}\\n\\n# Добавяне на Decision Tree към резултатите\\nresults['Decision Tree (Baseline)'] = {\\n    'AUC': roc_auc_score(y_test, y_proba_dt),\\n    'Accuracy': accuracy_score(y_test, y_pred_dt)\\n}\\n\\nfor v, model in loaded_models.items():\\n    y_pred_probs = model.predict(X_test_scaled, verbose=0)\\n    y_pred_classes = (y_pred_probs > 0.5).astype(int)\\n    \\n    auc_val = roc_auc_score(y_test, y_pred_probs)\\n    acc = accuracy_score(y_test, y_pred_classes)\\n    results[f'NN_{v}'] = {'AUC': auc_val, 'Accuracy': acc}\\n\\nresults_df = pd.DataFrame(results).T\\ndisplay(results_df)\\n\\nresults_df.plot(kind='bar', figsize=(12, 6))\\nplt.title('Сравнение на всички NN версии с базовия модел Decision Tree (Критерий 8)')\\nplt.ylabel('Метрики')\\nplt.ylim([0, 1])\\nplt.xticks(rotation=45)\\nplt.legend(loc='lower right')\\nplt.tight_layout()\\nplt.show()")
add_markdown("В тази клетка изчисляваме ключовите метрики върху тестовото (невиждано до момента) множество. Използвахме метрики като Accuracy и AUC (Area Under Curve), за да получим обективна оценка (**Критерий 7: Оценка на модела**).\\nПриложената графика отговаря на **Критерий 8: Сравнение с базовите модели**. Тук специфично тренираме Дърво на Решенията (Decision Tree) със същите параметри като в `assignment_5_base_models.ipynb`, за да видим директното подобрение, което постигат Невронните Мрежи (v1-v7) спрямо първоначално избрания Baseline модел.")

nb = {
    "cells": cells,
    "metadata": {},
    "nbformat": 4,
    "nbformat_minor": 5
}

with open('/Users/apostolov31/Desktop/2526-dzi-ai-ATApostolov21/AI/archive/old_models/neural_network/notebooks/nn_versions_comparison.ipynb', 'w') as f:
    json.dump(nb, f, indent=2)
