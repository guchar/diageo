# Full-Stack Web App Development Tasks

## Project Overview

Convert Jupyter Notebook algorithm into a minimalistic, fast web application for optimizing drink production schedules using CIP cleaning data.

## Backend Development (Python FastAPI)

### Phase 1: Data Processing & API Setup

- [ ] **Setup FastAPI project structure**

  - Initialize virtual environment
  - Install dependencies (fastapi, uvicorn, pandas, openpyxl, python-multipart)
  - Create main.py with basic FastAPI app

- [ ] **Excel Data Processing**

  - Create data processing module to read CIP Combined.xlsx
  - Parse all production lines (Line 1, 2, 5, 6, 7, 8, 9, 10, 11)
  - Extract drink names for each production line
  - Apply cleaning process mapping and data cleaning functions

- [ ] **Core Algorithm Implementation**
  - Port Held-Karp algorithm from Jupyter notebook
  - Create water usage calculation function
  - Implement Graph class for TSP solving
  - Create optimization function that returns optimal path and water savings

### Phase 2: API Endpoints

- [ ] **GET /production-lines**

  - Return list of available production lines

- [ ] **GET /drinks/{line_number}**

  - Return list of drinks available for specific production line

- [ ] **POST /optimize-schedule**

  - Accept production line and list of drinks
  - Run optimization algorithm
  - Return optimal path, total water usage, and water saved

- [ ] **POST /upload-drinks**
  - Accept file upload for custom drink list
  - Validate drink names against selected production line
  - Return processed drink list

### Phase 3: Backend Optimization

- [ ] **Add input validation and error handling**
- [ ] **Implement caching for Excel data processing**
- [ ] **Add CORS middleware for frontend integration**

## Frontend Development (React + TypeScript)

### Phase 1: Setup & Basic UI

- [ ] **Initialize React project with TypeScript**

  - Setup Vite or Create React App
  - Install dependencies (axios, react-query, tailwindcss)
  - Configure TypeScript and ESLint

- [ ] **Create component structure**
  - Layout component with header and main content
  - ProductionLineSelector component
  - DrinkSelector component (dropdown)
  - FileUpload component
  - Results component
  - Loading states and error handling

### Phase 2: Core Functionality

- [ ] **Production Line Selection**

  - Dropdown to select production line
  - Fetch and display available lines from API

- [ ] **Drink Selection Interface**

  - Toggle between dropdown selection and file upload
  - Multi-select dropdown for drinks (based on selected line)
  - File upload component with drag-and-drop
  - Display selected drinks list with ability to remove items

- [ ] **Algorithm Execution**

  - Submit button to run optimization
  - Loading spinner during calculation
  - Progress indicator if needed

- [ ] **Results Display**
  - Show optimal schedule path visually
  - Display water usage metrics
  - Show water savings calculation
  - Export results functionality

### Phase 3: UI/UX Enhancement

- [ ] **Responsive design**

  - Mobile-friendly layout
  - Tablet optimization

- [ ] **Visual improvements**

  - Modern, clean design with Tailwind CSS
  - Icons and visual indicators
  - Color-coded results
  - Animation for smooth transitions

- [ ] **User experience features**
  - Input validation with helpful error messages
  - Tooltips explaining CIP processes
  - Quick action buttons (clear selections, reset, etc.)

## Integration & Deployment

### Phase 1: Local Development

- [ ] **Connect frontend to backend**

  - Setup API client with proper error handling
  - Implement data fetching with React Query
  - Test all user flows end-to-end

- [ ] **Testing**
  - Unit tests for algorithm functions
  - Integration tests for API endpoints
  - Frontend component testing
  - User acceptance testing with sample data

### Phase 2: Production Deployment

- [ ] **Backend deployment**

  - Dockerize FastAPI application
  - Deploy to cloud service (Railway, Render, or Heroku)
  - Setup environment variables

- [ ] **Frontend deployment**

  - Build optimized production bundle
  - Deploy to Vercel or Netlify
  - Configure environment variables for API endpoints

- [ ] **Final testing and optimization**
  - Performance testing with large datasets
  - Cross-browser compatibility testing
  - Mobile responsiveness verification

## Additional Features (Optional)

- [ ] **Data management**

  - Admin interface to update Excel data
  - Version control for CIP data changes

- [ ] **Advanced analytics**

  - Historical optimization results
  - Comparison between different schedules
  - Export to various formats (PDF, CSV, Excel)

- [ ] **User management**
  - Simple authentication if needed
  - User preferences and saved schedules

## File Structure

```
project/
├── backend/
│   ├── main.py
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
└── data/
    └── CIP Combined.xlsx
```

## Timeline Estimate

- **Backend (Phase 1-2)**: 2-3 days
- **Frontend (Phase 1-2)**: 3-4 days
- **Integration & Testing**: 1-2 days
- **Deployment & Polish**: 1 day

**Total: 7-10 days for full implementation**

## Success Criteria

- [ ] User can select production line and see available drinks
- [ ] User can either select drinks from dropdown or upload file
- [ ] Algorithm runs quickly (< 5 seconds for typical dataset)
- [ ] Results are clearly displayed with optimal path and water savings
- [ ] Application is responsive and works on mobile devices
- [ ] No errors or crashes during normal usage
