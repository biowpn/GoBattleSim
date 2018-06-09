/* GBS_Core.js */

/* 
 *	PART I(a): GAME DATA
 */
 
const MAX_NUM_POKEMON_PER_PARTY = 6;
const MAX_NUM_PARTIES_PER_PLAYER = 5;
const MAX_NUM_OF_PLAYERS = 20;

var BATTLE_SETTINGS = {
	// From Game Master
	'sameTypeAttackBonusMultiplier': 1.2, 
	'maximumEnergy': 100, 
	'energyDeltaPerHealthLost': 0.5, 
	'dodgeDurationMs': 500, 
	'swapDurationMs': 1000, 
	'dodgeDamageReductionPercent': 0.75, 
	'weatherAttackBonusMultiplier': 1.2,
	
	// Self-defined
	'dodgeWindowMs': 700,
	'dodgeSwipeMs': 300,
	'arenaEntryLagMs': 3000,
	'arenaEarlyTerminationMs': 3000,
	'fastMoveLagMs': 25,
	'chargedMoveLagMs': 100,
	'timelimitGymMs': 100000,
	'timelimitRaidMs': 180000,
	'timelimitLegendaryRaidMs': 300000,
	'rejoinDurationMs': 10000,
	'itemMenuAnimationTimeMs': 200,
	'maxReviveTimePerPokemonMs': 800
};


// These data are populated else where
var FAST_MOVE_DATA = [];
var CHARGED_MOVE_DATA = [];
var MOVE_EFFECT_DATA = [];
var POKEMON_SPECIES_DATA = [];
var LEVEL_VALUES = [];
var IV_VALUES = [];
var CPM_TABLE = [];

var TYPE_ADVANTAGES = {"normal": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.0, "ghost": 0.51, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "fighting": {"normal": 1.4, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 0.51, "steel": 1.4, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.4, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "flying": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "poison": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 0.714, "ground": 0.714, "rock": 0.714, "bug": 1.0, "ghost": 0.714, "steel": 0.51, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "ground": {"normal": 1.0, "fighting": 1.0, "flying": 0.51, "poison": 1.4, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 1.4, "fire": 1.4, "water": 1.0, "grass": 0.714, "electric": 1.4, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "rock": {"normal": 1.0, "fighting": 0.714, "flying": 1.4, "poison": 1.0, "ground": 0.714, "rock": 1.0, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.4, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "bug": {"normal": 1.0, "fighting": 0.714, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 0.714, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "ghost": {"normal": 0.51, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 1.0}, "steel": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.0, "electric": 0.714, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "fire": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 1.4, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "water": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.4, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.4, "water": 0.714, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "grass": {"normal": 1.0, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.4, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.4, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "electric": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 0.51, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.0, "water": 1.4, "grass": 0.714, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "psychic": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.4, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.0, "dragon": 1.0, "dark": 0.51, "fairy": 1.0}, "ice": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 1.4, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 0.714, "dragon": 1.4, "dark": 1.0, "fairy": 1.0}, "dragon": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.0, "fairy": 0.51}, "dark": {"normal": 1.0, "fighting": 0.714, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 0.714}, "fairy": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.4, "fairy": 1.0}};

var WEATHER_BOOSTED_TYPES = {"SUNNY_CLEAR": ["grass", "ground", "fire"], "RAIN": ["water", "electric", "bug"], "PARTLY_CLOUDY": ["normal", "rock"], "CLOUDY": ["fairy", "fighting", "poison"], "WINDY": ["dragon", "flying", "psychic"], "SNOW": ["ice", "steel"], "FOG": ["dark", "ghost"], "EXTREME": []};

var WEATHER_LIST = ["EXTREME", "SUNNY_CLEAR", "RAIN", "PARTLY_CLOUDY", "CLOUDY", "WINDY", "SNOW", "FOG"];

var WeatherSettings = [{'name': 'CLEAR', 'boostedTypes': ['grass', 'ground', 'fire']}, {'name': 'FOG', 'boostedTypes': ['dark', 'ghost']}, {'name': 'CLOUDY', 'boostedTypes': ['fairy', 'fighting', 'poison']}, {'name': 'PARTLY_CLOUDY', 'boostedTypes': ['normal', 'rock']}, {'name': 'RAINY', 'boostedTypes': ['water', 'electric', 'bug']}, {'name': 'SNOW', 'boostedTypes': ['ice', 'steel']}, {'name': 'WINDY', 'boostedTypes': ['dragon', 'flying', 'psychic']}];

var RAID_BOSS_CPM = [0.6, 0.67, 0.7300000190734863, 0.7900000214576721, 0.7900000214576721];

var RAID_BOSS_HP = [600, 1800, 3000, 7500, 12500];



/* 
 *	PART I(b): SIMULATOR SETTINGS
 */

const EVENT_TYPE = {
	AtkrFree: 0,
	DfdrFree: 1,
	Hurt: 2,
	EnergyDelta: 3,
	Enter: 4,
	Dodge: 5,
	Announce: 6,
	MoveEffect: 7
};




/*
 *	PART II: GLOBAL FUNCTIONS
 */

function damage(dmg_giver, dmg_taker, move, weather){
	var stab = 1;
	if (move.pokeType == dmg_giver.pokeType1 || move.pokeType == dmg_giver.pokeType2){
		stab = BATTLE_SETTINGS.sameTypeAttackBonusMultiplier;
	}
	var wab = 1;
	if (WEATHER_BOOSTED_TYPES[weather].includes(move.pokeType)){
		wab = BATTLE_SETTINGS.weatherAttackBonusMultiplier;
	}
	var effe1 = TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType1] || 1;
	var effe2 = TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType2] || 1;
	return Math.ceil(0.5*dmg_giver.Atk/dmg_taker.Def*move.power*effe1*effe2*stab*wab);
}

