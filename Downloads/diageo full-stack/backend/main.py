from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.data_processor import DataProcessor
from services.optimizer import OptimizationService
from models.schemas import OptimizationRequest, OptimizationResponse, ProductionLinesResponse, DrinksResponse

app = FastAPI(
    title="CIP Optimization API",
    description="API for optimizing drink production schedules using CIP cleaning data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_processor = DataProcessor("../data/CIP Combined.xlsx")
optimizer = OptimizationService(data_processor)

@app.get("/", tags=["health"])
async def root():
    """Health check endpoint"""
    return {"message": "CIP Optimization API is running"}

@app.get("/production-lines", response_model=ProductionLinesResponse, tags=["data"])
async def get_production_lines():
    """Get list of available production lines"""
    lines = data_processor.get_production_lines()
    return ProductionLinesResponse(production_lines=lines)

@app.get("/drinks/{line_number}", response_model=DrinksResponse, tags=["data"])
async def get_drinks_for_line(line_number: int):
    """Get list of drinks available for a specific production line"""
    drinks = data_processor.get_drinks_for_line(line_number)
    return DrinksResponse(drinks=drinks)

@app.post("/optimize-schedule", response_model=OptimizationResponse, tags=["optimization"])
async def optimize_schedule(request: OptimizationRequest):
    """Optimize the production schedule for given drinks and production line"""
    result = optimizer.optimize(request.line_number, request.drinks)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 