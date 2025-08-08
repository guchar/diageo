line_num = int(input("Which line are you planning a schedule for today? Options are: [1, 2, 5, 6, 7, 8, 9, 10, 11]"))

df = pd.read_excel('CIP Combined.xlsx', sheet_name = None)
df = df.get("Line " + str(line_num))

cleaning_process_mapping = {
'A': 0,
'A/VR': 1002.32,
'VR': 1002.32,
'CIP 3': 2860.15,
'CIP 5': 7500,
'H': 5,
'K': 6
}

def strip_whitespace(df):
return df.applymap(lambda x: x.strip() if isinstance(x, str) else x)

df = strip_whitespace(df)

df= df.replace(cleaning_process_mapping)
df.columns = df.columns.str.strip()

df['Drinks'] = df['Drinks'].str.strip()
df.fillna(8000, inplace = True)

def water_used(current_list):
total_water = 0
for x in range(len(current_list) - 1):
value = df.loc[df.index[df['Drinks'] == current_list[x]].tolist()][current_list[x+1]].iloc[0]
total_water += value
return total_water

#Held-Karp Algorithm------------------------------------------------------------
import itertools
import random
import sys

def held_karp(dists):
"""
Implementation of Held-Karp, an algorithm that solves the Traveling
Salesman Problem using dynamic programming with memoization.

    Parameters:
        dists: distance matrix

    Returns:
        A tuple, (cost, path).
    """
    n = len(dists)

    # Maps each subset of the nodes to the cost to reach that subset, as well
    # as what node it passed before reaching this subset.
    # Node subsets are represented as set bits.
    C = {}

    # Set transition cost from initial state
    for k in range(1, n):
        C[(1 << k, k)] = (dists[0][k], 0)

    # Iterate subsets of increasing length and store intermediate results
    # in classic dynamic programming manner
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
                    res.append((C[(prev, m)][0] + dists[m][k], m))
                C[(bits, k)] = min(res)

    # We're interested in all bits but the least significant (the start state)
    bits = (2**n - 1) - 1

    # Calculate optimal cost
    res = []
    for k in range(1, n):
        res.append((C[(bits, k)][0] + dists[k][0], k))
    opt, parent = min((C[(bits, k)][0], k) for k in range(1, n))


    # Backtrack to find full path
    path = []
    for i in range(n - 1):
        path.append(parent)
        new_bits = bits & ~(1 << parent)
        _, parent = C[(bits, parent)]
        bits = new_bits

    # Add implicit start state
    path.append(0)
    rv_list = list(bevs[x] for x in list(reversed(path)))

    return water_used(rv_list), rv_list

#Graph----------------------------------------------------------
class Graph(object):

    def __init__(self, vertex_data):
        self.size = len(vertex_data)
        self.vertex_data = vertex_data

        blank_matrix = [[0] * len(bevs) for _ in range(self.size)]
        for x in range(self.size):
            for y in range(self.size):
                official_index = df.index[df['Drinks'] == vertex_data[x]].tolist()
                official_weight = df.loc[official_index][vertex_data[y]]
                blank_matrix[x][y] = official_weight.iloc[0]

        self.adj_matrix = blank_matrix

g = Graph(bevs)

optimal_path = 1000000
rv = ()
for beverage in g.vertex_data:
blank = []
blank.append(beverage)
blank.extend([other_bevs for other_bevs in bevs if other_bevs != beverage])
new_g = Graph(blank)
current_rv = held_karp(new_g.adj_matrix)
if current_rv[0] < optimal_path:
rv = current_rv
optimal_path = current_rv[0]
formatted_path = " ->\n".join(rv[1])
water_saved = format(water_used(bevs) - rv[0], ".2f")

print("The optimal water path is:\n\n", formatted_path, "\n\n Your total water usage is:\n", format(rv[0], ".2f"), "gallons. \nYou are saving", water_saved, "gallons." )