function calculateCP(pkm){
	return Math.max(10, Math.floor((pkm.baseAtk+pkm.atkiv)*Math.sqrt((pkm.baseDef+pkm.defiv)*(pkm.baseStm+pkm.stmiv))*pkm.cpm*pkm.cpm/10));
}

function calculateLevelByCP(pkm, CP){
	var pkm_copy = JSON.parse(JSON.stringify(pkm));
	for (var i = 0; i < CPM_TABLE.length; i++){
		pkm_copy.cpm = CPM_TABLE[i];
		if (calculateCP(pkm_copy) >= CP)
			return i/2 + 1;
	}
	return (CPM_TABLE.length - 1)/2 + 1;
}

 


/*
 *	PART III: CLASSES
 */

/* Class <Move> */
// constructor
function Move(cfg){
	for (var attr in cfg){
		this[attr] = cfg[attr];
	}
	if (this.effect_name){
		this.effect = JSON.parse(JSON.stringify(MOVE_EFFECT_DATA[getIndexByName(this.effect_name, MOVE_EFFECT_DATA)]));
		this.effect.sub = MOVE_EFFECT_SUBROUTINE_DICTIONARY[this.effect.sub_name];
	}
}

Move.prototype.export_state = function(){
	return {
		'name': this.name,
		'pokeType': this.pokeType,
		'power': this.power,
		'energyDelta': this.energyDelta,
		'duration': this.duration,
		'dws': this.dws
	};
}


/* End of Class Move */



/* Class <Pokemon> */
// constructor
function Pokemon(cfg){
	this.index = cfg.index;
	this.fmove_index = cfg.fmove_index;
	this.cmove_index = cfg.cmove_index;

	this.raidTier = cfg.raid_tier;
	this.atkiv = parseInt(cfg.atkiv);
	this.defiv = parseInt(cfg.defiv);
	this.stmiv = parseInt(cfg.stmiv);
	this.level = parseFloat(cfg.level);
	
	this.atkr_choose = window['atkr_choose_' + cfg.dodge] || atkr_choose_0;
	
	this.immortal = false;
	this.playerCode = cfg.player_code;
	this.index_party = cfg.index_party;
	
	this.init();
}

Pokemon.prototype.export_state = function(){
	return {
		'name': this.name,
		'pokeType1': this.pokeType1,
		'pokeType2': this.pokeType2,
		'Atk': this.Atk,
		'Def': this.Def,
		'Stm': this.Stm,
		'maxHP': this.maxHP,
		'fmove': this.fmove.export_state(),
		'cmove': this.cmove.export_state(),
		'dodge': this.dodge
	};
}

Pokemon.prototype.init = function(){
	for (var attr in POKEMON_SPECIES_DATA[this.index]){
		this[attr] = POKEMON_SPECIES_DATA[this.index][attr];
	}
	this.fmove = new Move(FAST_MOVE_DATA[this.fmove_index]);
	this.cmove = new Move(CHARGED_MOVE_DATA[this.cmove_index]);
	
	this.calculate_current_stats();
	
	this.has_dodged_next_attack = false;
	this.active = false;
	this.time_enter_ms = 0;
	this.time_leave_ms = 0;
	this.total_time_active_ms = 0;
	this.num_deaths = 0;
	this.tdo = 0;
	this.tdo_fmove = 0;
	this.total_energy_overcharged = 0;
	this.n_fmoves = 0;
	this.n_cmoves = 0;
	this.n_addtional_fmoves = 0;
	
	this.heal();
}

Pokemon.prototype.calculate_current_stats = function(){
	this.cpm = CPM_TABLE[Math.round(2*this.level - 2)];
	this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
	this.Def = (this.baseDef + this.defiv) * this.cpm;
	this.Stm = (this.baseStm + this.stmiv) * this.cpm;
	if (!this.raidTier){ // attacker
		this.maxHP = Math.floor(this.Stm);
	}else if (this.raidTier < 0){ // gym defender
		this.maxHP = 2 * Math.floor(this.Stm);
		this.playerCode = 'dfdr';
	}else {// raid boss
		this.cpm = RAID_BOSS_CPM[this.raidTier - 1];
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = RAID_BOSS_HP[this.raidTier - 1];
		this.playerCode = 'dfdr';
	}
}


Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
}

// A Pokemon gains/(loses) energy
Pokemon.prototype.gain_energy = function(energyDelta){
	this.energy += energyDelta;
	if (this.energy > BATTLE_SETTINGS.maximumEnergy){
		this.total_energy_overcharged += this.energy - BATTLE_SETTINGS.maximumEnergy;
		this.energy = BATTLE_SETTINGS.maximumEnergy;
	}
}

