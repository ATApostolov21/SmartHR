
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

data = {
    'Model': ['V5 (Base NN)', 'V6 (+Restructure)', 'V7 (Lean NN)', 'LightGBM Base', 'LightGBM Tuned'],
    'Accuracy': [0.7960, 0.8121, 0.7983, 0.8623, 0.8289],
    'AUC': [0.9188, 0.9200, 0.9118, 0.9165, 0.9165],
    'Recall': [0.9300, 0.9200, 0.9155, 0.5855, 0.8562],
    'Precision': [0.4500, 0.4700, 0.4819, 0.6501, 0.5287],
    'Feature_Count': [23, 21, 9, 9, 9]
}

df = pd.DataFrame(data)
OUTPUT_DIR = 'models/final_report'

def generate_extra_charts():
    # 3. Radar Chart (Spider Web) - Multi-metric comparison
    # Normalize data for radar chart 0-1 range roughly if needed, but percentages are fine
    
    labels = np.array(['Accuracy', 'Recall', 'Precision', 'AUC'])
    
    # Let's compare V7 (Main NN) vs LightGBM Tuned (Main Recommendation)
    v7_stats = df.loc[df['Model'] == 'V7 (Lean NN)', ['Accuracy', 'Recall', 'Precision', 'AUC']].values.flatten()
    lgbm_stats = df.loc[df['Model'] == 'LightGBM Tuned', ['Accuracy', 'Recall', 'Precision', 'AUC']].values.flatten()
    
    angles = np.linspace(0, 2*np.pi, len(labels), endpoint=False).tolist()
    
    # Close the loop
    v7_stats = np.concatenate((v7_stats, [v7_stats[0]]))
    lgbm_stats = np.concatenate((lgbm_stats, [lgbm_stats[0]]))
    angles += angles[:1]
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    
    # Plot V7
    ax.plot(angles, v7_stats, 'o-', linewidth=2, label='Neural Network V7', color='blue', alpha=0.6)
    ax.fill(angles, v7_stats, color='blue', alpha=0.1)
    
    # Plot LightGBM
    ax.plot(angles, lgbm_stats, 'o-', linewidth=2, label='LightGBM (Tuned)', color='green')
    ax.fill(angles, lgbm_stats, color='green', alpha=0.1)
    
    ax.set_thetagrids(np.degrees(angles[:-1]), labels, fontsize=12)
    ax.set_title('Holistic Feature Comparison: NN vs LightGBM', y=1.08, fontsize=15)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    
    plt.savefig(f"{OUTPUT_DIR}/radar_comparison.png", bbox_inches='tight')
    
    # 4. Complexity vs Performance (Feature Count vs Accuracy)
    plt.figure(figsize=(10, 6))
    
    # Scatter plot
    sns.scatterplot(data=df, x='Feature_Count', y='Accuracy', hue='Model', s=300, palette='deep')
    
    # Connect lines maybe? No, simplified scatter is better.
    # Add annotations
    plt.xlabel('Number of Input Features (Complexity)', fontsize=12)
    plt.ylabel('Model Accuracy', fontsize=12)
    plt.title('Efficiency Analysis: Less Data, Better Perf?', fontsize=14)
    plt.grid(True, linestyle='--', alpha=0.5)
    
    # Invert X axis to show "Efficiency" (Less is better -> towards right?) 
    # Usually right is "more". So left is better.
    # Let's keep normal but annotate.
    
    plt.text(10, 0.865, "LightGBM: High Acc / Low Data", color='green', fontweight='bold')
    plt.text(20, 0.815, "Neural Nets: High Data / Lower Acc", color='blue')
    
    plt.savefig(f"{OUTPUT_DIR}/efficiency_analysis.png")
    
    print(f"Extra charts saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    generate_extra_charts()
