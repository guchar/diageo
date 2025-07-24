import itertools
from typing import List, Tuple, Dict
import pandas as pd
from .data_processor import DataProcessor
from models.schemas import OptimizationResponse

class OptimizationService:
    """Service for optimizing drink production schedules using Held-Karp algorithm"""
    
    def __init__(self, data_processor: DataProcessor):
        self.data_processor = data_processor
    
    def calculate_water_usage(self, drinks: List[str], df: pd.DataFrame) -> float:
        """Calculate total water usage for a given sequence of drinks"""
        total_water = 0
        
        for i in range(len(drinks) - 1):
            current_drink = drinks[i]
            next_drink = drinks[i + 1]
            
            # Find the cleaning water needed to transition from current to next drink
            current_indices = df.index[df['Drinks'] == current_drink].tolist()
            
            if current_indices:
                current_idx = current_indices[0]
                try:
                    water_value = df.loc[current_idx, next_drink]
                    total_water += float(water_value)
                except (KeyError, ValueError):
                    # If transition not found, use a default high value
                    total_water += 8000
        
        return total_water
    
    def held_karp_algorithm(self, distance_matrix: List[List[float]]) -> Tuple[float, List[int]]:
        """
        Implementation of Held-Karp algorithm for solving TSP
        
        Args:
            distance_matrix: 2D matrix of distances between nodes
            
        Returns:
            Tuple of (optimal_cost, optimal_path_indices)
        """
        n = len(distance_matrix)
        
        if n <= 1:
            return 0, [0]
        
        if n == 2:
            return distance_matrix[0][1], [0, 1]
        
        # Maps each subset of nodes to the cost and path
        C = {}
        
        # Set transition cost from initial state
        for k in range(1, n):
            C[(1 << k, k)] = (distance_matrix[0][k], 0)
        
        # Iterate subsets of increasing length
        for subset_size in range(2, n):
            for subset in itertools.combinations(range(1, n), subset_size):
                # Set bits for all nodes in this subset
                bits = 0
                for bit in subset:
                    bits |= 1 << bit
                
                # Find the lowest cost to get to this subset
                for k in subset:
                    prev = bits & ~(1 << k)
                    
                    res = []
                    for m in subset:
                        if m == 0 or m == k:
                            continue
                        res.append((C[(prev, m)][0] + distance_matrix[m][k], m))
                    
                    if res:
                        C[(bits, k)] = min(res)
        
        # Calculate optimal cost
        bits = (2**n - 1) - 1
        
        if n == 1:
            return 0, [0]
        
        res = []
        for k in range(1, n):
            if (bits, k) in C:
                res.append((C[(bits, k)][0] + distance_matrix[k][0], k))
        
        if not res:
            # Fallback for small cases
            return self._simple_tsp_fallback(distance_matrix)
        
        opt, parent = min(res)
        
        # Backtrack to find full path
        path = []
        for i in range(n - 1):
            path.append(parent)
            new_bits = bits & ~(1 << parent)
            if (bits, parent) in C:
                _, parent = C[(bits, parent)]
            bits = new_bits
        
        # Add implicit start state
        path.append(0)
        path.reverse()
        
        return opt, path
    
    def _simple_tsp_fallback(self, distance_matrix: List[List[float]]) -> Tuple[float, List[int]]:
        """Simple fallback for small TSP instances"""
        n = len(distance_matrix)
        nodes = list(range(n))
        min_cost = float('inf')
        best_path = nodes
        
        # Try all permutations starting from node 0
        for perm in itertools.permutations(nodes[1:]):
            path = [0] + list(perm)
            cost = 0
            
            for i in range(len(path) - 1):
                cost += distance_matrix[path[i]][path[i + 1]]
            
            if cost < min_cost:
                min_cost = cost
                best_path = path
        
        return min_cost, best_path
    
    def create_distance_matrix(self, drinks: List[str], df: pd.DataFrame) -> List[List[float]]:
        """Create distance matrix from drinks and dataframe"""
        n = len(drinks)
        matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    current_drink = drinks[i]
                    next_drink = drinks[j]
                    
                    # Find cleaning cost from current_drink to next_drink
                    current_indices = df.index[df['Drinks'] == current_drink].tolist()
                    
                    if current_indices:
                        current_idx = current_indices[0]
                        try:
                            cost = float(df.loc[current_idx, next_drink])
                            matrix[i][j] = cost
                        except (KeyError, ValueError):
                            matrix[i][j] = 8000.0  # Default high cost
                    else:
                        matrix[i][j] = 8000.0
        
        return matrix
    
    def optimize(self, line_number: int, drinks: List[str]) -> OptimizationResponse:
        """
        Optimize the production schedule for given drinks and line
        
        Args:
            line_number: Production line number
            drinks: List of drink names to optimize
            
        Returns:
            OptimizationResponse with optimal path and water usage
        """
        if not drinks:
            raise ValueError("No drinks provided for optimization")
        
        if len(drinks) == 1:
            return OptimizationResponse(
                optimal_path=drinks,
                total_water_usage=0.0,
                water_saved=0.0,
                original_water_usage=0.0
            )
        
        # Get dataframe for the production line
        df = self.data_processor.get_dataframe_for_line(line_number)
        
        # Validate drinks
        validation = self.data_processor.validate_drinks_for_line(line_number, drinks)
        if validation["invalid_drinks"]:
            raise ValueError(f"Invalid drinks for line {line_number}: {validation['invalid_drinks']}")
        
        validated_drinks = validation["valid_drinks"]
        
        # Calculate original water usage (simple sequential order)
        original_usage = self.calculate_water_usage(validated_drinks, df)
        
        # Find optimal solution by trying different starting points
        best_cost = float('inf')
        best_path = validated_drinks
        
        for start_drink in validated_drinks:
            # Create permutation starting with this drink
            other_drinks = [d for d in validated_drinks if d != start_drink]
            current_drinks = [start_drink] + other_drinks
            
            # Create distance matrix
            distance_matrix = self.create_distance_matrix(current_drinks, df)
            
            # Solve TSP
            try:
                cost, path_indices = self.held_karp_algorithm(distance_matrix)
                
                if cost < best_cost:
                    best_cost = cost
                    best_path = [current_drinks[i] for i in path_indices]
            except Exception:
                # Fallback to simple calculation if algorithm fails
                cost = self.calculate_water_usage(current_drinks, df)
                if cost < best_cost:
                    best_cost = cost
                    best_path = current_drinks
        
        water_saved = max(0, original_usage - best_cost)
        
        return OptimizationResponse(
            optimal_path=best_path,
            total_water_usage=best_cost,
            water_saved=water_saved,
            original_water_usage=original_usage
        ) 