// A Pokemon takes damage and gains energy
Pokemon.prototype.take_damage = function(dmg){
	this.HP -= dmg;
	if (this.HP <= 0 && !this.immortal){
		this.num_deaths++;
		this.active = false;
	}
	this.gain_energy(Math.ceil(dmg * BATTLE_SETTINGS.energyDeltaPerHealthLost));
	this.has_dodged_next_attack = false;
}

// Keeping record of tdo for performance analysis
Pokemon.prototype.attribute_damage = function(dmg, mType){
	this.tdo += dmg;
	if (mType == 'f'){
		this.tdo_fmove += dmg;
		this.n_fmoves += 1;
		this.n_addtional_fmoves += 1;
	}else{
		this.n_cmoves += 1;
		this.n_addtional_fmoves = 0;
	}
}


// Return the performance statistics of the Pokemon
Pokemon.prototype.get_statistics = function(){
	return {
		player_code: this.playerCode,
		index : this.index,
		name : this.name,
		hp : this.HP,
		energy : this.energy,
		tdo: this.tdo,
		tdo_fmove : this.tdo_fmove,
		duration : Math.round(this.total_time_active_ms/100)/10,
		dps : Math.round(this.tdo / (this.total_time_active_ms/1000)*100)/100,
		teo : this.total_energy_overcharged,
		n_fmoves : this.n_fmoves,
		n_cmoves : this.n_cmoves,
		n_addtional_fmoves : this.n_addtional_fmoves
	};
}
/* End of Class <Pokemon> */


/* Class <Party> */
// constructor
function Party(cfg){
	this.playerCode = cfg.player_code;
	this.revive_strategy = cfg.revive_strategy;
	
	this.pokemonArr = [];
	for (var k = 0; k < cfg.pokemon_list.length; k++){
		cfg.pokemon_list[k].player_code = this.playerCode;
		for (var r = 0; r < cfg.pokemon_list[k].copies; r++){
			var pkmCfg = cfg.pokemon_list[k];
			pkmCfg.index_party = this.pokemonArr.length;
			this.pokemonArr.push(new Pokemon(pkmCfg));
		}
	}
	
	this.init();
}

Party.prototype.export_state = function(){
	var state = {
		'revive_strategy': this.revive_strategy,
		'pokemon_list': []
	};
	for (var i = 0; i < this.pokemonArr.length; i++)
		state.pokemon_list.push(this.pokemonArr[i].export_state());
	return state;
}

Party.prototype.init = function(){
	this.pokemonArr.forEach(function(pkm){
		pkm.init();
	});
	this.active_idx = 0;
	this.active_pkm = this.pokemonArr[0];
}


// Switch the active Pokemon to the next Pokemon in the party
// Returns true if successful. Otherwise sets active_pkm to null
Party.prototype.next_pokemon_up = function (){
	if (++this.active_idx < this.pokemonArr.length){
		this.active_pkm = this.pokemonArr[this.active_idx];
		return true;
	}else{
		this.active_idx = -1;
		this.active_pkm = null;
		return false; 
	}
}

// Fully heal each fainted Pokemon, sets the active_pkm to the first one
Party.prototype.heal = function (){
	for (var i = 0; i < this.pokemonArr.length; i++){
		this.pokemonArr[i].heal();
	}
	this.active_idx = 0;
	this.active_pkm = this.pokemonArr[0];
}

// Return the performance statistics of the team
Party.prototype.get_statistics = function(){
	var sum_tdo = 0, sum_num_deaths = 0;
	for (var i = 0; i < this.pokemonArr.length; i++){
		sum_tdo += this.pokemonArr[i].tdo;
		sum_num_deaths += this.pokemonArr[i].num_deaths;
	}
	
	return {
		tdo : sum_tdo,
		num_deaths : sum_num_deaths
	};
}
/* End of Class <Party> */


/* Class <Player> */
function Player(cfg){
	this.playerCode = cfg.player_code;
	
	this.partiesArr = [];
	for (var j = 0; j < cfg.party_list.length; j++){
		cfg.party_list[j].player_code = this.playerCode;
		this.partiesArr.push(new Party(cfg.party_list[j]));
	}
	this.init();
}

Player.prototype.export_state = function(){
	var state = {
		'party_list': []
	};
	for (var i = 0; i < this.partiesArr.length; i++)
		state.party_list.push(this.partiesArr[i].export_state());
	return state;
}

Player.prototype.init = function(){
	this.partiesArr.forEach(function(party){
		party.init();
	});
	this.active_idx = 0;
	this.active_pkm = this.partiesArr[0].active_pkm;
	this.num_rejoin = 0;
}

