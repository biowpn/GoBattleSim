
'''
Methods to making Pokemon Go PvP Tier list.
Author: u/biowpn

Non-commerical use only. I have no responsibility for this script being working.
'''

import copy



class Game:
    '''
    Pivot Method for solving arbitrary two-player zero-sum Games.
    Introduced by Thomas S. Ferguson.
    '''

    def __init__(self, X, Y, A):
        '''
        X is the strategy space of player I.
        Y is the strategy space of player II.
        A is the reward function (of Player I): X * Y -> R
        X, Y are 1-D array. A is 2-D array and should match the sizes of X and Y.
        '''
        
        X = [(x, True) for x in X]
        Y = [(y, False) for y in Y]
        
        self.m = len(X)
        self.n = len(Y)
        assert self.m > 0 and self.n > 0
        assert len(A) == self.m
        for row in A:
            assert len(row) == self.n

        self.T = [["" for _ in range(self.n + 2)] for _ in range(self.m + 2)]
        
        # Init the labels and border numbers
        for i in range(self.m):
            self.T[i + 1][0] = X[i]
            self.T[i + 1][self.n + 1] = 1
        for j in range(self.n):
            self.T[0][j + 1] = Y[j]
            self.T[self.m + 1][j + 1] = -1
        self.T[self.m + 1][self.n + 1] = 0
            
        # Offset the payoff to make sure the value of the game is positive
        self.value_offset = min(A[0]) - 1
        
        # Init the payoff
        for i in range(self.m):
            for j in range(self.n):
                self.T[i + 1][j + 1] = A[i][j] - self.value_offset
                

    def __repr__(self):
        '''
        Print the tableau for debug purpose.
        '''
        
        string = ""
        for row in self.T:
            string += '\t'.join([(e[0] if type(e) == type(()) else str(e)) for e in row]) + '\n'
        return string
    

    def compare_rows(self, r1, r2):
        r1_dominated = True
        r2_dominated = True
        for c in range(1, self.n + 1):
            if self.T[r1][c] > self.T[r2][c]:
                r1_dominated = False
            elif self.T[r1][c] < self.T[r2][c]:
                r2_dominated = False
            if not r1_dominated and not r2_dominated:
                return 0
        return -1 if r1_dominated else 1


    def compare_columns(self, c1, c2):
        c1_dominated = True
        c2_dominated = True
        for r in range(1, self.m + 1):
            if self.T[r][c1] < self.T[r][c2]:
                c1_dominated = False
            elif self.T[r][c1] > self.T[r][c2]:
                c2_dominated = False
            if not c1_dominated and not c2_dominated:
                return 0
        return -1 if c1_dominated else 1


    def remove_row(self, r):
        self.T.pop(r)
        self.m -= 1
    
    def remove_column(self, c):
        for row in self.T:
            row.pop(c)
        self.n -= 1    

    def eliminate_dominated_rows(self):
        r1 = 1
        r2 = 2
        eliminated = False
        while r1 < self.m and r2 <= self.m:
            cpm_res = self.compare_rows(r1, r2)
            if cpm_res == -1: # r1 is dominated
                self.remove_row(r1)
                r2 = r1 + 1
                eliminated = True
            elif cpm_res == 1: # r2 is dominated
                self.remove_row(r2)
                eliminated = True
            else:   # Neither r2 or r1 is dominated
                r2 += 1
            if r2 == self.m:
                r1 += 1
                r2 = r1 + 1
        return eliminated


    def eliminate_dominated_columns(self):
        c1 = 1
        c2 = 2
        eliminated = False
        while c1 < self.n and c2 <= self.n:
            cpm_res = self.compare_columns(c1, c2)
            if cpm_res == -1: # c1 is dominated
                self.remove_column(c1)
                c2 = c1 + 1
                eliminated = True
            elif cpm_res == 1: # c2 is dominated
                self.remove_column(c2)
                elinimated = True
            else:
                c2 += 1
            if c2 == self.n:
                c1 += 1
                c2 = c1 + 1
        return eliminated
    

    def solve(self):
        '''
        Solve the game by finding one optimal strategy for each player.
        '''

        # First try to eliminated rows / columns to reduce the size of payoff matrix
        m_before = self.m
        n_before = self.n
        while self.eliminate_dominated_rows() or self.eliminate_dominated_columns():
            pass
        
        while True:

            # 1. Select an entry (p, q) in the interior of the tableau to be the pivot
            # 1.1. Pick a column with negative border number
            q = None
            for j in range(1, self.n + 1):
                if self.T[self.m + 1][j] < 0:
                    q = j
                    break
            if q is None:
                break

            # 1.2. Find the positive pivot with the least positive ratio to its border number
            p = None
            min_positive_ratio = None
            for i in range(1, self.m + 1):
                if self.T[i][q] <= 0:
                    continue
                ratio = self.T[i][self.n + 1] / self.T[i][q]
                if p is None or (ratio > 0 and ratio < min_positive_ratio):
                    min_positive_ratio = ratio
                    p = i
            if p is None:
                raise Exception("Cannot pick pivot")
            

            # 2. Pivoting
            # 2.1. Replace each entry, a(i, j), not in the row or column of the pivot
            # by a(i, j)− a(p, j) * a(i, q)/a(p, q)
            for i in range(1, self.m + 2):
                for j in range(1, self.n + 2):
                    if i != p and j != q:
                        self.T[i][j] = self.T[i][j] - self.T[p][j] * self.T[i][q] / self.T[p][q]
            
            # 2.2. Replace each entry in the pivot row, except for the pivot,
            # by its value divided by the pivot value.
            for j in range(1, self.n + 2):
                if j != q:
                    self.T[p][j] = self.T[p][j] / self.T[p][q]
            
            # 2.3. Replace each entry in the pivot column, except for the pivot,
            # by the negative of its value divided by the pivot value.
            for i in range(1, self.m + 2):
                if i != p:
                    self.T[i][q] = -self.T[i][q] / self.T[p][q]
            
            # 2.4 Replace the pivot value by its reciprocal.
            self.T[p][q] = 1 / self.T[p][q]
                        

            # 3. Exchange the label on the left of the pivot row
            # with the label on the top of the pivot column.
            self.T[p][0], self.T[0][q] = self.T[0][q], self.T[p][0]
            

    def read_out(self):
        '''
        Read out the optimal strategy for player I and II.
        '''
        
        strat1 = []
        strat2 = []
        for i in range (1, self.m + 1):
            a = self.T[i][0]
            if a[1]: # Orginate from Player I
                strat1.append((a[0], 0))
            else: # Orginate from Player II
                strat2.append((a[0], self.T[i][self.n + 1] / self.T[self.m + 1][self.n + 1]))
        for j in range (1, self.n + 1):
            a = self.T[0][j]
            if a[1]: # Orginate from Player I
                strat1.append((a[0], self.T[self.m + 1][j] / self.T[self.m + 1][self.n + 1]))
            else: # Orginate from Player II
                strat2.append((a[0], 0))

        return strat1, strat2


    

