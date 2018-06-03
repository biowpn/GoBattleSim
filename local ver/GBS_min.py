'''
GBS.py

GoBattleSim written in python.
'''

import random, math, json

BATTLE_SETTINGS = {}
TYPE_ADVANTAGES = {}
WEATHER_SETTINGS = {}

class Pokemon:
    def __init__(self, config):
        self.name = config['name']
        self.pokeType1 = config['pokeType1']
        self.pokeType2 = config['pokeType2']
        self.Atk = config['Atk']
        self.Def = config['Def']
        self.maxHP = config['maxHP']
        self.fmove = config['fmove']
        self.cmove = config['cmove']

        self.atkr_choose = atkr_choose_0
        if config['dodge'] == 1:
            self.atkr_choose = atkr_choose_1
        elif config['dodge'] == 2:
            self.atkr_choose = atkr_choose_2

        self.init()

    def init(self):
        self.immortal = False
        self.has_dodged_next_attack = False
        self.active = False
        self.time_enter_ms = 0
        self.time_leave_ms = 0
        self.total_time_active_ms = 0
        self.num_deaths = 0
        self.tdo = 0
        self.tdo_fmove = 0
        self.total_energy_overcharged = 0
        self.n_fmoves = 0
        self.n_cmoves = 0
        self.n_addtional_fmoves = 0

        self.heal()

    def heal(self):
        self.HP = self.maxHP
        self.energy = 0

    def gain_energy(self, energyDelta):
        self.energy += energyDelta
        if self.energy > BATTLE_SETTINGS['maximumEnergy']:
            self.total_energy_overcharged += self.energy - BATTLE_SETTINGS['maximumEnergy']
            self.energy = BATTLE_SETTINGS['maximumEnergy']

    def take_damage(self, dmg):
        self.HP -= dmg
        if self.HP < 0 and not self.immortal:
            self.num_deaths += 1
            self.active = False
        self.gain_energy(math.ceil(dmg * BATTLE_SETTINGS['energyDeltaPerHealthLost']))
        self.has_dodged_next_attack = False

    def attribute_damage(self, dmg, mType):
        self.tdo += dmg
        if mType == 'f':
            self.tdo_fmove += dmg
            self.n_fmoves += 1
            self.n_addtional_fmoves += 1
        else:
            self.n_cmoves += 1
            self.n_addtional_fmoves = 0

    def get_statistics(self):
        return {
            'name': self.name,
            'hp': self.hp,
            'energy': self.energy,
            'tdo': self.tdo,
            'tdo_fmove' : self.tdo_fmove,
            'duration' : Math.round(self.total_time_active_ms/100)/10,
            'dps' : Math.round(self.tdo / (self.total_time_active_ms/1000)*100)/100,
            'teo' : self.total_energy_overcharged,
            'n_fmoves' : self.n_fmoves,
            'n_cmoves' : self.n_cmoves,
            'n_addtional_fmoves' : self.n_addtional_fmoves
        }


class Party:
    def __init__(self, config):
        self.revive_strategy = config['revive_strategy']
        self.pokemonArr = [Pokemon(p) for p in config['pokemon_list']]

        self.init()

    def init(self):
        for pkm in self.pokemonArr:
            pkm.init()
        self.active_idx = 0
        self.active_pkm = self.pokemonArr[0]

    def next_pokemon_up(self):
        self.active_idx += 1
        if self.active_idx < len(self.pokemonArr):
            self.active_pkm = self.pokemonArr[self.active_idx]
            return True
        else:
            self.active_idx = -1
            self.active_pkm = None
            return False

    def heal(self):
        for pkm in self.pokemonArr:
            pkm.heal()
        self.active_idx = 0
        self.active_pkm = self.pokemonArr[0]

    def get_statistic(self):
        return {
            'tdo': sum([p.tdo for p in self.pokemonArr]),
            'num_deaths': sum([p.num_deaths for p in self.pokemonArr])
        }


class Player:
    def __init__(self, config):
        self.partiesArr = [Party(p) for p in config['party_list']]
        self.init()

    def init(self):
        for p in self.partiesArr:
            p.init()
        self.active_idx = 0
        self.active_pkm = self.partiesArr[0].active_pkm
        self.num_rejoin = 0
        
    def next_pokemon_up(self):
        timeBeforeActive = 0
        current_party = self.partiesArr[self.active_idx]
        if current_party.next_pokemon_up():
            self.active_pkm = current_party.active_pkm
            timeBeforeActive = BATTLE_SETTINGS['swapDurationMs']
        else:
            timeBeforeActive = BATTLE_SETTINGS['rejoinDurationMs']
            if current_party.revive_strategy:
                current_party.heal()
                self.active_pkm = current_party.active_pkm
                timeBeforeActive += BATTLE_SETTINGS['itemMenuAnimationTimeMs'] + len(current_party.pokemonArr) * BATTLE_SETTINGS['maxReviveTimePerPokemonMs']
                self.num_rejoin += 1
            else:
                self.active_idx += 1
                if self.active_idx < len(self.partiesArr):
                    self.active_pkm = self.partiesArr[self.active_idx].active_pkm
                    self.num_rejoin += 1
                else:
                    self.active_idx = -1
                    self.active_pkm = None
                    timeBeforeActive = -1

        return timeBeforeActive

    def get_statistics(self, total_players_tdo):
        sum_tdo = 0
        sum_num_deaths = 0
        for p in self.partiesArr:
            pstat = p.get_statistics()
            sum_tdo += pstat.tdo
            sum_num_deaths += pstat.num_deaths

        return {
            'tdo': sum_tdo,
            'tdo_percentage': sum_tdo/total_players_tdo*100,
            'num_rejoin': self.num_rejoin,
            'num_deaths': sum_num_deaths
        }



class Timeline:
    def __init__(self):
        self.list = []

    def enqueue(self, e):
        i = 0
        while i < len(self.list) and e.t > self.list[i].t:
            i += 1
        self.list.insert(i, e)















                