// Control asks for the next Pokemon, and the time before it is sent to field.
// Return -1 if this player is done.
Player.prototype.next_pokemon_up = function(){
	var timeBeforeActive = 0;
	var current_party = this.partiesArr[this.active_idx];
	if (current_party.next_pokemon_up()){ // Current party has next active Pokemon up
		this.active_pkm = current_party.active_pkm;
		timeBeforeActive = BATTLE_SETTINGS.swapDurationMs;
	}else{ // Current party all faint. Need to rejoin
		timeBeforeActive = BATTLE_SETTINGS.rejoinDurationMs;
		if (current_party.revive_strategy == true){ // Revive currently party
			current_party.heal();
			this.active_pkm = current_party.active_pkm;
			timeBeforeActive += BATTLE_SETTINGS.itemMenuAnimationTimeMs +  current_party.pokemonArr.length * BATTLE_SETTINGS.maxReviveTimePerPokemonMs;
			this.num_rejoin++;
		}else{ // Try to switch to the next line-up, no need to revive
			if (++this.active_idx < this.partiesArr.length){
				this.active_pkm = this.partiesArr[this.active_idx].active_pkm;
				this.num_rejoin++;
			}else{ // Too bad, this player is out of game!
				this.active_idx = -1;
				this.active_pkm = null;
				timeBeforeActive = -1;
			}
		}
	}
	return timeBeforeActive;
}


Player.prototype.get_statistics = function(total_players_tdo){
	var sum_tdo = 0, sum_num_deaths = 0;
	for (var i = 0; i < this.partiesArr.length; i++){
		var party_stat = this.partiesArr[i].get_statistics();
		sum_tdo += party_stat.tdo;
		sum_num_deaths += party_stat.num_deaths;
	}
	
	return {
		player_code : this.playerCode,
		tdo : sum_tdo,
		tdo_percentage : Math.round(sum_tdo/total_players_tdo*100*10)/10,
		num_rejoin : this.num_rejoin,
		num_deaths : sum_num_deaths
	};
}


/* End of Class <Player> */

/* Class <Timeline> */
// constructor
function Timeline(){
	this.list = [];
}

// Insert a new event and the timeline remains sorted
Timeline.prototype.enqueue = function (e){
	var i = 0;
	while(i < this.list.length && e.t > this.list[i].t){
		i++;
	}
	this.list.splice(i, 0, e);
}


/* End of Class <Timeline> */


/* Class <World> */
// constructor
// Takes a configuration dictionary object "cfg" for sim parameters
function World(cfg){
	// Set up general
	this.raid_tier = cfg['dfdrSettings']['raid_tier'];
	if (this.raid_tier == -1)
		this.timelimit_ms = BATTLE_SETTINGS.timelimitGymMs;
	else if (this.raid_tier < 5)
		this.timelimit_ms = BATTLE_SETTINGS.timelimitRaidMs;
	else
		this.timelimit_ms = BATTLE_SETTINGS.timelimitLegendaryRaidMs;
	this.weather = cfg['generalSettings']['weather'] || "EXTREME";
	this.log_style = cfg['generalSettings']['logStyle'] || 0;
	this.dodge_bug = cfg['generalSettings']['dodgeBug'] || 0;
	this.immortal_defender = cfg['generalSettings']['immortalDefender'] || 0;
	
	// Set up players
	this.playersArr = [];
	for (var i = 0; i < cfg['atkrSettings'].length; i++)
		this.playersArr.push(new Player(cfg['atkrSettings'][i]));
	
	// Set up defender
	this.dfdr = new Pokemon(cfg['dfdrSettings']);
	if (this.immortal_defender){
		this.dfdr.immortal = true;
		this.playersArr.forEach(function(player){
			player.partiesArr.forEach(function(party){
				party.revive_strategy = false;
			});
		});
	}
	
	this.init();
}

World.prototype.export_state = function(){
	var state = {
		'atkrSettings': [],
		'dfdrSettings': this.dfdr.export_state(),
		'generalSettings': {
			'timelimit_ms': this.timelimit_ms,
			'weather': this.weather,
			'dodgeBug': this.dodgeBug,
			'immortalDefender': this.immortalDefender
		},
		'battleSettings': JSON.parse(JSON.stringify(BATTLE_SETTINGS))
	};
	for (var i = 0; i < this.playersArr.length; i++)
		state.atkrSettings.push(this.playersArr[i].export_state());
	
	return state;
}

World.prototype.init = function(){
	this.playersArr.forEach(function(player){
		player.init();
	});
	this.dfdr.init();
	
	this.tline = new Timeline();
	this.any_player_active_bool = true;
	this.any_attacker_fainted_bool = false;
	this.projected_atkrHurtEvent = null;
	this.battle_length = 0;
	this.log = [];
}

// Player's Pokemon uses a move
World.prototype.atkr_use_move = function(pkm, pkm_hurt, move, t){
	t += move.moveType == 'f' ? BATTLE_SETTINGS.fastMoveLagMs : BATTLE_SETTINGS.chargedMoveLagMs;
	var energyDeltaEvent = {
		name: EVENT_TYPE.EnergyDelta, t: t + move.dws, subject: pkm, energyDelta: move.energyDelta
	};
	this.tline.enqueue(energyDeltaEvent);
	
	var dmg = damage(pkm, pkm_hurt, move, this.weather);
	var hurtEvent = {
		name: EVENT_TYPE.Hurt, t: t + move.dws, subject: pkm_hurt, object: pkm, move: move, dmg: dmg
	};
	this.tline.enqueue(hurtEvent);
	
	if (move.effect){
		move.effect.sub({
			"world": this,
			"parameters": move.effect.parameters,
			"pkm": pkm,
			"pkm_hurt": pkm_hurt,
			"move": move,
			"t": t,
			"hurtEvent": hurtEvent,
			"energyDeltaEvent": energyDeltaEvent
		});
	}
}