def remove_by_indices(L, indices):
    '''
    Remove multiple elements from a list by given indices.
    The change will be in place.
    '''
    
    removed_count = 0
    for index in sorted(indices):
        L.pop(index - removed_count)
        removed_count += 1


def load_pokemon_matrix(in_file):
    '''
    Load Pokemon battle matrix from a local file.
    Return (list_of_pokemon_names, matrix)
    '''
    
    if type(in_file) is str:
        in_file = open(in_file)
    pokemon_names = []
    matrix = []
    for line in in_file:
        line = line.rstrip().split('\t')
        if line[0].strip() == "": # Skip first row
            continue
        pokemon_names.append(line[0])
        matrix.append([float(e) for e in line[1:]])
    return pokemon_names, matrix



def make_smogon_tier_list(inF, num_tiers=3):
    '''
    Make smogon style tier list.
    
    The tier 1 consists of the optimal meta derived from the orginal matrix.
    
    Remove the optimal meta from the pool, and solve for the reduced matrix to get tier 2.
    Repeat and get tier 3 and so on.
    '''
    
    Pokemon, BSM = load_pokemon_matrix(inF)
    tier = 1

    while tier <= num_tiers and len(Pokemon) > 0:
        g = Game(Pokemon, Pokemon, BSM)
        g.solve()
        meta = [(p, w) for (p, w) in g.read_out()[0] if w > 0]
        meta.sort(key=lambda x: -x[1])
        print(f"Tier {tier}")

        indices = []
        for name, prob in meta:
            print(name, round(prob, 5), sep='\t')
            for i, name2 in enumerate(Pokemon):
                if name2 == name:
                    indices.append(i)
        remove_by_indices(Pokemon, indices)
        remove_by_indices(BSM, indices)
        for row in BSM:
            remove_by_indices(row, indices)

        print()

        tier += 1



