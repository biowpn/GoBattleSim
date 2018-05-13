from __future__ import print_function, division
import math
import json
try: input = raw_input
except NameError: pass
import os

# this should be the most current GM file
GMFileName_Current = "GAME_MASTER.json"

pathOfPokeLib = os.path.realpath(__file__)

for n in range(1,1000):
    try:
        if pathOfPokeLib[-n]=='\\':
            dirOfPokeLib = pathOfPokeLib[:-n+1]
            break
    except:
        dirOfPokeLib=''
        break


# I need: 
# [movename, fastmove?, power, type, absenergydiff, dws, duration]
# from  
# 1. [templateId]
# 2. [templateId]
# 3. [moveSettings][power]
# 4.               [pokemonType]
# 5.               [energyDelta]
# 6.               [damageWindowStartMs]
# 7.               [durationMs]
ATKR_MAX_ENERGY = 100
DFDR_MAX_ENERGY = 100

ARENA_ENTRY_LAG_MS = 7000 # lag to enter a raid or gym battle
TIMELIMIT_GYM_MS_IDEAL = 100000 # timer for the battle in ms
TIMELIMIT_NORMALRAID_MS_IDEAL = 180000 # timer for raid in ms 
TIMELIMIT_LEGENDARYRAID_MS_IDEAL = 300000 # timer for legendary raid
TIMELIMIT_GYM_MS = TIMELIMIT_GYM_MS_IDEAL - ARENA_ENTRY_LAG_MS 
TIMELIMIT_NORMALRAID_MS = TIMELIMIT_NORMALRAID_MS_IDEAL - ARENA_ENTRY_LAG_MS
TIMELIMIT_LEGENDARYRAID_MS = TIMELIMIT_LEGENDARYRAID_MS_IDEAL - ARENA_ENTRY_LAG_MS

raids_list_lvl1 = ["croconaw", "quilava", "bayleef", "magikarp"]
raids_list_lvl2 = ["exeggutor", "muk", "magmar", "electabuzz", "weezing"]
raids_list_lvl3 = ["vaporeon", "flareon", "machamp", "alakazam", "arcanine", "jolteon", "gengar"]
raids_list_lvl4 = ["tyranitar", "snorlax", "rhydon", "charizard", "lapras", "venusaur", "blastoise"]
raids_list_lvl5 = ["articuno", "zapdos", "moltres", "mewtwo", "mew", "entei", "raikou", 
"suicune", "ho_oh", "lugia", "celebi"]
raids_list = [None, 
    raids_list_lvl1, raids_list_lvl2, raids_list_lvl3, raids_list_lvl4, raids_list_lvl5]

# raid boss CPM and HP for boss levels 1-5:
raidboss_CPM = [None, 0.61, 0.67, 0.7300000190734863, 0.7900000214576721, 0.7900000214576721]
raidboss_HP = [None, 600, 1800, 3000, 7500, 12500]
raidboss_IVs = [15, 15, None] # Order is ATK, DEF, STA. STA IV is not used for raid bosses. 
# turn it into a dict so that you can write raidBossDict['entei']['CPM']:
raidboss_dict = {}
for raidlvl in range(1,len(raids_list)):
    for pkname in raids_list[raidlvl]:
        raidboss_dict[pkname] = {
            "CPM": raidboss_CPM[raidlvl],
            "HP": raidboss_HP[raidlvl],
            "lvl": raidlvl,
            "timelimit_ms": TIMELIMIT_NORMALRAID_MS if raidlvl<5 else TIMELIMIT_LEGENDARYRAID_MS
            }


class fmove:
    def __init__(self, name, power, dtype, energygain, dws, duration):
        self.name = name # string with name of atk
        self.power = power
        self.dtype = dtype # damage type ("fire", "water", etc)
        self.energygain = energygain # energy added by this move
        self.dws = dws # damageWindowStart (how long until the dmg is dealt?)
        self.duration = duration # time that cant be spent doing other stuff
        self.legacyBool  = False # is this move legacy for the pokemon it is in?
        if energygain < 0:
            raise Exception("ERROR: VARIABLE energygain SHOULD NOT BE NEGATIVE")

class cmove:
    def __init__(self, name, power, dtype, energycost, dws, duration):
        self.name = name # string with name of atk
        self.power = power
        self.dtype = dtype # damage type ("fire", "water", etc)
        self.energycost = energycost # |energy| lost by this move >0
        self.dws = dws # damageWindowStart (how long until the dmg is dealt?)
        self.duration = duration # time that cant be spent doing other stuff
        if energycost < 0:
            raise Exception("ERROR: VARIABLE energycost SHOULD NOT BE NEGATIVE")

