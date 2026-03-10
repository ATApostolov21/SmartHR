
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import os

# Paths
V6_DATA_DIR = 'data/processed_v5'
REPORT_DIR = 'models/neural_network/reports/report_v6/analysis_reports'
os.makedirs(REPORT_DIR, exist_ok=True)

def generate_correlation_heatmap():
    print("Loading V6 Data...")
    # Load just X_train to analyze feature correlations
    X_train = pd.read_csv(f'{V6_DATA_DIR}/X_train.csv')
    
    print("Calculating Correlation Matrix...")
    # Calculate correlation matrix
    corr = X_train.corr()
    
    # Setup the matplotlib figure
    plt.figure(figsize=(16, 14))
    
    # Generate a mask for the upper triangle
    mask = np.triu(np.ones_like(corr, dtype=bool))
    
    # Custom colormap
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    
    # Draw the heatmap
    sns.heatmap(corr, mask=mask, cmap=cmap, vmax=.3, center=0,
                square=True, linewidths=.5, cbar_kws={"shrink": .5},
                annot=True, fmt=".2f", annot_kws={"size": 8})
    
    plt.title('Correlation Heatmap - V6 Features (Multicollinearity Check)', fontsize=16)
    plt.tight_layout()
    
    save_path = f"{REPORT_DIR}/correlation_heatmap_v6.png"
    plt.savefig(save_path)
    print(f"Heatmap saved to {save_path}")
    
    # Identify high correlations (> 0.7 or < -0.7)
    print("\n--- High Correlations Detected (|corr| > 0.7) ---")
    
    # Unstack correlation matrix and filter
    corr_unstacked = corr.unstack()
    # Sort by absolute value
    sorted_corr = corr_unstacked.sort_values(kind="quicksort", ascending=False)
    
    # Filter for high correlations, removing self-correlations (1.0)
    high_corr = sorted_corr[((sorted_corr > 0.7) | (sorted_corr < -0.7)) & (sorted_corr != 1.0)]
    
    # Remove duplicates (A-B is same as B-A) by keeping every other one or just printing unique pairs logic
    seen_pairs = set()
    unique_high_corr = []
    
    for idx, val in high_corr.items():
        pair = tuple(sorted(idx))
        if pair not in seen_pairs:
            seen_pairs.add(pair)
            unique_high_corr.append((pair, val))
            print(f"{pair[0]} <-> {pair[1]}: {val:.4f}")
            
    # Save text report
    report_path = f"{REPORT_DIR}/collinearity_findings.md"
    with open(report_path, 'w') as f:
        f.write("# Анализ на Мултиколинеарността (V6 Features)\n\n")
        f.write("## Силно Корелирани Двойки (|corr| > 0.7)\n")
        f.write("| Характеристика 1 | Характеристика 2 | Корелация | Коментар |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        
        if not unique_high_corr:
            f.write("| Няма | Няма | - | Няма открити силни връзки. |\n")
        else:
            for pair, val in unique_high_corr:
                comment = "Потенциална редундантност"
                if "Age" in pair and "Years_At_Company" in pair:
                    comment = "Очаквана връзка (Стаж зависи от възраст)"
                elif "Overtime" in pair and "Burnout" in pair: # Check substrings
                    comment = "Инженерна зависимост (Burnout включва Overtime)"
                f.write(f"| {pair[0]} | {pair[1]} | **{val:.4f}** | {comment} |\n")
        
        f.write("\n## Извод\n")
        f.write("Този анализ показва дали имаме излишни (дублиращи се) характеристики в новия набор данни V6.\n")
        
    print(f"Findings report saved to {report_path}")

if __name__ == "__main__":
    generate_correlation_heatmap()