def make_dominator_tier_list(inF, num_tiers=3):
    '''
    Make dominator style tier list.

    The tier 1 consists of the optimal meta derived from the orginal matrix.
    
    For each Pokemon X in the optimal meta, remove X from the pool, then solve for the reduced matrix.
    Add each new Pokemon Y (if any) to tier 2. Add X to Y's dominator set. Add back X to the pool. Repeat.

    For each Pokemon Y in tier 2, remove Y and all of its dominators, then solve for the reduced matrix.
    Add each new Pokemon Z (if any) to tier 3. Add Y to Z's dominator set. Add back Y and all its dominawtors to the pool. Repeat.
    
    '''

    pokemon_names, matrix = load_pokemon_matrix(inF)
    num_pokemon = len(pokemon_names)
    dominators = [set() for _ in range(num_pokemon)]
    
    tier_compositions = {}
    
    for tier in range(1, num_tiers + 1):
        tier_compositions[tier] = set()
        if tier > 1:
            for pokemon_index in tier_compositions[tier - 1]:
                
                # For each Pokemon in the previous tier, remove it and all its dominators
                pokemon_indices_to_remove = [pokemon_index] + list(dominators[pokemon_index])
                pokemon_indices_remained = [i for i in range(num_pokemon) if i not in pokemon_indices_to_remove]
                matrix_reduced = copy.deepcopy(matrix)
                remove_by_indices(matrix_reduced, pokemon_indices_to_remove)
                for row in matrix_reduced:
                    remove_by_indices(row, pokemon_indices_to_remove)

                # Solve for the reduced game
                game = Game(pokemon_indices_remained, pokemon_indices_remained, matrix_reduced)
                game.solve()

                # Add the new Pokemon (if any) to the current tier, and mark its dominators
                for new_pokemon_index, weight in game.read_out()[0]:
                    if weight > 0:
                        new_pokemon = True
                        for higher_tier in range(1, tier):
                            if new_pokemon_index in tier_compositions[higher_tier]:
                                new_pokemon = False
                                break
                        if new_pokemon:
                            dominators[new_pokemon_index].add(pokemon_index)
                            tier_compositions[tier].add(new_pokemon_index)
        else:
            # For tier 1, directly solve for the optimal meta
            game = Game(range(num_pokemon), range(num_pokemon), matrix)
            game.solve()
            for pokemon_index, weight in game.read_out()[0]:
                if weight > 0:
                    tier_compositions[tier].add(pokemon_index)
             
        print(f"Tier {tier}")
        for pokemon_index in tier_compositions[tier]:
            print(pokemon_names[pokemon_index])
        print()
        
        tier += 1

    print("Dominators:")
    for dominatee_index, dominator_indices in enumerate(dominators):
        dominatee_name = pokemon_names[dominatee_index]
        dominator_names = [pokemon_names[i] for i in dominator_indices]
        if len(dominator_names):
            print(f"{dominatee_name} is dominated by:", ', '.join(dominator_names))
        
    



    