class pokemonspecies:
    def __init__(self, dex, name, type1, type2, bstats, fmoves, cmoves):
        self.dex = dex
        self.name = name
        self.type1 = type1
        self.type2 = type2
        self.bstats = bstats
        self.base_ATK = bstats[0]
        self.base_DEF = bstats[1]
        self.base_STA = bstats[2]
        self.fmoves = fmoves
        self.cmoves = cmoves
        self.legacyfmnames = []
        self.legacycmnames = []

class pokemon:
    def __init__(self, species, IVs, CPM, fmove, cmove, poketype):
        self.species = species
        self.fmove = fmove
        self.cmove = cmove
        # poketype can be 'player', 'gym_defender', or 'raid_boss'.
        self.poketype = poketype
        self.name = species.name
        self.dex = species.dex
        self.type1 = species.type1
        self.type2 = species.type2    
        self.energy = 0    
        self.total_energy_gained = 0

        if poketype == "player":
            self.IVs = IVs
            self.CPM = CPM
            self.stats = [(species.bstats[i]+IVs[i])*CPM for i in [0,1,2]]
            self.ATK = self.stats[0]
            self.DEF = self.stats[1]
            self.STA = self.stats[2]
            self.CP = max(10, math.floor(self.ATK*math.sqrt(self.DEF*self.STA)/10))
            self.maxHP = max(math.floor(self.STA),10)
            self.HP = self.maxHP
            self.maxenergy = ATKR_MAX_ENERGY
        elif poketype == 'gym_defender':
            self.IVs = IVs
            self.CPM = CPM
            self.stats = [(species.bstats[i]+IVs[i])*CPM for i in [0,1,2]]
            self.ATK = self.stats[0]
            self.DEF = self.stats[1]
            self.STA = self.stats[2]
            self.CP = max(10, math.floor(self.ATK*math.sqrt(self.DEF*self.STA)/10))
            # only these are different from poketype == player:
            self.maxHP = 2 * max(math.floor(self.STA),10)
            self.HP = self.maxHP
            self.maxenergy = DFDR_MAX_ENERGY
        elif poketype == 'raid_boss':
            # everything is diff from poketype == player:
            self.IVs = raidboss_IVs
            try: self.CPM = raidboss_dict[self.name]['CPM']                
            except KeyError: raise Exception("No raidboss with that name exists. Ho-oh is ho_oh btw.")
            self.stats = ( [(species.bstats[i]+self.IVs[i])*self.CPM for i in [0,1]] 
                + [(raidboss_dict[self.name]['HP'])] )
            self.ATK = self.stats[0]
            self.DEF = self.stats[1]
            self.STA = self.stats[2]
            self.CP = max(10, math.floor(
                (species.base_ATK+self.IVs[0])*math.sqrt((species.base_DEF+self.IVs[1])*self.STA)/10))
            self.maxHP = self.STA
            self.HP = self.maxHP
            self.maxenergy = DFDR_MAX_ENERGY
            self.nonbackground_damage_taken = 0 # counts how much dmg was taken except from backgroundDmg.
    
    def reset_stats(self):
        self.HP = self.maxHP
        self.energy = self.maxenergy        

    def printstatus(self):
        print("=%s STATUS=" % self.name)
        print("HP %d/%d   ENERGY %d/100" % 
            (self.HP, self.maxHP, self.energy))
        print("fmove: ", self.fmove.name)
        print("cmove: ", self.cmove.name)
        

def invalidInputError(invalidstr):
    raise ValueError("\nYOU TARD, THAT'S AN INVALID INPUT.\n" +
        "Did you even NOTICE that you had entered '%s'???!??!" % 
        invalidstr)

def getPokedexNumber(nameOrNumber, speciesdata):
    try:
        out = int(nameOrNumber)
        return out
    except ValueError:
        try: 
            out = [x.dex for x in speciesdata[1:] if x.name==nameOrNumber][0]
        except IndexError: 
            invalidInputError(nameOrNumber)
    return out

def getFMoveObject(name, fmovedata):
    name = (((name.lower().replace('_',' '))).replace('-'," ")).replace(',',' ')
    try: fmove = fmovedata[name.lower()]
    except KeyError: invalidInputError(name)
    return fmove

def getCMoveObject(name, cmovedata):
    try: cmove = cmovedata[name.lower()]
    except KeyError: invalidInputError(name)
    return cmove

