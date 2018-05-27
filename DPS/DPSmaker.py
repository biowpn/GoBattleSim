import gmfactory
import csv


IVs = [15,15,15]
enemyDPS1 = 900
enemyDef = 160

output = []


def fetch_by_name(name, database):
    for idx, entry in enumerate(database):
        if entry['name'] == name:
            return idx, entry
    return -1, None


def make(inputfilename, outputfilename):
    global output

    gmdata = gmfactory.parse(inputfilename)

    output = []

    for pkm in gmdata['POKEMON_SPECIES_DATA']:
        for fm_name in pkm['fastMoves']:
            for cm_name in pkm['chargedMoves']:
                atk_ = (pkm['baseAttack'] + IVs[0]) * 0.79
                def_ = (pkm['baseDefense'] + IVs[1]) * 0.79
                sta_ = (pkm['baseStamina'] + IVs[2]) * 0.79

                fm = fetch_by_name(fm_name, gmdata['FAST_MOVE_DATA'])[1]
                cm = fetch_by_name(cm_name, gmdata['CHARGED_MOVE_DATA'])[1]
                if not fm:
                    print('move not found: ' + fm_name)
                    continue
                if not cm:
                    print('move not found: ' + cm_name)
                    continue

                fSTAB = 1
                if fm['pokeType'] in [pkm['pokeType1'], pkm['pokeType2']]:
                    fSTAB = gmdata['BATTLE_SETTINGS']['sameTypeAttackBonusMultiplier']
                cSTAB = 1
                if cm['pokeType'] in [pkm['pokeType1'], pkm['pokeType2']]:
                    cSTAB = gmdata['BATTLE_SETTINGS']['sameTypeAttackBonusMultiplier']

                FDmg = 0.5*atk_*fm['power']*fSTAB/enemyDef + 0.5
                CDmg = 0.5*atk_*cm['power']*cSTAB/enemyDef + 0.5
                FDur = fm['duration']
                CDur = cm['duration']
                FE = fm['energyDelta']
                CE = -cm['energyDelta']

                if FDur*CE + CDur*FE == 0:
                    continue

                # Energy left (x) and enemy DPS (y)
                x = 0.5*CE + 0.5*FE
                y = enemyDPS1 / def_
                

                # Step 1: Get the Survival Time
                ST = sta_ / y

                # Step 2: Apply punishment for one-bar charge moves overcharge
                if CE == 100:
                    CE += 0.5 * FE + 0.5 * y * (cm['dws']/1000) 
                
                # Step 3: Get the total number of fast moves
                n = (ST*CE + CDur*(x-0.5*sta_))/(FDur*CE + CDur*FE)

                # Step 4: Get the total number of charge moves
                m = (ST*FE - FDur*(x-0.5*sta_))/(FDur*CE + CDur*FE)   

                # Step 5: Get TDO
                compTDO = n * FDmg + m * CDmg

                # DPS
                compDPS = compTDO/ST

                # rounding
                compDPS = round(compDPS, 3)
                compTDO = round(compTDO, 3)

                # put the current result to output
                output.append({'dex': pkm['dex'],
                               'pokemon': pkm,
                               'name': pkm['name'],
                               'fmove': fm,
                               'fmove_name': fm['name'],
                               'cmove': cm,
                               'cmove_name': cm['name'],
                               'dps': compDPS,
                               'tdo': compTDO})


    output.sort(key=lambda x: x['dps'], reverse=True)

    gmfactory.export_to_csv(output, outputfilename,
                  ["dex", "name", "fmove_name", "cmove_name", "dps", "tdo"])
    print("done.")



'''
Utility
'''
def retrive_first(iterable, pred):
    for obj in iterable:
        if pred(obj):
            return obj
    return None

def retrive_all(iterable, pred):
    res = []
    for obj in iterable:
        if pred(obj):
            res.append(obj)
    return res