// Gym Defender/Raid Boss uses a move, hurting all active attackers
World.prototype.dfdr_use_move = function(pkm, move, t){
	var energyDeltaEvent = {
		name: EVENT_TYPE.EnergyDelta, t: t + move.dws, subject: pkm, energyDelta: move.energyDelta
	};
	this.tline.enqueue(energyDeltaEvent);
	
	for (var i = 0; i < this.playersArr.length; i++){
		var pkm_hurt = this.playersArr[i].active_pkm;
		if (pkm_hurt && pkm_hurt.active){
			var dmg = damage(pkm, pkm_hurt, move, this.weather);
			var hurtEvent = {
				name: EVENT_TYPE.Hurt, t: t + move.dws, subject: pkm_hurt, object: pkm, move: move, dmg: dmg
			};
			this.tline.enqueue(hurtEvent);
			if (move.effect){
				move.effect.sub({
					"world": this,
					"parameters": move.effect.parameters,
					"pkm": pkm,
					"pkm_hurt": pkm_hurt,
					"move": move,
					"t": t,
					"hurtEvent": hurtEvent,
					"energyDeltaEvent": energyDeltaEvent
				});
			}
		}
	}
	this.projected_atkrHurtEvent = {name: EVENT_TYPE.Hurt, t: t + move.dws, object: pkm, move: move};
}



// Enqueue events to timeline according from a list of actions
// And ask for the next action when the attacker is free again
World.prototype.enqueueActions = function(pkm, pkm_hurt, t, actions){
	var tFree = t;
	for (var i = 0; i < actions.length; i++){
		if (actions[i] == 'f'){ // Use fast move
			this.tline.enqueue({
				name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.fmove
			});
			tFree += pkm.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs;
		}else if (actions[i] == 'c'){ // Use charge move if energy is enough
			if (pkm.energy + pkm.cmove.energyDelta >= 0){
				this.tline.enqueue({
					name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.cmove
				});
				tFree += pkm.cmove.duration + BATTLE_SETTINGS.chargedMoveLagMs;
			}else{ // insufficient energy, use fmove instead
				this.tline.enqueue({
					name: EVENT_TYPE.Announce, t: tFree, subject: pkm, object: pkm_hurt, move: pkm.fmove
				});
				tFree += pkm.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs;
			}
		}else if (actions[i] == 'd'){ // dodge
			this.tline.enqueue({
				name: EVENT_TYPE.Dodge, t: tFree, subject: pkm
			});
			tFree += BATTLE_SETTINGS.dodgeDurationMs;
		}else // wait
			tFree += actions[i];
	}
	this.tline.enqueue({
		name: EVENT_TYPE.AtkrFree, t: tFree, subject: pkm
	});
}

// Finds and returns the next Hurt event of a specified Pokemon
World.prototype.nextHurtEventOf = function(pkm){
	for (var i = 0; i < this.tline.list.length; i++){
		var thisEvent = this.tline.list[i];
		if (thisEvent.name == EVENT_TYPE.Hurt && thisEvent.subject.playerCode == pkm.playerCode && thisEvent.subject.index_party == pkm.index_party)
			return thisEvent;
	}
}


// Gym Defender/Raid Boss strategy
World.prototype.dfdr_choose = function (pkm, t, current_move){
	// A defender decides the next action (at t + current_move.duration + delay) now (at t)

	var next_move = pkm.fmove;
	var next_t = t + current_move.duration;
	
	// If the projected energy is enough to use cmove, then 0.5 probablity it will use
	if (pkm.energy + current_move.energyDelta + pkm.cmove.energyDelta >= 0 && Math.random() <= 0.5){
		next_move = pkm.cmove;
	}
	// Add the defender delay
	next_t += 1500 + Math.round(1000 * Math.random());
	
	this.tline.enqueue({
		name: EVENT_TYPE.DfdrFree, t: next_t, subject: pkm, move: next_move
	});
	this.tline.enqueue({
		name: EVENT_TYPE.Announce, t: next_t, subject: pkm, move: next_move
	});
}


// Gym Defender or Raid Boss moves at the start of a battle
World.prototype.initial_dfdr_choose = function (dfdr, t){
	this.dfdr_use_move(dfdr, dfdr.fmove, t);
	this.dfdr_choose(dfdr, t - dfdr.fmove.duration, dfdr.fmove);
}

// Check if any of the player is still in game
World.prototype.any_player_active = function (){
	for (var i = 0; i < this.playersArr.length; i++){
		var pkm = this.playersArr[i].active_pkm;
		if (pkm && pkm.HP > 0){
			return true;
		}
	}
	return false;
}