def importGM(path=dirOfPokeLib + GMFileName_Current):
    # import the gamemaster data
    with open(path) as gmfile:
        data = json.load(gmfile)

    fmovedata = {}
    cmovedata = {}
    speciesdata = ["FILLER"]
    CPMultiplier = []
    typeadvantages = {}

    # FMOVEDATA, CMOVEDATA
    for n in range(len(data["itemTemplates"])):
        tid = str(data["itemTemplates"][n]['templateId'])
        # print(tid)
        if ("_MOVE_" in tid) and not ("REROLL" in tid):
            row = []
            if "_FAST" in tid:
                movename = tid[11:-5].replace("_"," ").lower()
                movename.replace("-"," ")
                movename.replace(","," ")
                row += [movename, 'fast']
            else:
                movename = tid[11:].replace("_"," ").lower()
                movename.replace("-"," ")
                movename.replace(","," ")
                row += [movename, 'cinematic']
            #splash is missing a power value but calculated as 0
            if "SPLASH" in tid or "TRANSFORM" in tid or "YAWN" in tid: row += [0]
            else: 
                try:
                    row += [data["itemTemplates"][n]['moveSettings']['power']]
                except KeyError as e:
                    print("\n=== KeyError with the following move: %s (n=%d) ===\n" % (tid, n))
                    raise e

            row += [str(data["itemTemplates"][n]['moveSettings']['pokemonType'])[13:].lower()]
            
            #struggle and transform have no energydelta values
            if "STRUGGLE" in tid or "TRANSFORM" in tid or "REROLL" in tid: row +=[0]
            else: row += [abs(data["itemTemplates"][n]['moveSettings']['energyDelta'])]

            row += [data["itemTemplates"][n]['moveSettings']['damageWindowStartMs']]
            row += [data["itemTemplates"][n]['moveSettings']['durationMs']]

            if row[1]=="fast":
                fmovedata[row[0]] = fmove(row[0], row[2], row[3], row[4], row[5], row[6])
            elif row[1]=="cinematic":
                cmovedata[row[0]] = cmove(row[0], row[2], row[3], row[4], row[5], row[6])
            else:
                raise Exception("This line should never be seen.")


    # then I need:
    # [dexnum, name, type1, type2, [baseatk, basedef, basesta], [fmoves], [cmoves]
    # from
    # 1. [templateId]
    # 2. [templateId]
    # 3.             [pokemonSettings][type]
    # 4.                              [type2]
    # 5.             [stats][baseAttack]
    #                [stats][baseDefense]
    #                [stats][baseStamina]
    # 6.             [quickMoves]
    # 7.             [cinematicMoves]

    # SPECIESDATA
    for n in range(len(data["itemTemplates"])):
        tid = str(data["itemTemplates"][n]['templateId'])
        if "_POKEMON_" in tid and tid[0]=="V":
            # dex num
            row = [int(tid[2:5])]
            # name
            row += [str(data['itemTemplates'][n]['pokemonSettings']['pokemonId']).lower()]
            row[-1] = row[-1].replace("_"," ")
            row[-1] = row[-1].replace("-"," ")
            row[-1] = row[-1].replace(","," ")
            row += [str(data['itemTemplates'][n]['pokemonSettings']['type'][13:]).lower()]
            try:
                row += [str(data['itemTemplates'][n]['pokemonSettings']['type2'][13:]).lower()]
            except KeyError:
                row += ['none']
            row += [[
                int(data['itemTemplates'][n]['pokemonSettings']['stats']['baseAttack']),
                int(data['itemTemplates'][n]['pokemonSettings']['stats']['baseDefense']),
                int(data['itemTemplates'][n]['pokemonSettings']['stats']['baseStamina'])
                ]]
            row += [[ getFMoveObject(str(x[:-5].replace("_"," ")).lower(), fmovedata) for x in 
                data['itemTemplates'][n]['pokemonSettings']['quickMoves']]]
            row += [[ getCMoveObject(str(x.replace("_"," ")).lower(), cmovedata) for x in 
                data['itemTemplates'][n]['pokemonSettings']['cinematicMoves']]]
            speciesdata += [pokemonspecies(row[0], row[1], row[2], 
                row[3], row[4], row[5], row[6])]

    # CPMULTIPLIER
    for n in range(len(data["itemTemplates"])):
        tid = str(data["itemTemplates"][n]['templateId'])
        
        if tid == "PLAYER_LEVEL_SETTINGS":
            CPMdata = data['itemTemplates'][n]['playerLevel']['cpMultiplier']
            break
    for n in range(len(CPMdata)-1):
        CPMultiplier += [CPMdata[n]]
        CPMultiplier += [math.sqrt((CPMdata[n]**2+CPMdata[n+1]**2)/2)]
    CPMultiplier += [CPMdata[-1]]


    # then I need type chart: [type [attackstrengths]]
    # from
    # type [templateId:POKEMON_TYPE_BUG]
    # astr                              [typeEffective][attackScalar]
    # 1 Normal
    # 2 FIGHTING
    # 3 poison
    # 4 ground
    # 5 rock
    # 6 bug
    # 7 ghost
    # 8 steel
    # 9 fire
    # 10 water
    # 11 GRASS
    # 12 electric
    # 13 psychic
    # 14 ice
    # 15 dragon
    # 16 dark
    # 17 fairy

    # TYPEADVANTAGES
    # It will be structured so that typeadvantages[atkr_attacktype][dfdr_type] gives the
    # multiplier to be applied to the attacker's damage.
    typorder = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost",
        "steel", "fire", "water", "grass", "electric", "psychic", "ice", 
        "dragon", "dark", "fairy"]
    typesfound = 0
    for typ in typorder:
        for n in range(len(data["itemTemplates"])):
            tid = str(data['itemTemplates'][n]['templateId'])
            if tid == ("POKEMON_TYPE_" + typ.upper()):
                typesfound += 1
                lst = data["itemTemplates"][n]['typeEffective']['attackScalar']
                dic = {}
                for l in range(len(typorder)):
                    dic[typorder[l]] = lst[l]
                typeadvantages[typ] = dic 
                break
    if typesfound < 17:
        raise Exception("Not all types were found: only %d of 17." 
            % typesfound)
    return fmovedata, cmovedata, speciesdata, CPMultiplier, typeadvantages

