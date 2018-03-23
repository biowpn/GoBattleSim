/*
 *	PART I(a): MANUALLY DEFINED VARIABLES
 */

var POKEMON_MAX_ENERGY = 100;
var STAB_MULTIPLIER = 1.2;
var WAB_MULTIPLIER = 1.2;

var DODGE_COOLDOWN_MS = 500;
var DODGEWINDOW_LENGTH_MS = 700;
var DODGED_DAMAGE_REDUCTION_PERCENT = 0.75;
var ARENA_ENTRY_LAG_MS = 3000;
var ARENA_EARLY_TERMINATION_MS = 3000;
var FAST_MOVE_LAG_MS = 25;
var CHARGED_MOVE_LAG_MS = 100;
var SWITCHING_DELAY_MS = 750;
var TIMELIMIT_GYM_MS = 100000;
var REJOIN_TIME_MS = 10000;
var ITEM_MENU_TIME_MS = 2000;
var EACH_MAX_REVIVE_TIME_MS = 800;

const MAX_NUM_POKEMON_PER_PARTY = 6;
const MAX_NUM_PARTIES_PER_PLAYER = 5;
const MAX_NUM_OF_PLAYERS = 20;
var TIMELIMIT_RAID_MS = [180000, 180000, 180000, 180000, 300000];

/* 
 *	PART I(b): GAME DATA
 */
 
// Moves and Pokemon stats are populated in "Populate.js"
var FAST_MOVE_DATA = [];
var CHARGED_MOVE_DATA = [];
var POKEMON_SPECIES_DATA = [];

var CPM_TABLE = [0.094, 0.13513743215803847, 0.16639787, 0.19265091454861796, 0.21573247, 0.23657265541932715, 0.25572005, 0.27353037931097973, 0.29024988, 0.30605738000722543, 0.3210876, 0.3354450348019347, 0.34921268, 0.36245775711118555, 0.3752356, 0.3875924191428145, 0.39956728, 0.4111935439951595, 0.4225, 0.4329264087965774, 0.44310755, 0.4530599628689135, 0.4627984, 0.4723360827308573, 0.48168495, 0.49085580932476297, 0.49985844, 0.5087017591555174, 0.51739395, 0.5259424956328841, 0.5343543, 0.5426357508963908, 0.5507927, 0.5588305922386229, 0.5667545, 0.574569134506658, 0.5822789, 0.5898879034974399, 0.5974, 0.6048236602280411, 0.6121573, 0.6194041050661919, 0.6265671, 0.6336491667895227, 0.64065295, 0.6475809587060136, 0.65443563, 0.6612192609753201, 0.667934, 0.6745818887829742, 0.6811649, 0.6876848943474521, 0.69414365, 0.7005428891384746, 0.7068842, 0.713169102419072, 0.7193991, 0.7255756180718899, 0.7317, 0.7347410173422504, 0.7377695, 0.7407855800803546, 0.74378943, 0.7467812039953893, 0.74976104, 0.7527290986842915, 0.7556855, 0.7586303636507689, 0.76156384, 0.7644860688461087, 0.76739717, 0.7702972738840048, 0.7731865, 0.7760649434180147, 0.77893275, 0.7817900775756758, 0.784637, 0.7874735905949481, 0.7903];