// TODO: Main function for simulating a battle
World.prototype.battle = function (){
	var t = BATTLE_SETTINGS.arenaEntryLagMs;
	var elog = [];
	var dfdr = this.dfdr;
	
	for (var i = 0; i < this.playersArr.length; i++){
		var atkr = this.playersArr[i].active_pkm;
		if (atkr)
			atkr.active = true;
		this.tline.enqueue({
			name: EVENT_TYPE.Enter, t: t, subject: atkr
		});
	}
	
	this.tline.enqueue({
		name: EVENT_TYPE.Enter, t: t, subject: dfdr
	});
	this.initial_dfdr_choose(dfdr, t);
	dfdr.active = true;

	while (dfdr.active && this.any_player_active_bool){
		var e = this.tline.list.shift();
		t = e.t;
		if (t >= this.timelimit_ms - BATTLE_SETTINGS.arenaEarlyTerminationMs && !this.immortal_defender)
			break;
		
		// 1. First process the event
		if (e.name == EVENT_TYPE.AtkrFree){
			var actions = e.subject.atkr_choose({
				t: t,
				dfdr: dfdr,
				weather: this.weather,
				dodge_bug: this.dodgebug,
				projected_atkrHurtEvent: this.projected_atkrHurtEvent
			});
			this.enqueueActions(e.subject, dfdr, t, actions);
		}else if (e.name == EVENT_TYPE.DfdrFree){
			this.dfdr_choose(e.subject, t, e.move);
		}else if (e.name == EVENT_TYPE.Hurt){
			if (e.subject.active && e.object.active){
				e.subject.take_damage(e.dmg);
				e.subject.has_dodged_next_attack = false;
				if (e.subject.HP <= 0 && e.subject.raidTier == 0)
					this.any_attacker_fainted_bool = true;
				e.object.attribute_damage(e.dmg, e.move.moveType);
				elog.push(e);
			}
		}else if (e.name == EVENT_TYPE.EnergyDelta){
			e.subject.gain_energy(e.energyDelta);
		}else if (e.name == EVENT_TYPE.Enter){
			e.subject.time_enter_ms = t;
			e.subject.active = true;
			if (e.subject.raidTier == 0) // Atkr
				this.tline.enqueue({
					name: EVENT_TYPE.AtkrFree, t: t + 100, subject: e.subject
				});
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Dodge){
			var eHurt = this.nextHurtEventOf(e.subject);
			if (eHurt && !e.dodged && (eHurt.t - BATTLE_SETTINGS.dodgeWindowMs) <= t && t <= eHurt.t){
				eHurt.dmg = Math.max(1, Math.floor(eHurt.dmg * (1 - BATTLE_SETTINGS.dodgeDamageReductionPercent)));
				e.dodged = true;
			}
			elog.push(e);
		}else if (e.name == EVENT_TYPE.Announce){
			if (e.subject.raidTier == 0) // Atkr
				this.atkr_use_move(e.subject, e.object, e.move, t);
			else
				this.dfdr_use_move(e.subject, e.move, t);
		}else if (e.name == EVENT_TYPE.MoveEffect){
			e.action(e);
			elog.push(e);
		}
		
		// 2. Check if some attacker fainted
		if (this.any_attacker_fainted_bool){
			for (var i = 0; i < this.playersArr.length; i++){
				var this_player = this.playersArr[i], old_pkm = this.playersArr[i].active_pkm;
				if (old_pkm && old_pkm.HP <= 0){
					for (var j = 0; j < this.tline.list.length; j++){
						var thisEvent =  this.tline.list[j];
						if (thisEvent.name == EVENT_TYPE.AtkrFree && thisEvent.subject.playerCode == old_pkm.playerCode && thisEvent.subject.index_party == old_pkm.index_party)
							this.tline.list.splice(j--, 1);
					}
					old_pkm.time_leave_ms = t;
					old_pkm.total_time_active_ms += t - old_pkm.time_enter_ms;
					var delay = this_player.next_pokemon_up(); // Ask for sending another attacker
					if (this_player.active_pkm)
						this.tline.enqueue({
							name: EVENT_TYPE.Enter, t: t + delay, subject: this_player.active_pkm
						});
				}
			}
			this.any_attacker_fainted_bool = false;
			this.any_player_active_bool = this.any_player_active();
		}
		
		// 3. Check if the defender fainted
		if (!dfdr.active){
			dfdr.time_leave_ms = t;
			dfdr.total_time_active_ms += t - dfdr.time_enter_ms;
		}
		
		// 4. Process the next event if it's at the same time before deciding whether the battle has ended
		if (this.tline.list.length > 0 && t == this.tline.list[0].t)
			continue;
		if (this.log_style && elog.length > 0)
			this.add_to_log(elog);
		elog = [];
	}
	
	// Battle has ended, some leftovers
	if (this.log_style && elog.length > 0)
		this.add_to_log(elog);
		
	this.battle_length = t;
	for (var i = 0; i < this.playersArr.length; i++){
		var pkm = this.playersArr[i].active_pkm;
		if (pkm && pkm.active){
			pkm.time_leave_ms = t;
			pkm.total_time_active_ms += t - pkm.time_enter_ms;
		}
	}
	if (dfdr.active){
		dfdr.time_leave_ms = t;
		dfdr.total_time_active_ms += t - dfdr.time_enter_ms;
	}
}


