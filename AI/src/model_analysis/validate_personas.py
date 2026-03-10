
import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
import matplotlib.pyplot as plt
import os


# Config
MODEL_PATH = 'models/production/v9_causal.txt'
DATA_DIR = 'data/processed_v9'

# Thresholds for 3-tier categorization
THRESH_LOW = 0.35
THRESH_HIGH = 0.65

def load_resources():
    print(f"Loading model from {MODEL_PATH}...")
    model = lgb.Booster(model_file=MODEL_PATH)
    return model

def create_personas():
    # Base columns (defaults)
    defaults = {
        'Department': 'Engineering',
        'Gender': 'Male',
        'Age': 30,
        'Job_Title': 'Senior',
        'Years_At_Company': 3,
        'Education_Level': 'Master',
        'Performance_Score': 3,
        'Monthly_Salary': 7000, # Market avg for Senior
        'Work_Hours_Per_Week': 40,
        'Projects_Handled': 5,
        'Overtime_Hours': 0,
        'Sick_Days': 2,
        'Remote_Work_Frequency': 50,
        'Team_Size': 5,
        'Training_Hours': 20,
        'Promotions': 0
    }
    
    personas = []
    
    # 1. The Burnout
    p1 = defaults.copy()
    p1['Name'] = "The Burnout"
    p1['Overtime_Hours'] = 60
    p1['Projects_Handled'] = 15
    p1['Work_Hours_Per_Week'] = 100 # implied total
    p1['Performance_Score'] = 4
    personas.append(p1)
    
    # 2. The Underpaid Star
    p2 = defaults.copy()
    p2['Name'] = "The Underpaid Star"
    p2['Performance_Score'] = 5
    p2['Monthly_Salary'] = 4000 # Very low for Senior
    p2['Promotions'] = 0
    personas.append(p2)
    
    # 3. The Stagnating Vet
    p3 = defaults.copy()
    p3['Name'] = "The Stagnating Vet"
    p3['Years_At_Company'] = 7
    p3['Promotions'] = 0
    p3['Monthly_Salary'] = 7000
    personas.append(p3)
    
    # 4. The Mercenary (High Paid Workaholic)
    p4 = defaults.copy()
    p4['Name'] = "The Mercenary"
    p4['Overtime_Hours'] = 50
    p4['Monthly_Salary'] = 12000 # High
    p4['Promotions'] = 1
    personas.append(p4)
    
    # 5. The Happy Lifer
    p5 = defaults.copy()
    p5['Name'] = "The Happy Lifer"
    p5['Overtime_Hours'] = 0
    p5['Monthly_Salary'] = 8000
    p5['Promotions'] = 2
    p5['Years_At_Company'] = 5
    personas.append(p5)
    
    # 6. The Rapid Riser (High potential risk if they leave?)
    p6 = defaults.copy()
    p6['Name'] = "The Rapid Riser"
    p6['Age'] = 26
    p6['Years_At_Company'] = 2
    p6['Promotions'] = 2 
    p6['Performance_Score'] = 5
    personas.append(p6)

    # 7. The Remote Worker
    p7 = defaults.copy()
    p7['Name'] = "The Remote Worker"
    p7['Remote_Work_Frequency'] = 100
    p7['Team_Size'] = 10 # Larger team, remote
    personas.append(p7)

    # 8. The Average Joe
    p8 = defaults.copy()
    p8['Name'] = "The Average Joe"
    # Defaults are already average-ish, but let's explicate
    personas.append(p8)
    
    return personas

def validate():
    if not os.path.exists(MODEL_PATH):
        print("Model file not found. Run training first.")
        return

    model = load_resources()
    personas = create_personas()
    
    # Convert to DataFrame
    df = pd.DataFrame(personas)
    names = df['Name']
    X = df.drop(columns=['Name'])
    
    # Categorical handling (LGBM handles it if set as category)
    cat_cols = ['Department', 'Gender', 'Job_Title', 'Education_Level']
    for col in cat_cols:
        X[col] = X[col].astype('category')
        
    print(f"\n--- Validation Results (3-Tier) ---")
    print(f"Low < {THRESH_LOW:.2f} | Medium {THRESH_LOW:.2f}-{THRESH_HIGH:.2f} | High > {THRESH_HIGH:.2f}")
    preds = model.predict(X)
    
    for name, prob in zip(names, preds):
        if prob < THRESH_LOW:
            status = "🟢 LOW RISK"
        elif prob < THRESH_HIGH:
            status = "🟡 MEDIUM RISK"
        else:
            status = "🔴 HIGH RISK"
            
        print(f"Persona: {name:<25} | Churn Prob: {prob:.2%} | {status}")
        
    print("\n--- SHAP Explanations ---")
    # Note: For strict SHAP reproducibility, we should use the same background dataset, 
    # but TreeExplainer on Booster often works without it for feature contributions.
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)
        
        # Handle shape
        if isinstance(shap_values, list):
            vals = shap_values[1]
        else:
            vals = shap_values
            
        # Print top feature for each
        feature_names = X.columns.tolist()
        
        for i, name in enumerate(names):
            print(f"\nWhy {name}?")
            sv = vals[i]
            # Get top 3 positive and negative contributors
            indices = np.argsort(np.abs(sv))[::-1][:3]
            for idx in indices:
                feat = feature_names[idx]
                val = X.iloc[i][feat]
                impact = sv[idx]
                direction = "+" if impact > 0 else "-"
                print(f"  - {feat} ({val}): {direction}{abs(impact):.2f}")
                
    except Exception as e:
        print(f"SHAP Error: {e}")

if __name__ == "__main__":
    validate()
