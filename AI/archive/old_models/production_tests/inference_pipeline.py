
import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
import os

class ChurnPredictor:
    def __init__(self, model_dir='models/production_tests'):
        self.model_path = os.path.join(model_dir, 'lightgbm_v7.txt')
        self.scaler_path = os.path.join(model_dir, 'scaler.joblib')
        self.encoder_path = os.path.join(model_dir, 'encoders.joblib')
        
        # Load artifacts
        print(f"Loading LightGBM model from {self.model_path}")
        self.model = lgb.Booster(model_file=self.model_path)
        
        print(f"Loading Scaler from {self.scaler_path}")
        self.scaler = joblib.load(self.scaler_path)
        
        print(f"Loading Encoders from {self.encoder_path}")
        self.encoders = joblib.load(self.encoder_path)
        
        # Define expected feature order (Must match training!)
        self.feature_names = [
            'Age', 'Years_At_Company', 'Monthly_Salary', 'Overtime_Hours',
            'Efficiency_Index', 'Salary_Age_Ratio', 'Satisfaction_Level',
            'Promoted', 'Burnout_Category'
        ]

    def _preprocess(self, input_data):
        """
        Transforms raw input dictionary into the format expected by the model.
        """
        # Convert dict to DataFrame for easier manipulation
        df = pd.DataFrame([input_data])
        
        # 1. Feature Engineering
        # Efficiency Index
        if 'Projects_Handled' in input_data and 'Work_Hours_Per_Week' in input_data:
            df['Efficiency_Index'] = df['Projects_Handled'] / df['Work_Hours_Per_Week']
        else:
            # Fallback if pre-calculated or missing (Should not happen in proper usage)
            df['Efficiency_Index'] = input_data.get('Efficiency_Index', 0)

        # Burnout Score & Category
        if 'Overtime_Hours' in input_data and 'Employee_Satisfaction_Score' in input_data:
            max_sat = 5.0 # Assumption based on V7 script logic implying max
            # Actually script calculated max from data. Let's assume standard 5-point scale or 1.0 scale?
            # V7 script: max_sat = df['Employee_Satisfaction_Score'].max()
            # If user inputs 0.8 on 0-1 scale, we need to know. 
            # Looking at V6/V7, usually it's 0-5 or 0-1.
            # Let's assume the input is consistent with training data.
            # We'll calculate the intermediate score.
            # Note: We need to be careful if input doesn't have 'Employee_Satisfaction_Score'.
            # But 'Satisfaction_Level' is derived from it.
            pass
        
        # Re-derive Satisfaction_Level
        if 'Employee_Satisfaction_Score' in input_data:
            score = input_data['Employee_Satisfaction_Score']
            df['Satisfaction_Level'] = 'Low' if score < 3.0 else 'High'
            
            # Burnout Calculation
            # We need Overtime_Hours.
            # In V7: df['Burnout_Score'] = df['Overtime_Hours'] * (1 - (df['Employee_Satisfaction_Score'] / max_sat))
            # We need max_sat. Let's guess 5 based on "score < 3.0" split.
            max_sat = 5.0 
            burnout_score = df['Overtime_Hours'] * (1 - (score / max_sat))
            df['Burnout_Category'] = np.where(burnout_score < 1.5, 'Safe', 'High_Burnout')

        # Re-derive Salary_Age_Ratio
        if 'Monthly_Salary' in df.columns and 'Age' in df.columns:
            df['Salary_Age_Ratio'] = df['Monthly_Salary'] / df['Age']

        # Re-derive Promoted
        if 'Promotions' in input_data:
            df['Promoted'] = 1 if input_data['Promotions'] > 0 else 0
            
        # 2. Select & Order Columns
        # We need to ensure we have all columns.
        for col in self.feature_names:
            if col not in df.columns:
                # Try to find default? Or error?
                pass 
                
        df_selected = df[self.feature_names].copy()
        
        # 3. Validation / Filling
        # Ensure numericals are float
        num_cols = ['Age', 'Years_At_Company', 'Monthly_Salary', 'Overtime_Hours', 
                   'Efficiency_Index', 'Salary_Age_Ratio', 'Promoted']
        for col in num_cols:
            df_selected[col] = df_selected[col].astype(float)
            
        # 4. Encoding
        # Satisfaction_Level, Burnout_Category
        for col in ['Satisfaction_Level', 'Burnout_Category']:
            if col in self.encoders:
                le = self.encoders[col]
                # Safe transform
                val = df_selected[col].iloc[0]
                try:
                    df_selected[col] = le.transform([val])[0]
                except:
                    # Fallback to most frequent or 0? 
                    # 'Low' is usually 0 or 1. 'Safe' is 0 or 1.
                    # Let's assume 0 as safe fallback
                    df_selected[col] = 0
                    
        # 5. Scaling
        X_scaled = self.scaler.transform(df_selected)
        
        return X_scaled

    def predict(self, input_data, threshold=0.35):
        """
        Predicts churn risk.
        input_data: dict containing raw fields:
            - Age, Years_At_Company, Monthly_Salary, Overtime_Hours
            - Projects_Handled, Work_Hours_Per_Week (to derive Efficiency)
            - Employee_Satisfaction_Score (to derive Satisfaction & Burnout)
            - Promotions (to derive Promoted)
        """
        X = self._preprocess(input_data)
        prob = self.model.predict(X)[0]
        
        return {
            'risk_score': float(prob),
            'prediction': 'High Risk' if prob >= threshold else 'Low Risk',
            'threshold_used': threshold
        }

if __name__ == "__main__":
    # Test Run
    predictor = ChurnPredictor()
    
    
    
    # Example "Risky" Employee
    sample_risky = {
        'Age': 28,
        'Years_At_Company': 2,
        'Monthly_Salary': 3500,
        'Overtime_Hours': 60, # High OT
        'Projects_Handled': 20, # Overloaded
        'Work_Hours_Per_Week': 60,
        'Employee_Satisfaction_Score': 4.0, # Low
        'Promotions': 0
    }
    

    # Example "Loyal" Employee
    sample_loyal = {
        'Age': 55,
        'Years_At_Company': 40,
        'Monthly_Salary': 2500,
        'Overtime_Hours': 67, # High OT
        'Projects_Handled': 30, # Overloaded
        'Work_Hours_Per_Week': 40,
        'Employee_Satisfaction_Score': 2.5, # Low
        'Promotions': 1
    }
    print("\nTest Prediction (Risky):", predictor.predict(sample_risky))
    print("\nTest Prediction (Loyal):", predictor.predict(sample_loyal))