var POKEMON_TYPE_ADVANTAGES = {"normal": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.0, "ghost": 0.51, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "fighting": {"normal": 1.4, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 0.51, "steel": 1.4, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.4, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "flying": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "poison": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 0.714, "ground": 0.714, "rock": 0.714, "bug": 1.0, "ghost": 0.714, "steel": 0.51, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "ground": {"normal": 1.0, "fighting": 1.0, "flying": 0.51, "poison": 1.4, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 1.4, "fire": 1.4, "water": 1.0, "grass": 0.714, "electric": 1.4, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "rock": {"normal": 1.0, "fighting": 0.714, "flying": 1.4, "poison": 1.0, "ground": 0.714, "rock": 1.0, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.4, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "bug": {"normal": 1.0, "fighting": 0.714, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 0.714, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "ghost": {"normal": 0.51, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 1.0}, "steel": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.0, "electric": 0.714, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "fire": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 1.4, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "water": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.4, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.4, "water": 0.714, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "grass": {"normal": 1.0, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.4, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.4, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "electric": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 0.51, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.0, "water": 1.4, "grass": 0.714, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "psychic": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.4, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.0, "dragon": 1.0, "dark": 0.51, "fairy": 1.0}, "ice": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 1.4, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 0.714, "dragon": 1.4, "dark": 1.0, "fairy": 1.0}, "dragon": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.0, "fairy": 0.51}, "dark": {"normal": 1.0, "fighting": 0.714, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 0.714}, "fairy": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.4, "fairy": 1.0}};

var WEATHER_BOOSTED_TYPES = {"SUNNY_CLEAR": ["grass", "ground", "fire"], "RAIN": ["water", "electric", "bug"], "PARTLY_CLOUDY": ["normal", "rock"], "CLOUDY": ["fairy", "fighting", "poison"], "WINDY": ["dragon", "flying", "psychic"], "SNOW": ["ice", "steel"], "FOG": ["dark", "ghost"], "EXTREME": []};

var WEATHER_LIST = ["SUNNY_CLEAR", "RAIN", "PARTLY_CLOUDY", "CLOUDY", "WINDY", "SNOW", "FOG", "EXTREME"];

var RAID_BOSS_CPM = [0.61, 0.67, 0.7300000190734863, 0.7900000214576721, 0.7900000214576721];

var RAID_BOSS_HP = [600, 1800, 3000, 7500, 12500];


/*
 *	PART II: GLOBAL FUNCTIONS
 */

function damage(dmg_giver, dmg_taker, move, weather){
	var stab = 1;
	if (move.pokeType == dmg_giver.pokeType1 || move.pokeType == dmg_giver.pokeType2){
		stab = STAB_MULTIPLIER;
	}
	var wab = 1;
	if (WEATHER_BOOSTED_TYPES[weather].includes(move.pokeType)){
		wab = WAB_MULTIPLIER;
	}
	var effe1 = POKEMON_TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType1] || 1;
	var effe2 = POKEMON_TYPE_ADVANTAGES[move.pokeType][dmg_taker.pokeType2] || 1;
	return Math.ceil(0.5*dmg_giver.Atk/dmg_taker.Def*move.power*effe1*effe2*stab*wab);
}

function calculateCP(pkm){
	return Math.max(10, Math.round((pkm.baseAtk+pkm.atkiv)*Math.sqrt((pkm.baseDef+pkm.defiv)*(pkm.baseStm+pkm.stmiv))*pkm.cpm*pkm.cpm/10));
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

function get_species_index_by_name(name) {
	name = name.toLowerCase();
	for (var i = 0; i < POKEMON_SPECIES_DATA.length; i++){
		if (name == POKEMON_SPECIES_DATA[i].name)
			return i;
	}
	return -1;
}
 
function get_fmove_index_by_name(name){
	name = name.toLowerCase();
	for (var i = 0; i < FAST_MOVE_DATA.length; i++){
		if (name == FAST_MOVE_DATA[i].name)
			return i;
	}
	return -1;
}
 
function get_cmove_index_by_name(name){
	name = name.toLowerCase();
	for (var i = 0; i < CHARGED_MOVE_DATA.length; i++){
		if (name == CHARGED_MOVE_DATA[i].name)
			return i;
	}
	return -1;
}
 


/*
 *	PART III: CLASSES
 */


/* Class <Pokemon> and <PokemonSpecies> */
// constructor
function Pokemon(cfg){
	this.index = (cfg.index >= 0) ? cfg.index : get_species_index_by_name(cfg.species);
	for (var attr in POKEMON_SPECIES_DATA[this.index]){
		this[attr] = POKEMON_SPECIES_DATA[this.index][attr];
	}
	
	this.playerCode = cfg.player_code;
	this.nickname = cfg.nickname;
	this.atkiv = parseInt(cfg.atkiv);
	this.defiv = parseInt(cfg.defiv);
	this.stmiv = parseInt(cfg.stmiv);
	this.cpm = CPM_TABLE[Math.round(2* parseInt(cfg.level) - 2)];
	
	var fmoveIndex = (cfg.fmove_index >= 0) ? cfg.fmove_index : get_fmove_index_by_name(cfg.fmove);
	var cmoveIndex = (cfg.cmove_index >= 0) ? cfg.cmove_index : get_cmove_index_by_name(cfg.cmove);
	this.fmove = FAST_MOVE_DATA[fmoveIndex];
	this.fmove.index = fmoveIndex;
	this.cmove = CHARGED_MOVE_DATA[cmoveIndex];
	this.cmove.index = cmoveIndex;
	
	this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
	this.Def = (this.baseDef + this.defiv) * this.cpm;
	this.Stm = (this.baseStm + this.stmiv) * this.cpm;
	this.raidTier = cfg.raid_tier;
	if (this.raidTier < 0) { // gym defender
		this.maxHP = 2 * Math.floor(this.Stm);
		this.playerCode = -1;
	} else if (this.raidTier == 0){ // attacker
		this.maxHP = Math.floor(this.Stm);
	} else {// raid boss
		this.cpm = RAID_BOSS_CPM[this.raidTier - 1];
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = RAID_BOSS_HP[this.raidTier - 1];
		this.playerCode = -1;
	}
	this.dodgeStrat = parseInt(cfg.dodge) || 0;
	this.has_dodged_next_attack = false;
	this.active = false;
	this.immortal = false;
	this.index_party = cfg.index_party;
	
	// Some statistics for performance analysis
	this.time_enter_ms = 0;
	this.time_leave_ms = 0;
	this.total_time_active_ms = 0;
	this.num_deaths = 0;
	this.tdo = 0;
	this.tdo_fmove = 0;
	this.total_energy_gained = 0;
	this.total_energy_gained_from_damage = 0;
	this.total_energy_wasted = 0;
	
	this.heal();
}

Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
}

