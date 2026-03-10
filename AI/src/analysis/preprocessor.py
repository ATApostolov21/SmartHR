"""
Production-Ready HR Data Preprocessor for v9_causal LightGBM Model

Този модул предоставя robust preprocessing layer за интеграция на сурови HR данни
с вече обучения v9_causal модел. Включва динамично мапване на схеми, автоматично
почистване, интелигентна трансформация с graceful degradation, и comprehensive logging.

Архитектура:
- HRDataPreprocessor: Main класс за preprocessing pipeline
- Поддръжка на динамични column mappings (напр. български → английски имена)
- Автоматична imputation с trainning data медиани
- Graceful handling на неизвестни категории
- Production-ready error handling и logging

Author: Senior ML Engineer  
Date: 2026-01-20
Model: v9_causal (LightGBM without Employee_Satisfaction_Score)
"""

import logging
from typing import Dict, Optional, List
from pathlib import Path

import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, LabelEncoder


# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# PREPROCESSOR CLASS
# ============================================================================

class HRDataPreprocessor:
    """
    Production-ready preprocessor за v9_causal модел.
    
    Основни възможности:
    - Динамично мапване на колони (column_mapping параметър)
    - Автоматично почистване и премахване на нелогични записи
    - Интелигентна imputation (median за числови, 'Unknown' за категории)
    - Graceful degradation при неизвестни категории
    - Comprehensive logging за всяка операция
    
    Usage:
        preprocessor = HRDataPreprocessor(
            scaler_path='models/production/scaler_v9.joblib',
            encoders_path='models/production/encoders_v9.joblib',
            imputation_path='models/production/imputation_defaults_v9.joblib'
        )
        
        # С динамично мапване
        df_raw = pd.DataFrame([...])
        column_mapping = {'Години': 'Age', 'Отдел': 'Department'}
        X = preprocessor.preprocess(df_raw, column_mapping=column_mapping)
        
        # Прави inference
        predictions = model.predict(X)
    """
    
    # Expected features за v9_causal (БЕЗ Employee_Satisfaction_Score)
    FEATURE_COLUMNS = [
        'Department', 'Gender', 'Age', 'Job_Title', 'Years_At_Company',
        'Education_Level', 'Performance_Score', 'Monthly_Salary',
        'Work_Hours_Per_Week', 'Projects_Handled', 'Overtime_Hours',
        'Sick_Days', 'Remote_Work_Frequency', 'Team_Size',
        'Training_Hours', 'Promotions'
    ]
    
    CATEGORICAL_COLUMNS = ['Department', 'Gender', 'Job_Title', 'Education_Level']
    NUMERICAL_COLUMNS = [
        'Age', 'Years_At_Company', 'Performance_Score', 'Monthly_Salary',
        'Work_Hours_Per_Week', 'Projects_Handled', 'Overtime_Hours',
        'Sick_Days', 'Remote_Work_Frequency', 'Team_Size',
        'Training_Hours', 'Promotions'
    ]
    
    def __init__(
        self,
        scaler_path: str,
        encoders_path: str,
        imputation_path: Optional[str] = None
    ):
        """
        Инициализира preprocessor с artifacts от training.
        
        Args:
            scaler_path: Път към scaler.joblib (StandardScaler)
            encoders_path: Път към encoders.joblib (dict of LabelEncoders)
            imputation_path: Опционален път към imputation defaults
        
        Raises:
            RuntimeError: Ако artifacts не могат да бъдат заредени
        """
        logger.info("Initializing HRDataPreprocessor...")
        
        try:
            # Load scaler
            self.scaler: StandardScaler = joblib.load(scaler_path)
            logger.info(f"✓ Loaded StandardScaler from {scaler_path}")
            
            # Load encoders
            self.encoders: Dict[str, LabelEncoder] = joblib.load(encoders_path)
            logger.info(f"✓ Loaded {len(self.encoders)} LabelEncoders from {encoders_path}")
            
            # Load imputation defaults (optional)
            if imputation_path and Path(imputation_path).exists():
                self.imputation_defaults: Dict[str, float] = joblib.load(imputation_path)
                logger.info(f"✓ Loaded imputation defaults from {imputation_path}")
            else:
                logger.warning("⚠️  No imputation defaults provided. Will compute on-the-fly.")
                self.imputation_defaults = None
            
            logger.info("✓ HRDataPreprocessor initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to load artifacts: {str(e)}")
            raise RuntimeError(f"Artifact loading failed: {str(e)}")
    
    def clean_data(
        self,
        df: pd.DataFrame,
        column_mapping: Optional[Dict[str, str]] = None
    ) -> pd.DataFrame:
        """
        Почиства и подготвя данни за трансформация.
        
        Стъпки:
        1. Прилага column_mapping (ако е даден)
        2. Валидира наличието на всички задължителни колони
        3. Премахва нелогични записи (Age < 18, отрицателни стойности)
        4. Импутира липсващи стойности
        
        Args:
            df: Сурови данни (pandas DataFrame)
            column_mapping: Опционален dict за преименуване на колони
                           Пример: {'Години': 'Age', 'Отдел': 'Department'}
        
        Returns:
            pd.DataFrame: Почистени данни с правилни колонни имена
        
        Raises:
            ValueError: Ако критична колона липсва и не може да бъде мапната
        """
        logger.info(f"Starting data cleaning for {len(df)} records...")
        df_clean = df.copy()
        initial_count = len(df_clean)
        
        # Step 1: Apply column mapping
        if column_mapping:
            logger.info(f"Applying column mapping: {column_mapping}")
            df_clean = df_clean.rename(columns=column_mapping)
        
        # Step 2: Validate required columns
        missing_cols = set(self.FEATURE_COLUMNS) - set(df_clean.columns)
        if missing_cols:
            error_msg = f"Critical columns missing: {missing_cols}. Cannot proceed."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Ensure we only keep expected columns (drop extras)
        df_clean = df_clean[self.FEATURE_COLUMNS].copy()
        
        # Step 3: Remove illogical records
        logger.info("Removing illogical records...")
        
        # Age validation (18-70 reasonable range for employees)
        age_invalid = (df_clean['Age'] < 18) | (df_clean['Age'] > 70)
        if age_invalid.any():
            logger.warning(f"Removing {age_invalid.sum()} records with invalid Age")
            df_clean = df_clean[~age_invalid]
        
        # Negative values validation
        for col in self.NUMERICAL_COLUMNS:
            if col == 'Age':  # Already handled
                continue
            negative_mask = df_clean[col] < 0
            if negative_mask.any():
                logger.warning(f"Removing {negative_mask.sum()} records with negative {col}")
                df_clean = df_clean[~negative_mask]
        
        # Salary validation (must be positive)
        salary_invalid = df_clean['Monthly_Salary'] <= 0
        if salary_invalid.any():
            logger.warning(f"Removing {salary_invalid.sum()} records with invalid Monthly_Salary")
            df_clean = df_clean[~salary_invalid]
        
        removed_count = initial_count - len(df_clean)
        if removed_count > 0:
            logger.info(f"✓ Removed {removed_count} illogical records ({removed_count/initial_count*100:.1f}%)")
        
        # Step 4: Impute missing values
        logger.info("Handling missing values...")
        
        # Numerical: use median
        for col in self.NUMERICAL_COLUMNS:
            if df_clean[col].isna().any():
                missing_count = df_clean[col].isna().sum()
                
                # Use pre-computed median or compute from data
                if self.imputation_defaults and col in self.imputation_defaults:
                    median_val = self.imputation_defaults[col]
                else:
                    median_val = df_clean[col].median()
                    logger.warning(f"No pre-computed median for {col}, using data median: {median_val}")
                
                df_clean[col].fillna(median_val, inplace=True)
                logger.warning(f"⚠️  Filled {missing_count} missing values in '{col}' with median={median_val}")
        
        # Categorical: use 'Unknown' or mode
        for col in self.CATEGORICAL_COLUMNS:
            if df_clean[col].isna().any():
                missing_count = df_clean[col].isna().sum()
                
                # Use pre-computed mode or 'Unknown'
                if self.imputation_defaults and col in self.imputation_defaults:
                    default_val = self.imputation_defaults[col]
                else:
                    default_val = 'Unknown'
                    logger.warning(f"No pre-computed mode for {col}, using 'Unknown'")
                
                df_clean[col].fillna(default_val, inplace=True)
                logger.warning(f"⚠️  Filled {missing_count} missing values in '{col}' with '{default_val}'")
        
        logger.info(f"✓ Data cleaning complete. {len(df_clean)} records ready for transformation.")
        return df_clean
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """
        Трансформира почистени данни в model-ready format.
        
        Стъпки:
        1. Прилага LabelEncoder за категории (с graceful degradation)
        2. Подрежда колоните в очаквания ред
        3. Прилага StandardScaler
        
        Args:
            df: Почистени данни (от clean_data метода)
        
        Returns:
            np.ndarray: Scaled features готови за модела
        
        Raises:
            RuntimeError: Ако трансформацията фейлне критично
        """
        logger.info(f"Transforming {len(df)} records...")
        df_transformed = df.copy()
        
        # Step 1: Encode categorical columns
        logger.info("Encoding categorical columns...")
        
        for col in self.CATEGORICAL_COLUMNS:
            if col not in self.encoders:
                logger.warning(f"⚠️  No encoder found for '{col}'. Skipping encoding.")
                continue
            
            encoder = self.encoders[col]
            
            # Handle each value individually with graceful degradation
            encoded_values = []
            for idx, val in enumerate(df_transformed[col]):
                val_str = str(val)  # Ensure string type
                
                try:
                    # Try to encode normally
                    encoded_val = encoder.transform([val_str])[0]
                    encoded_values.append(encoded_val)
                    
                except ValueError:
                    # Unknown category - map to first class (index 0)
                    logger.warning(
                        f"⚠️  Unknown category '{val_str}' in '{col}' (row {idx}). "
                        f"Mapping to '{encoder.classes_[0]}' (index 0)."
                    )
                    encoded_values.append(0)  # Default to first class
            
            df_transformed[col] = encoded_values
        
        # Step 2: Ensure correct column order
        df_transformed = df_transformed[self.FEATURE_COLUMNS]
        
        # Step 3: Apply scaling ONLY to numerical columns
        logger.info("Applying StandardScaler to numerical columns...")
        try:
            # Scale only numerical columns
            numerical_data = df_transformed[self.NUMERICAL_COLUMNS].values
            scaled_numerical = self.scaler.transform(numerical_data)
            
            # Create the final array with correct column order
            # First, get categorical encoded values
            categorical_data = df_transformed[self.CATEGORICAL_COLUMNS].values
            
            # Rebuild in the order of FEATURE_COLUMNS
            result_columns = []
            num_idx = 0
            cat_idx = 0
            
            for col in self.FEATURE_COLUMNS:
                if col in self.CATEGORICAL_COLUMNS:
                    result_columns.append(categorical_data[:, self.CATEGORICAL_COLUMNS.index(col)])
                else:
                    result_columns.append(scaled_numerical[:, self.NUMERICAL_COLUMNS.index(col)])
            
            X_final = np.column_stack(result_columns)
            
            logger.info(f"✓ Transformation complete. Shape: {X_final.shape}")
            return X_final
            
        except Exception as e:
            logger.error(f"Scaling failed: {str(e)}")
            raise RuntimeError(f"Scaling error: {str(e)}")
    
    def preprocess(
        self,
        df: pd.DataFrame,
        column_mapping: Optional[Dict[str, str]] = None
    ) -> np.ndarray:
        """
        Convenience метод за end-to-end preprocessing.
        
        Комбинира clean_data() + transform() в една стъпка.
        
        Args:
            df: Сурови данни
            column_mapping: Опционален dict за преименуване на колони
        
        Returns:
            np.ndarray: Model-ready scaled features
        
        Example:
            >>> preprocessor = HRDataPreprocessor(...)
            >>> raw_data = pd.DataFrame([{'Години': 35, 'Отдел': 'IT', ...}])
            >>> X = preprocessor.preprocess(raw_data, {'Години': 'Age', 'Отдел': 'Department'})
            >>> predictions = model.predict(X)
        """
        logger.info("="*60)
        logger.info("STARTING PREPROCESSING PIPELINE")
        logger.info("="*60)
        
        # Clean
        df_clean = self.clean_data(df, column_mapping=column_mapping)
        
        # Transform
        X = self.transform(df_clean)
        
        logger.info("="*60)
        logger.info("PREPROCESSING COMPLETE")
        logger.info("="*60)
        
        return X
    
    def get_feature_names(self) -> List[str]:
        """Връща списък с очакваните feature имена."""
        return self.FEATURE_COLUMNS.copy()
    
    def get_categorical_columns(self) -> List[str]:
        """Връща списък с категориалните колони."""
        return self.CATEGORICAL_COLUMNS.copy()
    
    def get_numerical_columns(self) -> List[str]:
        """Връща списък с числовите колони."""
        return self.NUMERICAL_COLUMNS.copy()


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def create_preprocessor(
    artifacts_dir: str = 'AI/production'
) -> HRDataPreprocessor:
    """
    Factory function за създаване на preprocessor с default paths.
    
    Args:
        artifacts_dir: Директория с artifacts (default: 'models/production')
    
    Returns:
        HRDataPreprocessor: Инициализиран preprocessor
    
    Example:
        >>> preprocessor = create_preprocessor()
        >>> X = preprocessor.preprocess(df)
    """
    scaler_path = f"{artifacts_dir}/scaler_v9.joblib"
    encoders_path = f"{artifacts_dir}/encoders_v9.joblib"
    imputation_path = f"{artifacts_dir}/imputation_defaults_v9.joblib"
    
    return HRDataPreprocessor(
        scaler_path=scaler_path,
        encoders_path=encoders_path,
        imputation_path=imputation_path
    )


