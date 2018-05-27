'''
file: gmfactory.py
author: bioweapon
last updated: May 27, 2018

The objective of this script is to parse a GAME_MASTER json file;
i.e., to reformat/rename the parameters and organize them in a meaningful way.

This script also provides some other utility functions.
'''


import sys, os, re, json, csv


typorder = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost",
        "steel", "fire", "water", "grass", "electric", "psychic", "ice", 
        "dragon", "dark", "fairy"]



def xtname(Str, Category):
    if Category == 'p':
        return ' '.join([s.capitalize() for s in Str.split('_')])
    elif Category == 'f':
        return ' '.join([s.capitalize() for s in Str.split('_')[:-1]])
    elif Category == 'c':
        return ' '.join([s.capitalize() for s in Str.split('_')])
    elif Category == 't':
        return Str.split('_')[-1].lower()


def parse(filepath):
    with open(filepath) as gmfile:
        gmdata = json.load(gmfile)

    POKEMON_SPECIES_DATA = []
    FAST_MOVE_DATA = []
    CHARGED_MOVE_DATA = []
    CPM_TABLE = []
    TYPE_ADVANTAGES = {}
    BATTLE_SETTINGS = {}
    WEATHER_SETTINGS = {}

    for template in gmdata["itemTemplates"]:
        tid = template['templateId']

        # Match Pokemon
        if re.fullmatch(r'V\d+_POKEMON_.+', tid):
            
            pokemon = {}
            pkmInfo = template["pokemonSettings"]
            pokemon['dex'] = int(tid.split('_')[0][1:])
            pokemon['name'] = xtname(pkmInfo["pokemonId"], 'p')
            pokemon['pokeType1'] = xtname(pkmInfo['type'], 't')
            pokemon['pokeType2'] = xtname(pkmInfo.get('type2','none'), 't')
            pokemon['baseAttack'] = pkmInfo["stats"]["baseAttack"]
            pokemon['baseDefense'] = pkmInfo["stats"]["baseDefense"]
            pokemon['baseStamina'] = pkmInfo["stats"]["baseStamina"]
            pokemon['fastMoves'] = [xtname(s,'f') for s in pkmInfo['quickMoves']]
            pokemon['chargedMoves'] = [xtname(s,'c') for s in pkmInfo['cinematicMoves']]
            pokemon['evolution'] = [xtname(s,'p') for s in pkmInfo.get('evolutionIds', [])]

            POKEMON_SPECIES_DATA.append(pokemon)
        
        # Match move, either Fast or Charge
        elif re.fullmatch(r'V\d+_MOVE_.+', tid):
            moveInfo = template['moveSettings']
            moveTag = 'f' if tid.split('_')[-1] == 'FAST' else 'c'
            
            move = {}
            move['name'] = xtname(moveInfo["movementId"], moveTag)
            move['pokeType'] = xtname(moveInfo["pokemonType"], 't')
            move['power'] = moveInfo.get("power", 0)
            move['duration'] = moveInfo["durationMs"] / 1000
            move['dws'] = moveInfo["damageWindowStartMs"] / 1000
            move['energyDelta'] = moveInfo.get("energyDelta", 0)

            if moveTag == 'f':
                FAST_MOVE_DATA.append(move)
            else:
                CHARGED_MOVE_DATA.append(move)

        # Match CPM's parent
        elif tid == 'PLAYER_LEVEL_SETTINGS':
            for cpm in template["playerLevel"]["cpMultiplier"]:
                if CPM_TABLE:
                    CPM_TABLE.append(((cpm**2+CPM_TABLE[-1]**2)/2)**0.5)
                CPM_TABLE.append(cpm)
        
        # Match Pokemon Types
        elif re.fullmatch(r'POKEMON_TYPE_.+', tid):
            pokemonType = xtname(tid, 't')
            TYPE_ADVANTAGES[pokemonType] = {}
            for idx, mtp in enumerate(template["typeEffective"]["attackScalar"]):
                TYPE_ADVANTAGES[pokemonType][typorder[idx]] = mtp
        
        # Match battle settings
        elif tid == 'BATTLE_SETTINGS':
            for attr in ['sameTypeAttackBonusMultiplier',
                         'maximumEnergy',
                         'energyDeltaPerHealthLost',
                         'dodgeDurationMs',
                         'swapDurationMs',
                         'dodgeDamageReductionPercent']:
                BATTLE_SETTINGS[attr] = template["battleSettings"][attr]

        # Match weather settings
        elif re.fullmatch(r'WEATHER_AFFINITY_.+', tid):
            weatherName = template["weatherAffinities"]["weatherCondition"]
            WEATHER_SETTINGS[weatherName] = [xtname(s,'t') for s in template["weatherAffinities"]["pokemonType"]]
        elif tid == 'WEATHER_BONUS_SETTINGS':
            BATTLE_SETTINGS['weatherAttackBonusMultiplier'] = template["weatherBonusSettings"]["attackBonusMultiplier"]

    
    return {
        'POKEMON_SPECIES_DATA': POKEMON_SPECIES_DATA,
        'FAST_MOVE_DATA': FAST_MOVE_DATA,
        'CHARGED_MOVE_DATA': CHARGED_MOVE_DATA,
        'CPM_TABLE': CPM_TABLE,
        'TYPE_ADVANTAGES': TYPE_ADVANTAGES,
        'BATTLE_SETTINGS': BATTLE_SETTINGS,
        'WEATHER_SETTINGS': WEATHER_SETTINGS
    }




def export_to_csv(dataArr, outputfilename, attrs = []):
    with open(outputfilename, 'w', newline='') as csvfile:
        mywriter = csv.writer(csvfile)

        if not attrs:
            attrs = sorted(dataArr[0].keys())
        mywriter.writerow(attrs)
        
        for entry in dataArr:
            line = []
            for a in attrs:
                line.append(entry.get(a, ''))
            mywriter.writerow(line)