// A Pokemon gains/(loses) energy
Pokemon.prototype.gain_energy = function(energyDelta, fromDamage){
	if (energyDelta > 0){
		var overChargedPart = Math.max(0, this.energy + energyDelta - POKEMON_MAX_ENERGY);
		var realGain = energyDelta - overChargedPart;
		this.energy += realGain;
		this.total_energy_gained += realGain;
		this.total_energy_wasted += overChargedPart;
		if (fromDamage){
			this.total_energy_gained_from_damage += realGain;
			if (this.HP <= 0)
				this.total_energy_wasted += this.energy;
		}
	}else{
		this.energy += energyDelta;
	}
}

// A Pokemon takes damage and gains energy = dmg/2
Pokemon.prototype.take_damage = function(dmg){
	this.HP -= dmg;
	var overKilledPart = 0;
	if (this.HP <= 0 && !this.immortal){
		this.num_deaths++;
		this.active = false;
		overKilledPart = -this.HP;
	}
	this.gain_energy(Math.ceil((dmg - overKilledPart)/2), true);
}

// Keeping record of tdo for performance analysis
Pokemon.prototype.attribute_damage = function(dmg, mType){
	this.tdo += dmg;
	if (mType == 'f'){
		this.tdo_fmove += dmg;
	}
}


