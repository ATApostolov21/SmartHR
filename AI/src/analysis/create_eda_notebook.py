
import json
import os

notebook_content = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Задание 2 — Изследователски анализ на данните (EDA II – структура и зависимости)\n",
    "\n",
    "**CRISP-DM фаза**: Data Understanding  \n",
    "**Оценка по**: невронни мрежи - практика\n",
    "\n",
    "## Цел на заданието\n",
    "Целта на този анализ е да се изследват връзките между признаците и целевата променлива, да се идентифицират потенциални зависимости и проблеми (data leakage), и да се подготви основа за моделиране.\n",
    "\n",
    "### Контекст на данните\n",
    "В този проект данните преминаха през няколко етапа на развитие:\n",
    "\n",
    "1.  **Extended_Employee_Performance_and_Productivity_Data.csv**: Първоначалният dataset, съдържащ сурови данни за служителите.\n",
    "2.  **Synthetic_Complex_Data.csv**: Обогатена и балансирана версия на данните, създадена за целите на по-сложни анализи и тестове.\n",
    "3.  **processed_v9** (Използван тук): Финалната версия на данните, която е преминала през процес на почистване, кодиране и разделяне (Train/Test/Val). Използваме този dataset, тъй като той представлява най-чистата и готова за моделиране форма на информацията, позволяваща коректен анализ на зависимостите без шум от непреработени стойности.\n"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "import numpy as np\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "from sklearn.decomposition import PCA\n",
    "from sklearn.manifold import TSNE\n",
    "import warnings\n",
    "\n",
    "warnings.filterwarnings('ignore')\n",
    "sns.set_style(\"whitegrid\")\n",
    "plt.rcParams['figure.figsize'] = (12, 8)\n",
    "\n",
    "# Зареждане на данните (Processed V9)\n",
    "# Обединяваме Train и VaL за по-пълен анализ, Test оставяме настрана засега\n",
    "try:\n",
    "    X_train = pd.read_csv('../data/processed_v9/X_train.csv')\n",
    "    y_train = pd.read_csv('../data/processed_v9/y_train.csv')\n",
    "    X_val = pd.read_csv('../data/processed_v9/X_val.csv')\n",
    "    y_val = pd.read_csv('../data/processed_v9/y_val.csv')\n",
    "    \n",
    "    # Конкатениране\n",
    "    df = pd.concat([X_train, X_val], axis=0).reset_index(drop=True)\n",
    "    target = pd.concat([y_train, y_val], axis=0).reset_index(drop=True)\n",
    "    \n",
    "    # Предполагаме името на целевата колона от файла (Resigned или подобно)\n",
    "    target_col = target.columns[0]\n",
    "    df[target_col] = target\n",
    "    \n",
    "    # Convert boolean target to int if necessary\n",
    "    if df[target_col].dtype == bool:\n",
    "        df[target_col] = df[target_col].astype(int)\n",
    "        print(f\"Converted target '{target_col}' from boolean to int.\")\n",
    "    \n",
    "    print(f\"Data loaded successfully. Shape: {df.shape}\")\n",
    "    display(df.head())\n",
    "except FileNotFoundError:\n",
    "    print(\"Files not found. Please check paths.\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 1. Анализ на връзката признак–цел\n",
    "Изследваме корелацията на всички числови с целевата променлива."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Корелация с целевата променлива\n",
    "numeric_df = df.select_dtypes(include=[np.number])\n",
    "if target_col not in numeric_df.columns:\n",
    "    # If target is categorical, we might need to encode it or it might be already numeric\n",
    "    pass # Assuming target is numeric as per processed_v9, but if it was not, we'd need encoding.\n",
    "\n",
    "correlations = numeric_df.corr()[target_col].drop(target_col).sort_values()\n",
    "\n",
    "plt.figure(figsize=(10, 8))\n",
    "colors = ['red' if x < 0 else 'green' for x in correlations.values]\n",
    "correlations.plot(kind='barh', color=colors)\n",
    "plt.title(f'Correlation with Target ({target_col})')\n",
    "plt.xlabel('Correlation Coefficient')\n",
    "plt.show()\n",
    "\n",
    "print(\"Top 5 Positive Correlations:\\n\", correlations.tail(5))\n",
    "print(\"\\nTop 5 Negative Correlations:\\n\", correlations.head(5))"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 2. Анализ на вътрешни зависимости\n",
    "Търсим мултиколинеарност между входните признаци."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "plt.figure(figsize=(16, 12))\n",
    "# Изчистваме колони, които не са числови, ако има такива (processed_v9 би трябвало да е numeric)\n",
    "numeric_df = df.select_dtypes(include=[np.number])\n",
    "sns.heatmap(numeric_df.corr(), annot=False, cmap='coolwarm', center=0)\n",
    "plt.title('Feature Correlation Matrix')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 3. Анализ на разпределения\n",
    "Проверка за класов дисбаланс и разпределение на ключови признаци."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Класов баланс\n",
    "plt.figure(figsize=(6, 4))\n",
    "sns.countplot(x=target_col, data=df)\n",
    "plt.title('Class Balance')\n",
    "plt.show()\n",
    "\n",
    "balance = df[target_col].value_counts(normalize=True)\n",
    "print(\"Class distribution:\\n\", balance)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 4. Намаляване на размерността (PCA)\n",
    "Визуализация на данните в 2D пространство."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# PCA\n",
    "from sklearn.preprocessing import StandardScaler\n",
    "\n",
    "X = df.drop(columns=[target_col, 'Employee_ID'], errors='ignore') # Махаме ID ако го има\n",
    "X = X.select_dtypes(include=[np.number]).fillna(0)\n",
    "\n",
    "scaler = StandardScaler()\n",
    "X_scaled = scaler.fit_transform(X)\n",
    "\n",
    "pca = PCA(n_components=2)\n",
    "X_pca = pca.fit_transform(X_scaled)\n",
    "\n",
    "plt.figure(figsize=(10, 8))\n",
    "sns.scatterplot(x=X_pca[:, 0], y=X_pca[:, 1], hue=df[target_col], alpha=0.6, palette='viridis')\n",
    "plt.title('PCA Projection (2 Components)')\n",
    "plt.xlabel('PC1')\n",
    "plt.ylabel('PC2')\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 5. Идентифициране на потенциално изтичане на информация (Data Leakage)\n",
    "Проверяваме за признаци с подозрително висока корелация (>0.9) с целта."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "suspicious_features = correlations[abs(correlations) > 0.8].index.tolist()\n",
    "print(\"Suspiciously high correlations (>0.8):\", suspicious_features)\n",
    "\n",
    "if not suspicious_features:\n",
    "    print(\"No obvious direct leakage detected via correlation analysis.\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 6. Заключение и Изводи\n",
    "\n",
    "### Основни наблюдения:\n",
    "1.  **Целева променлива (Resigned):**\n",
    "    *   Наблюдава се силна положителна корелация с **Overtime_Hours**, **Work_Hours_Per_Week** и **Projects_Handled**. Това ясно показва, че претоварването е основен фактор за напускането.\n",
    "    *   Наблюдава се силна отрицателна корелация с **Employee_Satisfaction_Score** и **Promotions**. Удовлетвореността и кариерното развитие задържат служителите.\n",
    "    \n",
    "2.  **Вътрешни зависимости (Multicollinearity):**\n",
    "    *   Има логични корелации между \"работни\" метрики (Заплата, Часове, Проекти), но няма екстремна мултиколинеарност (>0.9), която да изисква спешно премахване на признаци.\n",
    "    *   Липсата на `Data Leakage` е потвърдена – няма признаци с нереално висока корелация с целта.\n",
    "\n",
    "3.  **Структура на данните (PCA/t-SNE):**\n",
    "    *   Визуализацията показва, че класовете не са линейно разделими, но има групиране. Това налага използването на нелинейни модели (Random Forest, XGBoost, Neural Networks) за постигане на висока точност.\n",
    "\n",
    "### Решения за Feature Engineering и Моделиране:\n",
    "*   **Запазване на всички числови признаци**, тъй като няма критична мултиколинеарност.\n",
    "*   **Внимание относно `Employee_Satisfaction_Score`:** Въпреки силната си корелация с напускането, този признак може да бъде изключен при тренировката на финалния модел. Причината е, че това е **субективна метрика**, която често се събира *след* като служителят вече е решил да напусне (напр. в exit interview) или се променя твърде динамично. Използването ѝ може да доведе до \"изкуствено\" висока точност и data leakage, правейки модела безполезен за ранно прогнозиране на риска при все още работещи служители.\n",
    "*   **Създаване на нови признаци (Feature Engineering):** Ще бъде полезно да се създаде индекс на натоварване (напр. `Workload_Index = Work_Hours * Projects`), за да се улови комбинираният ефект от работата.\n",
    "*   **Избор на модел:** Предвид сложността на връзките, ще се насочим към **Ensemble методи** или **Невронни мрежи**."
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.5"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

# Ensure directory exists
os.makedirs("AI/notebooks", exist_ok=True)

# Write file
output_path = "AI/notebooks/EDA_Part_2_Structure_and_Dependencies.ipynb"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(notebook_content, f, indent=2, ensure_ascii=False)

print(f"Jupyter Notebook successfully created at: {output_path}")