// Add events of the same time to battle log
// Format: [time] [team 1 pokemon] ... [team n pokemon] [defender]
World.prototype.add_to_log = function(events){
	var numPlayer = this.playersArr.length;
	// Correspond to Enter, AtkrHurt, DfdrHurt, AtkrDogde, and move effect event
	var rowData = [[],[],[],[],[]];
	var nonEmpty = [false, false, false, false, false];
	var dfdrHurt_totalDmg = 0;
	for (var i = 0; i < rowData.length; i++){
		rowData[i].t = Math.round((events[0]).t/10)/100;
		rowData[i].dfdr = "";
		for (var j = 1; j <= numPlayer; j++)
			rowData[i][j] = "";
	}
	
	for (var i = 0; i < events.length; i++){
		var e = events[i];
		if (e.name == EVENT_TYPE.Enter){
			nonEmpty[0] = true;
			rowData[0][e.subject.playerCode] = 'pokemon:' + e.subject.index;
		}else if (e.name == EVENT_TYPE.Hurt){
			if (e.subject.raidTier == 0){ // atkrHurt
				nonEmpty[1] = true;
				rowData[1][e.subject.playerCode] = e.subject.HP + '(-' + e.dmg + ')';
				rowData[1].dfdr = e.move.moveType + 'move:' + e.move.index;
			} else{ // dfdrHurt
				nonEmpty[2] = true;
				dfdrHurt_totalDmg += e.dmg;
				rowData[2].dfdr = e.subject.HP; // calculate dmg later
				rowData[2][e.object.playerCode] = e.move.moveType + 'move:' + e.move.index;
			}
		}else if (e.name == EVENT_TYPE.Dodge){
			nonEmpty[3] = true;
			rowData[3][e.subject.playerCode] = EVENT_TYPE.Dodge;
		}else if (e.name == EVENT_TYPE.MoveEffect){
			nonEmpty[4] = true;
			rowData[4][e.subject.playerCode] = e.text;
		}
	}
	if (nonEmpty[2]){
		rowData[2].dfdr += '(-' + dfdrHurt_totalDmg + ')';
	}
	
	for (var i = 0; i < rowData.length; i++){
		if(nonEmpty[i])
			this.log.push(rowData[i]);
	}
}

// Return the statistis and battle log
World.prototype.get_statistics = function(){
	// The information package include four parts:
	var general_stat = [];	// 1. General statistics (time, winner, etc)
	var player_stats = [];	// 2. Players performance statistics
	var pokemon_stats = [];	// 3. Individual Pokemon performance statistics, including the defender
	var battle_log = [];	// 4. Battle log (if number of team <= 3, will generate style 2 log)
	
	general_stat['duration'] = Math.round(this.battle_length/100)/10;
	general_stat['total_deaths'] = 0;
	general_stat['battle_result'] = this.dfdr.active ? "Lose" : "Win";
	
	general_stat['tdo'] = this.dfdr.maxHP - this.dfdr.HP;
	general_stat['tdo_percent'] = Math.round(general_stat['tdo'] / this.dfdr.maxHP *1000)/10;
	general_stat['dps'] = Math.round(general_stat['tdo'] / (this.battle_length/1000) *100)/100;
	
	for (var i = 0; i < this.playersArr.length; i++){
		var player = this.playersArr[i];
		var ts = player.get_statistics(general_stat['tdo']);
		general_stat['total_deaths'] += ts['num_deaths'];
		player_stats.push(ts);
		pokemon_stats.push([]);
		for (var j = 0; j < player.partiesArr.length; j++){
			pokemon_stats[i].push([]);
			for (var k = 0; k < player.partiesArr[j].pokemonArr.length; k++)
				pokemon_stats[i][j].push(player.partiesArr[j].pokemonArr[k].get_statistics());
		}
	}
	pokemon_stats.push(this.dfdr.get_statistics());
	
	return {
		generalStat : general_stat,
		playerStats : player_stats,
		pokemonStats : pokemon_stats,
		battleLog : this.log
	};	
}


/* End of Class <World> */



/* 
 * Strategies.js 
 */

// Brutal force to find out how to maximize damage within a limited time (guaranteed to fit in at least one fmove/cmove)
// and be free afterwards, at the same time satisfies energy rule
// returns the damage, totaltime needd, and a list of 'f'/'c' like ['f','f','c','f'] representing the optimal action
// Note it will returns [-1, -1, []] if there's no solution for negative initial energy
function strategyMaxDmg(T, initE, fDmg, fE, fDur, cDmg, cE, cDur){
	var maxC = Math.floor(T/cDur), maxF = 0, optimalC = 0, optimalF = 0, optimalDamage = -1, optimalTime = -1;

	for (var c = maxC; c >= 0; c--){
		maxF = Math.floor((T - c * cDur)/fDur);
		for (var f = maxF; f >= 0; f--){
			if (initE + f * fE + c * cE < 0)
				break; // Failing the energy requirement
			if (f * fDmg + c * cDmg > optimalDamage){ // Found a better solution
				optimalDamage = f * fDmg + c * cDmg;
				optimalTime = f * fDur + c * cDur;
				optimalF = f;
				optimalC = c;
			}
		}
	}
	// Now form and return a valid sequece of actions
	var solution = [];
	var projE = initE;
	while (optimalC > 0 || optimalF > 0){
		if (projE + cE >= 0 && optimalC > 0){
			solution.push('c');
			projE += cE;
			optimalC--;
		}else{
			solution.push('f');
			projE += fE;
			optimalF--;
		}
	}
	return [optimalDamage, optimalTime, solution];
}