// Return the performance statistics of the Pokemon
Pokemon.prototype.get_statistics = function(){
	var stat = {
		player_code: this.playerCode,
		index : this.index,
		name : this.name,
		hp : this.HP,
		energy : this.energy,
		tdo: this.tdo,
		tdo_fmove : this.tdo_fmove,
		duration : Math.round(this.total_time_active_ms/100)/10,
		dps : Math.round(this.tdo / (this.total_time_active_ms/1000)*100)/100,
		tew : this.total_energy_wasted
	};
	return stat;
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
		if (this.pokemonArr[i].HP <= 0){
			this.pokemonArr[i].heal();
		}
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
		timeBeforeActive = SWITCHING_DELAY_MS;
	}else{ // Current party all faint. Need to rejoin
		timeBeforeActive = REJOIN_TIME_MS;
		if (current_party.revive_strategy == true){ // Revive currently party
			current_party.heal();
			this.active_pkm = current_party.active_pkm;
			timeBeforeActive += ITEM_MENU_TIME_MS +  current_party.pokemonArr.length * EACH_MAX_REVIVE_TIME_MS;
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


/* End of Class <Event> */


/* Class <Event> */
// constructor
function Event(name, t, subject, object, move, dmg, energyDelta){
	this.name = name;
	this.t = t;
	this.subject = subject;
	this.object = object;
	this.move = move;
	this.dmg = dmg;
	this.energyDelta = energyDelta;
	this.dodged = false;
}
/* End of Class <Event> */



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
	this.raid_tier = cfg['generalSettings']['raidTier'];
	if (this.raid_tier == -1)
		this.timelimit_ms = TIMELIMIT_GYM_MS;
	else
		this.timelimit_ms = TIMELIMIT_RAID_MS[this.raid_tier - 1];
	this.weather = cfg['generalSettings']['weather'] || "EXTREME";
	this.log_style = cfg['generalSettings']['logStyle'] || 0;
	this.random_seed = cfg['generalSettings']['randomSeed'] || 0;
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
	
	this.tline = new Timeline();
	this.any_player_active_bool = true;
	this.any_attacker_fainted_bool = false;
	this.projected_atkrHurtEvent = null;
	this.battle_length = 0;
	this.log = [];

}

// Player's Pokemon uses a move
World.prototype.atkr_use_move = function(pkm, pkm_hurt, move, t){
	t += move.moveType == 'f' ? FAST_MOVE_LAG_MS : CHARGED_MOVE_LAG_MS;
	var dmg = damage(pkm, pkm_hurt, move, this.weather);
	this.tline.enqueue(new Event("Hurt", t + move.dws, pkm_hurt, pkm, move, dmg, 0));
	this.tline.enqueue(new Event("EnergyDelta", t + move.dws, pkm, 0, 0, 0, move.energyDelta));
}

// Gym Defender/Raid Boss uses a move, hurting all active attackers
World.prototype.dfdr_use_move = function(pkm, move, t){
	for (var i = 0; i < this.playersArr.length; i++){
		var pkm_hurt = this.playersArr[i].active_pkm;
		if (pkm_hurt && pkm_hurt.active){
			var dmg = damage(pkm, pkm_hurt, move, this.weather);
			this.tline.enqueue(new Event("Hurt", t + move.dws, pkm_hurt, pkm, move, dmg, 0));
		}
	}
	this.projected_atkrHurtEvent = new Event("Hurt", t + move.dws, 0, pkm, move, 0, 0);
	this.tline.enqueue(new Event("EnergyDelta", t + move.dws, pkm, 0, 0, 0, move.energyDelta));
	this.tline.enqueue(new Event("ResetProjectedAtkrHurt", t + move.dws, 0, 0, 0, 0, 0));
}

// Enqueue events to timeline according from a list of actions
// And ask for the next action when the attacker is free again
World.prototype.enqueueActions = function(pkm, pkm_hurt, t, actions){
	var tFree = t;
	for (var i = 0; i < actions.length; i++){
		if (actions[i] == 'f'){ // Use fast move
			this.tline.enqueue(new Event("Announce", tFree, pkm, pkm_hurt, pkm.fmove, 0, 0));
			tFree += pkm.fmove.duration + FAST_MOVE_LAG_MS;
		} else if (actions[i] == 'c'){ // Use charge move
			this.tline.enqueue(new Event("Announce", tFree, pkm, pkm_hurt, pkm.cmove, 0, 0));
			tFree += pkm.cmove.duration + CHARGED_MOVE_LAG_MS;
		} else if (actions[i] == 'd'){ // dodge
			this.tline.enqueue(new Event("Dodge", tFree, pkm, 0, 0, 0, 0));
			tFree += DODGE_COOLDOWN_MS;
		} else // wait
			tFree += actions[i];
	}
	this.tline.enqueue(new Event("AtkrFree", tFree, pkm, 0, 0, 0, 0));
}

// Finds and returns the next Hurt event of a specified Pokemon
World.prototype.nextHurtEventOf = function(pkm){
	for (var i = 0; i < this.tline.list.length; i++){
		var thisEvent = this.tline.list[i];
		if (thisEvent.name == "Hurt" && thisEvent.subject.playerCode == pkm.playerCode && thisEvent.subject.index_party == pkm.index_party)
			return thisEvent;
	}
}

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
// This function should return a list of planned actions
// like ['f', 'c', 100, 'd'] <- means use a FMove, then a Cmove, then wait for 100s and finally dodge
World.prototype.atkr_choose = function (pkm, t){
	var dfdr = this.dfdr;
	
	if (pkm.dodgeStrat > 0){
		// The optimal dodging should be: 
		// - Minimize waiting (waiting should always be avoided)
		// - Maximize time left before dodging (dodge as late as possible)
		// - Maximize damage done before dodging
		var hurtEvent = this.projected_atkrHurtEvent;
		if (hurtEvent && (hurtEvent.move.moveType == 'c' || pkm.dodgeStrat >= 2) && !pkm.has_dodged_next_attack){
			pkm.has_dodged_next_attack = true;
			
			var timeTillHurt = hurtEvent.t - t;
			var undodgedDmg = damage(hurtEvent.object, pkm, hurtEvent.move, this.weather);
			var dodgedDmg = Math.floor(undodgedDmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT));
			if (this.dodge_bug == 1 && this.playersArr.length >= 2){
				dodgedDmg = undodgedDmg;
			}
			var fDmg = damage(pkm, dfdr, pkm.fmove, this.weather);
			var cDmg = damage(pkm, dfdr, pkm.cmove, this.weather);

			// Goal: Maximize damage before time runs out
			if (pkm.HP > dodgedDmg){
				// (a) if this Pokemon can survive the dodged damage, then it's better to dodge
				var res = strategyMaxDmg(timeTillHurt, pkm.energy, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration + FAST_MOVE_LAG_MS, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration + CHARGED_MOVE_LAG_MS);
				return res[2].concat([Math.max(timeTillHurt - DODGEWINDOW_LENGTH_MS - res[1], 0), 'd']);
			} else{
				// (b) otherwise, just don't bother to dodge, and YOLO!
				// Compare two strategies: a FMove at the end (resF) or a CMove at the end (resC) by exploiting DWS
				var resF = strategyMaxDmg(timeTillHurt - pkm.fmove.dws - FAST_MOVE_LAG_MS, pkm.energy, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration + FAST_MOVE_LAG_MS, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration + CHARGED_MOVE_LAG_MS);
				var resC = strategyMaxDmg(timeTillHurt - pkm.cmove.dws - CHARGED_MOVE_LAG_MS, pkm.energy + pkm.cmove.energyDelta, fDmg, pkm.fmove.energyDelta, 
										pkm.fmove.duration + FAST_MOVE_LAG_MS, cDmg, pkm.cmove.energyDelta, pkm.cmove.duration + CHARGED_MOVE_LAG_MS);
				if (resC[0] + cDmg > resF[0] + fDmg && resC[1] >= 0){ 
					// Use a cmove at the end is better, on the condition that it obeys the energy rule
					return resC[2].concat('c');
				}else{
					return resF[2].concat('f');
				}
			}
		}
	}
	// No dodging or no need to dodge
	if (pkm.energy + pkm.cmove.energyDelta >= 0){
		return ['c'];
	}else{
		return ['f'];
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
	
	this.tline.enqueue(new Event("DfdrFree", next_t, pkm, 0, next_move, 0, 0));
	this.tline.enqueue(new Event("Announce", next_t, pkm, 0, next_move, 0, 0));
	this.tline.enqueue(new Event("DodgeCue", next_t + next_move.dws - DODGEWINDOW_LENGTH_MS, pkm, 0, next_move, 0, 0));
}


// Gym Defender or Raid Boss moves at the start of a battle
World.prototype.initial_dfdr_choose = function (dfdr, t){
	this.dfdr_use_move(dfdr, dfdr.fmove, t + 1000);
	this.dfdr_use_move(dfdr, dfdr.fmove, t + 2000);
	this.tline.enqueue(new Event("DfdrFree", t + 2000, dfdr, 0, dfdr.fmove, 0, 0));
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
	var t = ARENA_ENTRY_LAG_MS;
	var elog = [];
	var dfdr = this.dfdr;
	
	for (var i = 0; i < this.playersArr.length; i++){
		var atkr = this.playersArr[i].active_pkm;
		if (atkr)
			atkr.active = true;
		this.tline.enqueue(new Event("Enter", t, atkr, 0, 0, 0, 0));
	}
	
	this.tline.enqueue(new Event("Enter", t, dfdr, 0, 0, 0, 0));
	this.initial_dfdr_choose(dfdr, t);
	dfdr.active = true;

	while (dfdr.active && this.any_player_active_bool){
		var e = this.tline.list.shift();
		t = e.t;
		if (t >= this.timelimit_ms - ARENA_EARLY_TERMINATION_MS && !this.immortal_defender)
			break;
		
		// 1. First process the event
		if (e.name == "AtkrFree"){
			var actions = this.atkr_choose(e.subject, t);
			this.enqueueActions(e.subject, dfdr, t, actions);
		}else if (e.name == "DfdrFree"){
			this.dfdr_choose(e.subject, t, e.move);
		}else if (e.name == "Hurt"){
			if (e.subject.active && e.object.active){
				e.subject.take_damage(e.dmg);
				e.subject.has_dodged_next_attack = false;
				if (e.subject.HP <= 0 && e.subject.raidTier == 0)
					this.any_attacker_fainted_bool = true;
				e.object.attribute_damage(e.dmg, e.move.moveType);
				elog.push(e);
			}
		}else if (e.name == "EnergyDelta"){
			e.subject.gain_energy(e.energyDelta, false);
		}else if (e.name == "Enter"){
			e.subject.time_enter_ms = t;
			e.subject.active = true;
			if (e.subject.raidTier == 0) // Atkr
				this.tline.enqueue(new Event("AtkrFree", t + 100, e.subject, 0,0,0,0));
			elog.push(e);
		}else if (e.name == "Dodge"){
			var eHurt = this.nextHurtEventOf(e.subject);
			if (eHurt && !e.dodged && (eHurt.t - DODGEWINDOW_LENGTH_MS) <= t && t <= eHurt.t){
				eHurt.dmg = Math.max(1, Math.floor(eHurt.dmg * (1 - DODGED_DAMAGE_REDUCTION_PERCENT)));
				e.dodged = true;
			}
			elog.push(e);
		}else if (e.name == "Announce"){
			if (e.subject.raidTier == 0) // Atkr
				this.atkr_use_move(e.subject, e.object, e.move, t);
			else if (!this.projected_atkrHurtEvent)
				this.dfdr_use_move(e.subject, e.move, t);
		}else if (e.name == "DodgeCue") {
			if (!this.projected_atkrHurtEvent)
				this.dfdr_use_move(e.subject, e.move, t - e.move.dws + DODGEWINDOW_LENGTH_MS);
		}else if (e.name == "ResetProjectedAtkrHurt")
			this.projected_atkrHurtEvent = null;
		
		// 2. Check if some attacker fainted
		if (this.any_attacker_fainted_bool){
			for (var i = 0; i < this.playersArr.length; i++){
				var this_player = this.playersArr[i], old_pkm = this.playersArr[i].active_pkm;
				if (old_pkm && old_pkm.HP <= 0){
					for (var j = 0; j < this.tline.list.length; j++){
						var thisEvent =  this.tline.list[j];
						if (thisEvent.name == "AtkrFree" && thisEvent.subject.playerCode == old_pkm.playerCode && thisEvent.subject.index_party == old_pkm.index_party)
							this.tline.list.splice(j--, 1);
					}
					old_pkm.time_leave_ms = t;
					old_pkm.total_time_active_ms += t - old_pkm.time_enter_ms;
					var delay = this_player.next_pokemon_up(); // Ask for sending another attacker
					if (this_player.active_pkm)
						this.tline.enqueue(new Event("Enter", t + delay, this_player.active_pkm, 0,0,0,0));
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
	// Correspond to Enter rowData, AtkrHurt rowData, DfdrHurt rowData and AtkrDogde rowData
	var rowData = [[],[],[],[]];
	var nonEmpty = [false, false, false, false];
	var dfdrHurt_totalDmg = 0;
	for (var i = 0; i < 4; i++){
		rowData[i].t = Math.round((events[0]).t/10)/100;
		rowData[i].dfdr = "";
		for (var j = 1; j <= numPlayer; j++)
			rowData[i][j] = "";
	}
	
	for (var i = 0; i < events.length; i++){
		var e = events[i];
		if (e.name == "Enter"){
			nonEmpty[0] = true;
			if (e.subject.playerCode == -1) // dfdr
				rowData[0].dfdr = 'pokemon:' + e.subject.index;
			else
				rowData[0][e.subject.playerCode] = 'pokemon:' + e.subject.index;
		}else if (e.name == "Hurt"){
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
		}else if (e.name == "Dodge"){
			nonEmpty[3] = true;
			rowData[3][e.subject.playerCode] = "dodge";
		}
	}
	if (nonEmpty[2]){
		rowData[2].dfdr += '(-' + dfdrHurt_totalDmg + ')';
	}
	
	for (var i = 0; i < 4; i++){
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