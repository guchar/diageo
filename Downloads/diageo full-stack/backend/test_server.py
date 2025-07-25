#!/usr/bin/env python3
"""Simple test server to mock API endpoints for frontend testing"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import ProductionLinesResponse, DrinksResponse, OptimizationRequest, OptimizationResponse

app = FastAPI(title="Test CIP API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test CIP Optimization API is running"}

@app.get("/production-lines", response_model=ProductionLinesResponse)
async def get_production_lines():
    return ProductionLinesResponse(production_lines=[1, 2, 5, 6, 7, 8, 9, 10, 11])

@app.get("/drinks/{line_number}", response_model=DrinksResponse)
async def get_drinks_for_line(line_number: int):
    # Mock drinks data for testing
    mock_drinks = [
        "Astral Margarita",
        "Bulleit 10",
        "Bulleit Bourbon", 
        "Bulleit Old Fashion & Manhattan",
        "Bulleit Rye",
        "CM OSR JAPAN",
        "CM Private Stock",
        "Dickel 12",
        "Dickel 8",
        "Jack Daniels Single Barrel",
        "Jack Daniels Tennessee Honey",
        "Jack Daniels Tennessee Fire"
    ]
    return DrinksResponse(drinks=mock_drinks)

@app.post("/optimize-schedule", response_model=OptimizationResponse)
async def optimize_schedule(request: OptimizationRequest):
    # Mock optimization result
    return OptimizationResponse(
        line_number=request.line_number,
        drinks=request.drinks,
        optimal_sequence=request.drinks,  # Just return same sequence for testing
        water_saved=1234.56,
        total_time=45.2,
        schedule=[
            {
                "drink": drink,
                "position": idx + 1,
                "cleaning_time": 10.0,
                "water_usage": 50.0
            }
            for idx, drink in enumerate(request.drinks)
        ]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 