# ============================================================================
# MAIN (for testing)
# ============================================================================

if __name__ == "__main__":
    print("="*60)
    print("HR DATA PREPROCESSOR - DEMO")
    print("="*60)
    
    # Initialize preprocessor
    preprocessor = create_preprocessor()
    
    # Create sample data
    sample_data = pd.DataFrame([
        {
            'Department': 'IT',
            'Gender': 'Male',
            'Age': 35,
            'Job_Title': 'Senior',
            'Years_At_Company': 5,
            'Education_Level': 'Master',
            'Performance_Score': 3,
            'Monthly_Salary': 7500.0,
            'Work_Hours_Per_Week': 45,
            'Projects_Handled': 12,
            'Overtime_Hours': 10,
            'Sick_Days': 3,
            'Remote_Work_Frequency': 50,
            'Team_Size': 8,
            'Training_Hours': 40,
            'Promotions': 1
        },
        {
            'Department': 'Sales',
            'Gender': 'Female',
            'Age': 28,
            'Job_Title': 'Junior',
            'Years_At_Company': 2,
            'Education_Level': 'Bachelor',
            'Performance_Score': 4,
            'Monthly_Salary': 4500.0,
            'Work_Hours_Per_Week': 40,
            'Projects_Handled': 5,
            'Overtime_Hours': 20,
            'Sick_Days': 5,
            'Remote_Work_Frequency': 20,
            'Team_Size': 12,
            'Training_Hours': 30,
            'Promotions': 0
        }
    ])
    
    # Preprocess
    X = preprocessor.preprocess(sample_data)
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(f"Input shape: {sample_data.shape}")
    print(f"Output shape: {X.shape}")
    print(f"Output dtype: {X.dtype}")
    print(f"\nFirst sample (scaled):\n{X[0][:5]}... (first 5 features)")
    print("\n✓ Preprocessor is ready for production use!")
