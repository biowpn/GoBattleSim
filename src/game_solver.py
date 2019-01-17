'''
Pivot Method for solving arbitrary zero-sum Games.

introduced by Thomas S. Ferguson
'''

import sys
import os

class Game:

    def __init__(self, X, Y, A):
        '''
        X is the strategy space of player I.
        Y is the strategy space of player II.
        A is the reward function (of Player I): X * Y -> R
        X, Y are 1-D array. A is 2-D array and should match the sizes of X and Y.
        '''
        self.X = [(x, True) for x in X]
        self.Y = [(y, False) for y in Y]
        self.A = list(A)
        
        m = len(self.X)
        n = len(self.Y)
        assert m > 0 and n > 0
        assert len(self.A) == m
        for row in self.A:
            assert len(row) == n

        self.T = [["" for _ in range(n + 2)] for _ in range(m + 2)]
        
        # Init the labels and border numbers
        for i in range(m):
            self.T[i + 1][0] = self.X[i]
            self.T[i + 1][n + 1] = 1
        for j in range(n):
            self.T[0][j + 1] = self.Y[j]
            self.T[m + 1][j + 1] = -1
        self.T[m + 1][n + 1] = 0
            
        # Offset the payoff to make sure the value of the game is positive
        self.value_offset = min(self.A[0]) - 1
        
        # Init the payoff
        for i in range(m):
            for j in range(n):
                self.T[i + 1][j + 1] = self.A[i][j] - self.value_offset
                

    def __repr__(self):
        '''
        Print the tableau for debug purpose.
        '''
        string = ""
        for row in self.T:
            string += '\t'.join([(e[0] if type(e) == type(()) else str(e)) for e in row]) + '\n'
        return string
    

    def solve(self):
        '''
        Solve the game by finding one optimal strategy for each player.
        '''
        m = len(self.X)
        n = len(self.Y)
        
        while True:
            
            # 1. Select an entry (p, q) in the interior of the tableau to be the pivot
            # 1.1. Pick a column with negative border number
            q = None
            for j in range(1, n + 1):
                if self.T[m + 1][j] < 0:
                    q = j
                    break
            if q is None:
                break

            # 1.2. Find the positive pivot with the least positive ratio to its border number
            p = None
            min_positive_ratio = None
            for i in range(1, m + 1):
                if self.T[i][q] <= 0:
                    continue
                ratio = self.T[i][n + 1] / self.T[i][q]
                if p is None or (ratio > 0 and ratio < min_positive_ratio):
                    min_positive_ratio = ratio
                    p = i
            if p is None:
                raise Exception("Cannot pick pivot")
            

            # 2. Pivoting
            T = [row.copy() for row in self.T]
            for i in range(1, m + 2):
                for j in range(1, n + 2):
                    
                    # 2.1. Replace each entry, a(i, j), not in the row or column of the pivot
                    # by a(i, j)− a(p, j) * a(i, q)/a(p, q)
                    if i != p and j != q:
                        T[i][j] = self.T[i][j] - self.T[p][j] * self.T[i][q] / self.T[p][q]
            
                    # 2.2. Replace each entry in the pivot row, except for the pivot,
                    # by its value divided by the pivot value.
                    elif i == p and j != q:
                        T[i][j] = self.T[i][j] / self.T[p][q]
            
                    # 2.3. Replace each entry in the pivot column, except for the pivot,
                    # by the negative of its value divided by the pivot value.
                    elif i != p and j == q:
                        T[i][j] = -self.T[i][j] / self.T[p][q]
            
                    # 2.4 Replace the pivot value by its reciprocal.
                    else:
                        T[i][j] = 1 / self.T[p][q]
            self.T = T
                        

            # 3. Exchange the label on the left of the pivot row
            # with the label on the top of the pivot column.
            self.T[p][0], self.T[0][q] = self.T[0][q], self.T[p][0]
            

    def read_out(self):
        '''
        Read out the optimal strategy for player I and II.
        '''

        m = len(self.X)
        n = len(self.Y)
        
        strat1 = []
        strat2 = []
        for i in range (1, m + 1):
            a = self.T[i][0]
            if a[1]: # Orginate from Player I
                strat1.append((a[0], 0))
            else: # Orginate from Player II
                strat2.append((a[0], self.T[i][n + 1] / self.T[m + 1][n + 1]))
        for j in range (1, n + 1):
            a = self.T[0][j]
            if a[1]: # Orginate from Player I
                strat1.append((a[0], self.T[m + 1][j] / self.T[m + 1][n + 1]))
            else: # Orginate from Player II
                strat2.append((a[0], 0))

        return strat1, strat2

    

def example():
    g = Game(
        ["x1", "x2", "x3"],
        ["y1", "y2", "y3"],
        [
            [2,-1,6],
            [0,1,-1],
            [-2,2,1]
        ]
    )
    g.solve()
    print(g.read_out())

    g = Game(
        ["R", "P", "S"],
        ["R", "P", "S"],
        [
            [0,2,-1],
            [2,0,-1],
            [-1,1,0]
        ]
    )
    g.solve()
    print(g.read_out())



def solve_meta(inF, outF=sys.stdout):
    
    Pokemon = []
    BSM = []

    for line in inF:
        line = line.rstrip().split('\t')
        if line[0].strip() == "": # Skip first row
            continue
        Pokemon.append(line[0])
        BSM.append([float(e) for e in line[1:]])

    g = Game(Pokemon, Pokemon, BSM)
    g.solve()
    print("Pokemon", "Weight", sep='\t', file=outF)
    for pokemon, prob in g.read_out()[0]:
        if prob > 0:
            print(pokemon, round(prob, 5), sep='\t', file=outF)



if __name__ == "__main__":
    if len(sys.argv) > 1:
        inF_name = sys.argv[1]
    else:
        inF_name = input("Enter the name of input file: ")
    if not os.path.isfile(inF_name):
        input(f"File '{inF_name}' does not exist")
        exit()

    inF = open(inF_name)
    outF = open(sys.argv[2], 'w') if len(sys.argv) > 2 else sys.stdout
    solve_meta(inF, outF)
    inF.close()
    outF.close()
    if outF is sys.stdout:
        input()




