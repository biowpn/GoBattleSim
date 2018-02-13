
import math
import json
import os

# this should be the most current GM file
GMFileName_Current = "GAME_MASTER 2017.01.17.json"

# the file that will contain the dumped json
outFile = 'result.txt'







def importGM(path=GMFileName_Current):
    '''
    Returns fmovedata, cmovedata, speciesdata, CPMultiplier, typeadvantages
    '''
    
    # import the gamemaster data
    
    if not os.path.isfile(path):
        path = os.path.join(dirOfGM, path)
    with open(path) as gmfile:
        data = json.load(gmfile)

    fmovedata = []
    cmovedata = []
    speciesdata = []
    CPMultiplier = []
    typeadvantages = {}

   
    for row in data["itemTemplates"]:
        tid = str(row['templateId'])

        # FMOVEDATA, CMOVEDATA
        if ("_MOVE_" in tid) and not ("REROLL" in tid):
            move = dict()
            if "_FAST" in tid:
                movename = tid[11:-5].replace("_"," ").lower()
                movename.replace("-"," ")
                movename.replace(","," ")
                move['name'] = movename
                move['moveType'] = 'f'
            else:
                movename = tid[11:].replace("_"," ").lower()
                movename.replace("-"," ")
                movename.replace(","," ")
                move['name'] = movename
                move['moveType'] = 'c'

            #splash is missing a power value but calculated as 0
            if "SPLASH" in tid or "TRANSFORM" in tid or "YAWN" in tid:
                move['power'] = 0
            else: 
                try:
                    move['power'] = row['moveSettings']['power']
                except KeyError as e:
                    print("\n=== KeyError with the following move: %s (n=%d) ===\n" % (tid))
                    raise e

            move['pokeType'] = str(row['moveSettings']['pokemonType'])[13:].lower()
            
            #struggle and transform have no energydelta values
            if "STRUGGLE" in tid or "TRANSFORM" in tid or "REROLL" in tid:
                move['energyDelta'] = 0
            else:
                move['energyDelta'] = row['moveSettings']['energyDelta']

            move['dws'] = row['moveSettings']['damageWindowStartMs']
            move['duration'] = row['moveSettings']['durationMs']

            if move['moveType'] == 'f':
                fmovedata.append(move)
            else:
                cmovedata.append(move)


            
        # SPECIESDATA
        elif "_POKEMON_" in tid and tid[0]=="V":
            pkm = dict()

            pkm['dex'] = int(tid[2:5])

            pkm['name'] = row['pokemonSettings']['pokemonId'].lower()
            pkm['name'] = pkm['name'].replace("_"," ")
            pkm['name'] = pkm['name'].replace("-"," ")
            pkm['name'] = pkm['name'].replace(","," ")

            pkm['pokeType1'] = row['pokemonSettings']['type'][13:].lower()
            try:
                pkm['pokeType2'] = row['pokemonSettings']['type2'][13:].lower()
            except KeyError:
                pkm['pokeType2'] = 'none'

            pkm['baseAtk'] = row['pokemonSettings']['stats']['baseAttack']
            pkm['baseDef'] = row['pokemonSettings']['stats']['baseDefense']
            pkm['baseStm'] = row['pokemonSettings']['stats']['baseStamina']

            pkm['fastMoves'] = [x[:-5].replace("_"," ").lower() for x in row['pokemonSettings']['quickMoves']]
            pkm['chargedMoves'] = [x.replace("_"," ").lower() for x in row['pokemonSettings']['cinematicMoves']]

            speciesdata.append(pkm)


        # CPMULTIPLIER
        elif tid == "PLAYER_LEVEL_SETTINGS":
            CPMdata = row['playerLevel']['cpMultiplier']

    
    for n in range(len(CPMdata)-1):
        CPMultiplier += [CPMdata[n]]
        CPMultiplier += [math.sqrt((CPMdata[n]**2+CPMdata[n+1]**2)/2)]
    CPMultiplier += [CPMdata[-1]]


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








FAST_MOVE_DATA, CHARGED_MOVE_DATA, POKEMON_SPECIES_DATA, CPM_TABLE, POKEMON_TYPE_ADVANTAGES = importGM()


WEATHER_BOOSTED_TYPES = {'SUNNY_CLEAR':["grass","ground","fire"],
                         'RAIN':["water","electric","bug"],
                         'PARTLY_CLOUDY':["normal","rock"],
                         'CLOUDY':["fairy","fighting","poison"],
                         'WINDY':["dragon","flying","psychic"],
                         'SNOW':["ice","steel"],
                         'FOG':["dark","ghost"],
                         'EXTREME':[]}
WEATHER_LIST = list(WEATHER_BOOSTED_TYPES.keys())


RAID_BOSS_CPM = [0.61, 0.67, 0.7300000190734863, 0.7900000214576721, 0.7900000214576721]
RAID_BOSS_HP = [600, 1800, 3000, 7500, 12500]




outF = open(outFile, 'w')
outF.write("const FAST_MOVE_DATA = "+json.dumps(FAST_MOVE_DATA)+';\n\n')
outF.write("const CHARGED_MOVE_DATA = "+json.dumps(CHARGED_MOVE_DATA)+';\n\n')
outF.write("const POKEMON_SPECIES_DATA = "+json.dumps(POKEMON_SPECIES_DATA)+';\n\n')
outF.write("const CPM_TABLE = "+json.dumps(CPM_TABLE)+';\n\n')
outF.write("const POKEMON_TYPE_ADVANTAGES = "+json.dumps(POKEMON_TYPE_ADVANTAGES)+';\n\n')
outF.write("const WEATHER_BOOSTED_TYPES = "+json.dumps(WEATHER_BOOSTED_TYPES)+';\n\n')
outF.write("const WEATHER_LIST = "+json.dumps(WEATHER_LIST)+';\n\n')
outF.write("const RAID_BOSS_CPM = "+json.dumps(RAID_BOSS_CPM)+';\n\n')
outF.write("const RAID_BOSS_HP = "+json.dumps(RAID_BOSS_HP)+';\n\n')
outF.close()
