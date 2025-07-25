import pandas as pd
import os
from typing import List, Dict, Any
from functools import lru_cache

class DataProcessor:
    """Handles data processing from CIP Combined.xlsx file"""
    
    def __init__(self, excel_file_path: str):
        self.excel_file_path = excel_file_path
        self.cleaning_process_mapping = {
            'A': 0,
            'A/VR': 1002.32,
            'VR': 1002.32,
            'CIP 3': 2860.15,
            'CIP 5': 7500,
            'H': 5,
            'K': 6
        }
        self._validate_file_exists()
    
    def _validate_file_exists(self):
        """Validate that the Excel file exists"""
        if not os.path.exists(self.excel_file_path):
            raise FileNotFoundError(f"Excel file not found: {self.excel_file_path}")
    
    @lru_cache(maxsize=1)
    def _load_excel_data(self) -> Dict[str, pd.DataFrame]:
        """Load and cache Excel data with all sheets"""
        try:
            excel_data = pd.read_excel(self.excel_file_path, sheet_name=None)
            return excel_data
        except Exception as e:
            raise ValueError(f"Error reading Excel file: {str(e)}")
    
    def _strip_whitespace(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove whitespace from string columns"""
        return df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    
    def _process_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean a dataframe"""
        # Strip whitespace
        df = self._strip_whitespace(df)
        
        # Apply cleaning process mapping
        df = df.replace(self.cleaning_process_mapping)
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Clean drink names and fill NaN values
        if 'Drinks' in df.columns:
            df['Drinks'] = df['Drinks'].str.strip()
        
        df.fillna(8000, inplace=True)
        
        return df
    
    def get_production_lines(self) -> List[int]:
        """Get list of available production lines"""
        excel_data = self._load_excel_data()
        production_lines = []
        
        for sheet_name in excel_data.keys():
            if sheet_name.startswith("Line "):
                try:
                    line_number = int(sheet_name.split("Line ")[1])
                    production_lines.append(line_number)
                except (IndexError, ValueError):
                    continue
        
        return sorted(production_lines)
    
    def get_drinks_for_line(self, line_number: int) -> List[str]:
        """Get list of drinks for a specific production line"""
        excel_data = self._load_excel_data()
        sheet_name = f"Line {line_number}"
        
        if sheet_name not in excel_data:
            raise ValueError(f"Production line {line_number} not found")
        
        df = excel_data[sheet_name]
        df = self._process_dataframe(df)
        
        if 'Drinks' not in df.columns:
            raise ValueError(f"'Drinks' column not found in {sheet_name}")
        
        # Filter out NaN and empty values, return clean drink names
        drinks = df['Drinks'].dropna().tolist()
        drinks = [str(drink).strip() for drink in drinks if drink and str(drink).strip()]
        
        return sorted(list(set(drinks)))  # Remove duplicates and sort
    
    def get_dataframe_for_line(self, line_number: int) -> pd.DataFrame:
        """Get processed dataframe for a specific production line"""
        excel_data = self._load_excel_data()
        sheet_name = f"Line {line_number}"
        
        if sheet_name not in excel_data:
            raise ValueError(f"Production line {line_number} not found")
        
        df = excel_data[sheet_name]
        return self._process_dataframe(df)
    
    def validate_drinks_for_line(self, line_number: int, drinks: List[str]) -> Dict[str, List[str]]:
        """Validate that drinks exist in the specified production line"""
        available_drinks = self.get_drinks_for_line(line_number)
        available_drinks_lower = [drink.lower() for drink in available_drinks]
        
        valid_drinks = []
        invalid_drinks = []
        
        for drink in drinks:
            drink_lower = drink.lower()
            if drink_lower in available_drinks_lower:
                # Find the exact case match
                exact_match = next(d for d in available_drinks if d.lower() == drink_lower)
                valid_drinks.append(exact_match)
            else:
                invalid_drinks.append(drink)
        
        return {
            "valid_drinks": valid_drinks,
            "invalid_drinks": invalid_drinks
        }
    
    def get_cleaning_matrix(self, line_number: int, drinks: List[str]) -> pd.DataFrame:
        """Get the cleaning matrix for specific drinks on a production line"""
        df = self.get_dataframe_for_line(line_number)
        
        # Validate drinks exist
        validation = self.validate_drinks_for_line(line_number, drinks)
        if validation["invalid_drinks"]:
            raise ValueError(f"Invalid drinks: {validation['invalid_drinks']}")
        
        # Filter dataframe to only include the specified drinks
        drink_indices = []
        for drink in validation["valid_drinks"]:
            indices = df.index[df['Drinks'] == drink].tolist()
            if indices:
                drink_indices.extend(indices)
        
        if not drink_indices:
            raise ValueError("No valid drinks found in the dataframe")
        
        # Create matrix for the specified drinks
        filtered_df = df.loc[drink_indices]
        
        return filtered_df 