// Player strategy
// These functions should return a list of planned actions
// like ['f', 'c', 100, 'd'] <- means use a FMove, then a Cmove, then wait for 100s and finally dodge

// 0. No dodging
function atkr_choose_0(state){
	if (this.energy + this.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}

// 1. Agressive dodge charged
function atkr_choose_1(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projected_atkrHurtEvent;
	var weather = state.weather;
	var dodge_bug = state.dodge_bug;
	
	if (t < hurtEvent.t && hurtEvent.move.moveType == 'c' && !this.has_dodged_next_attack){
		this.has_dodged_next_attack = true;
		
		var timeTillHurt = hurtEvent.t - t;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = dodge_bug ? undodgedDmg : Math.floor(undodgedDmg * (1 - BATTLE_SETTINGS.dodgeDamageReductionPercent));
		var fDmg = damage(this, dfdr, this.fmove, weather);
		var cDmg = damage(this, dfdr, this.cmove, weather);

		// Goal: Maximize damage before time runs out
		if (this.HP > dodgedDmg){
			// (a) if this Pokemon can survive the dodged damage, then it's better to dodge
			var res = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + BATTLE_SETTINGS.chargedMoveLagMs);
			return res[2].concat([Math.max(timeTillHurt - BATTLE_SETTINGS.dodgeWindowMs - res[1], 0), 'd']);
		} else{
			// (b) otherwise, just don't bother to dodge, and YOLO!
			// Compare two strategies: a FMove at the end (resF) or a CMove at the end (resC) by exploiting DWS
			var resF = strategyMaxDmg(timeTillHurt - this.fmove.dws - BATTLE_SETTINGS.fastMoveLagMs, this.energy, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + BATTLE_SETTINGS.chargedMoveLagMs);
			var resC = strategyMaxDmg(timeTillHurt - this.cmove.dws - BATTLE_SETTINGS.chargedMoveLagMs, this.energy + this.cmove.energyDelta, fDmg, this.fmove.energyDelta, 
									this.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + BATTLE_SETTINGS.chargedMoveLagMs);
			if (resC[0] + cDmg > resF[0] + fDmg && resC[1] >= 0){ 
				// Use a cmove at the end is better, on the condition that it obeys the energy rule
				return resC[2].concat('c');
			}else{
				return resF[2].concat('f');
			}
		}
	}
	
	if (this.energy + this.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
	}
}

// 2. Conservative dodge all
function atkr_choose_2(state){
	var t = state.t;
	var dfdr = state.dfdr;
	var hurtEvent = state.projected_atkrHurtEvent;
	var weather = state.weather;
	var dodge_bug = state.dodge_bug;
	
	var fDmg = damage(this, dfdr, this.fmove, weather);
	var cDmg = damage(this, dfdr, this.cmove, weather);
	
	if (t < hurtEvent.t && !this.has_dodged_next_attack){ // Case 1: A new attack has been announced and has not been dodged
		this.has_dodged_next_attack = true; // prevent double dodging
		var timeTillHurt = hurtEvent.t - t - BATTLE_SETTINGS.dodgeSwipeMs;
		var undodgedDmg = damage(hurtEvent.object, this, hurtEvent.move, weather);
		var dodgedDmg = dodge_bug ? undodgedDmg : Math.floor(undodgedDmg * (1 - BATTLE_SETTINGS.dodgeDamageReductionPercent));
		var opt_strat = strategyMaxDmg(timeTillHurt, this.energy, fDmg, this.fmove.energyDelta, 
					this.fmove.duration + BATTLE_SETTINGS.fastMoveLagMs, cDmg, this.cmove.energyDelta, this.cmove.duration + BATTLE_SETTINGS.chargedMoveLagMs);
		var res = opt_strat[2];
		if (hurtEvent.move.moveType == 'f') { // Case 1a: A fast move has been announced
			if (this.HP > dodgedDmg){ // Only dodge when necessary
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - BATTLE_SETTINGS.dodgeWindowMs + BATTLE_SETTINGS.dodgeSwipeMs)); // wait until dodge window open
				res.push('d');
			}
		}else{ // Case 1b: A charge move has been announced
			if (this.HP > dodgedDmg){
				res.push(Math.max(0, timeTillHurt - opt_strat[1] - BATTLE_SETTINGS.dodgeWindowMs + BATTLE_SETTINGS.dodgeSwipeMs)); // wait until dodge window open
				res.push('d');
				res.push('c'); // attempt to use cmove
			}
		}
		return res;
	}else{ // Case 2: No new attack has been announced or has dodged the incoming attack
		var res = [];
		if (t > hurtEvent.t){ // just after dodging the current attack
			var timeTillHurt = hurtEvent.t - t - BATTLE_SETTINGS.dodgeSwipeMs + (hurtEvent.move.duration - hurtEvent.move.dws) + 1500 + dfdr.fmove.dws;
			if (this.energy + this.cmove.energyDelta >= 0 && this.cmove.duration < timeTillHurt)
				res.push('c');
			else
				res.push('f');
		}
		if (res.length == 0){ //just wait
			res.push(200);
		}
		return res;
	}
}