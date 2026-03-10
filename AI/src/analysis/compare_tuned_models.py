
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Data Points
# NN Tuned Data (from previous analysis): Threshold 0.70 -> Recall 81.55%, Precision 54.33%, Accuracy ~80-81% (Let's calculate Acc accurately or estimate)
# Acc calculation: 
# Total = 15000 approx (from validation set size in logs)
# Leavers (Pos) = 2830
# Stayers (Neg) = 12170
# NN @ 0.70:
# TP = 2830 * 0.8155 = 2308
# FP = TP / 0.5433 - TP = 4248 - 2308 = 1940
# TN = 12170 - 1940 = 10230
# FN = 2830 - 2308 = 522
# Accuracy = (2308 + 10230) / 15000 = 12538 / 15000 = 83.58%

# LightGBM Tuned Data (from previous analysis T=0.35): Recall 85.62%, Precision 52.87%, Accuracy 82.89%

data = {
    'Model': ['Neural Network (Tuned T=0.70)', 'LightGBM (Tuned T=0.35)'],
    'Accuracy': [0.8358, 0.8289],
    'Recall': [0.8155, 0.8562],
    'Precision': [0.5433, 0.5287],
    'Features': [9, 9]
}

df = pd.DataFrame(data)
OUTPUT_DIR = 'models/final_report/head_to_head'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_head_to_head():
    # Bar Chart Comparison
    metrics = ['Accuracy', 'Recall', 'Precision']
    
    # Melt for seaborn
    df_melt = df.melt(id_vars='Model', value_vars=metrics, var_name='Metric', value_name='Score')
    
    plt.figure(figsize=(10, 6))
    sns.barplot(data=df_melt, x='Metric', y='Score', hue='Model', palette=['#3498db', '#2ecc71'])
    
    plt.ylim(0.4, 1.0)
    plt.title('Ultimate Battle: Tuned NN vs Tuned LightGBM', fontsize=14)
    plt.ylabel('Score (Higher is better)')
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.legend(loc='lower right')
    
    # Annotate bars
    for p in plt.gca().patches:
        h = p.get_height()
        if h > 0:
            plt.gca().text(p.get_x() + p.get_width()/2, h + 0.01, f'{h:.1%}', ha='center', fontsize=10, fontweight='bold')
            
    plt.savefig(f"{OUTPUT_DIR}/tuned_nn_vs_lgbm.png")
    
    # Generate Report
    report = """# Финален Сблъсък: Tuned NN vs Tuned LightGBM

И двата модела са оптимизирани чрез настройка на прага (Threshold Tuning). Ето резултатите:

| Метрика | Neural Network (T=0.70) | LightGBM (T=0.35) | Победител |
| :--- | :---: | :---: | :--- |
| **Accuracy** | **83.58%** | 82.89% | 🔵 **NN (+0.7%)** |
| **Precision** | **54.33%** | 52.87% | 🔵 **NN (+1.5%)** |
| **Recall** | 81.55% | **85.62%** | 🟢 **LightGBM (+4.1%)** |

## Анализ на Разликите

1.  **Neural Network (T=0.70) е "По-прецизният":**
    *   Той е малко по-внимателен. Ако каже "Риск", шансът да е прав е 54.3%.
    *   **Цена:** Изпуска малко повече хора (Recall 81.5% срещу 85.6%).

2.  **LightGBM (T=0.35) е "По-обхватният":**
    *   Той хваща **4% повече** от напускащите служители. В HR контекст, това са десетки хора, които иначе бихме изпуснали.
    *   **Цена:** Малко по-шумен е (Precision 52.9%).

## 🏆 Крайна Препоръка

**Изборът зависи от вашата стратегия:**

*   **Стратегия "Safety First" (Безопасност):** Ако най-големият ви страх е да изгубите ключов човек -> Изберете **LightGBM** (заради по-високия Recall).
*   **Стратегия "Efficiency" (Ефективност):** Ако HR екипът е малък и не може да проверява много сигнали -> Изберете **Neural Network** (заради по-високата Precision).

*Лично мнение:* Разликата в точността е минимална (<1%), но разликата в **Recall (+4%)** при LightGBM е значителна. Бих заложил на **LightGBM**, защото "цената" на изпуснатия талант обикновено е по-висока от цената на един излишен разговор.
"""
    with open(f"{OUTPUT_DIR}/final_decision.md", "w") as f:
        f.write(report)
    print(f"Comparison saved to {OUTPUT_DIR}/final_decision.md")

if __name__ == "__main__":
    generate_head_to_head()
