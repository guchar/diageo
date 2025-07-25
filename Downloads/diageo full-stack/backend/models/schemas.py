from pydantic import BaseModel
from typing import List, Optional

class OptimizationRequest(BaseModel):
    """Request model for optimization endpoint"""
    line_number: int
    drinks: List[str]

class TransitionInfo(BaseModel):
    """Model for transition between drinks"""
    from_drink: str
    to_drink: str
    cleaning_type: str
    water_usage: float

class OptimizationResponse(BaseModel):
    """Response model for optimization results"""
    optimal_path: List[str]
    total_water_usage: float
    water_saved: float
    original_water_usage: float
    transitions: List[TransitionInfo]

class ProductionLinesResponse(BaseModel):
    """Response model for production lines endpoint"""
    production_lines: List[int]

class DrinksResponse(BaseModel):
    """Response model for drinks endpoint"""
    drinks: List[str]

class UploadResponse(BaseModel):
    """Response model for file upload endpoint"""
    drinks: List[str]
    valid_drinks: List[str]
    invalid_drinks: List[str]
    message: str 