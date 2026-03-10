import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
from typing import List, Dict, Optional, Tuple
from api.config import (
    MODEL_PATH, FEATURE_COLUMNS, NUMERICAL_COLUMNS
)
from AI.src.analysis.preprocessor import create_preprocessor

class ModelService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.load_artifacts()

    def load_artifacts(self):
        """Load LightGBM model, preprocessor, and SHAP explainer."""
        try:
            self.model = lgb.Booster(model_file=MODEL_PATH)
            self.preprocessor = create_preprocessor()
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"Error loading model artifacts: {e}")
            raise RuntimeError(f"Model artifacts loading failed: {e}")

    def clean_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and map columns to English for internal consistency."""
        # Use common Bulgarian column mappings if present
        bulgarian_mapping = {
            'Отдел': 'Department',
            'Пол': 'Gender',
            'Възраст': 'Age',
            'Позиция': 'Job_Title',
            'Стаж в компанията': 'Years_At_Company',
            'Образование': 'Education_Level',
            'Представяне': 'Performance_Score',
            'Месечна заплата': 'Monthly_Salary',
            'Работни часове/седмица': 'Work_Hours_Per_Week',
            'Брой проекти': 'Projects_Handled',
            'Извънреден труд': 'Overtime_Hours',
            'Болнични дни': 'Sick_Days',
            'Дистанционна работа': 'Remote_Work_Frequency',
            'Размер на екипа': 'Team_Size',
            'Обучения (часове)': 'Training_Hours',
            'Повишения': 'Promotions'
        }
        return self.preprocessor.clean_data(df, column_mapping=bulgarian_mapping)

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Preprocess and predict churn probability."""
        # Note: preprocess() internally calls clean_data
        X = self.preprocessor.preprocess(df, column_mapping={
            'Отдел': 'Department', 'Пол': 'Gender', 'Възраст': 'Age', 'Позиция': 'Job_Title',
            'Стаж в компанията': 'Years_At_Company', 'Образование': 'Education_Level',
            'Представяне': 'Performance_Score', 'Месечна заплата': 'Monthly_Salary',
            'Работни часове/седмица': 'Work_Hours_Per_Week', 'Брой проекти': 'Projects_Handled',
            'Извънреден труд': 'Overtime_Hours', 'Болнични дни': 'Sick_Days',
            'Дистанционна работа': 'Remote_Work_Frequency', 'Размер на екипа': 'Team_Size',
            'Обучения (часове)': 'Training_Hours', 'Повишения': 'Promotions'
        })
        predictions = self.model.predict(X)
        return predictions

    def get_shap_values(self, df: pd.DataFrame) -> np.ndarray:
        """Compute SHAP values for the given data."""
        X = self.preprocessor.preprocess(df, column_mapping={
            'Отдел': 'Department', 'Пол': 'Gender', 'Възраст': 'Age', 'Позиция': 'Job_Title',
            'Стаж в компанията': 'Years_At_Company', 'Образование': 'Education_Level',
            'Представяне': 'Performance_Score', 'Месечна заплата': 'Monthly_Salary',
            'Работни часове/седмица': 'Work_Hours_Per_Week', 'Брой проекти': 'Projects_Handled',
            'Извънреден труд': 'Overtime_Hours', 'Болнични дни': 'Sick_Days',
            'Дистанционна работа': 'Remote_Work_Frequency', 'Размер на екипа': 'Team_Size',
            'Обучения (часове)': 'Training_Hours', 'Повишения': 'Promotions'
        })
        shap_vals = self.explainer.shap_values(X)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]  # Positive class
        return shap_vals

    def get_top_factors(self, employee_data: pd.Series, shap_values: np.ndarray, top_k: int = 5) -> List[Dict]:
        """Get top contributing factors based on SHAP values."""
        feature_names = self.preprocessor.get_feature_names()
        
        # Sort by absolute impact
        sorted_indices = np.argsort(np.abs(shap_values))[::-1][:top_k]
        
        top_factors = []
        for idx in sorted_indices:
            feature_name = feature_names[idx]
            top_factors.append({
                "feature": feature_name,
                "impact": float(shap_values[idx]),
                "value": employee_data[feature_name]
            })
        return top_factors

# Singleton instance
model_service = ModelService()