def importAllGM(GMFilesInChronologicalOrder = [
    "GAME_MASTERv0.31.0ish legacy vanilla moves.json",
    "GAME_MASTERv0.47.1 legacy move changes from v0.33, and CP changes.json", 
    GMFileName_Current
    ]):

    fmovedata, cmovedata, speciesdata, CPMultiplier, typeadvantages = \
        importGM(GMFilesInChronologicalOrder[-1])
    fmovenames = fmovedata.keys()
    cmovenames = cmovedata.keys()

    for GMFile in GMFilesInChronologicalOrder[:-1]:
        # import the legacy GM file
        fmovedata2, cmovedata2, speciesdata2, CPMultiplier2, typeadvantages2 = importGM(GMFile)

        # add the legacy moves to fmovedata, cmovedata.
        # these are moves which do not exist in the most recent GM file
        fmovenames2 = fmovedata2.keys()
        cmovenames2 = cmovedata2.keys()
        fmovenameslegacy = []
        cmovenameslegacy = []
        for fkey, ckey in zip(fmovenames2, cmovenames2):
            if not (fkey in fmovenames):
                fmovedata[fkey] = fmovedata2[fkey]
                fmovenameslegacy += fmovedata2[fkey].name
            if not (ckey in cmovenames):
                cmovedata[ckey] = cmovedata2[ckey]

        # add the legacy moves to speciesdata
        for dex in range(1, len(speciesdata2)):
            pk  = speciesdata[dex]
            pk2 = speciesdata2[dex]
            for fname2 in [fm2.name for fm2 in pk2.fmoves]:
                if not (fname2 in [fm.name for fm in pk.fmoves]):
                    legacyfm = [x for x in pk2.fmoves if x.name == fname2][0]
                    if not (legacyfm.name in fmovenameslegacy):
                        # then the move still exists, but for this pk it is legacy.
                        # add the legacy move, but from the updated file.
                        legacyfm = fmovedata[fname2]
                    legacyfm.legacyBool = True
                    speciesdata[dex].fmoves += [legacyfm]
                    speciesdata[dex].legacyfmnames += [fname2]
            for cname2 in [cm2.name for cm2 in pk2.cmoves]:
                if not (cname2 in [cm.name for cm in pk.cmoves]):
                    legacycm = [x for x in pk2.cmoves if x.name == cname2][0]
                    if not (legacycm.name in cmovenameslegacy):
                        # then the move still exists, but for this pk it is legacy.
                        # add the legacy move, but from the updated file.
                        legacycm = cmovedata[cname2]
                    legacycm.legacyBool = True
                    speciesdata[dex].cmoves += [legacycm]
                    speciesdata[dex].legacycmnames += [cname2]

    return fmovedata, cmovedata, speciesdata, CPMultiplier, typeadvantages

def CPM(level, CPMultiplier):
    if (level%0.5 != 0) or level < 1 or level > 40:
        raise Exception("you tard, %f is not a valid level.\n" % level)
    return CPMultiplier[int(2*level-2)]


