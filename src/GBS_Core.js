/* GBS_Core.js */

/**
	@file The GoBattleSim simulator core.
	@author BIOWP
*/

const MAX_NUM_POKEMON_PER_PARTY = 6;
const MAX_NUM_PARTIES_PER_PLAYER = 5;
const MAX_NUM_OF_PLAYERS = 21;

const EVENT = {
	Free: "Free",
	Damage: "Damage",
	Dodge: "Dodge",
	Enter: "Enter",
	Switch: "Switch",
	Minigame: "Minigame"
};

const ACTION = {
	Fast: "Fast",
	Charged: "Charged",
	Dodge: "Dodge"
};


/**
	The damage formula, calculating how much damage the attack inflicts.
	@param {Pokemon} dmgGiver The Pokemon using the attack.
	@param {Pokemon} dmgReceiver The Pokemon taking the hit.
	@param {Move} move The move being used.
	@param {string} weather The current weather.
	@return {number} The damage value.
*/
function damage(dmgGiver, dmgReceiver, move, weather){
	var stab = 1;	// Same Type Attack Bonus
	if (move.pokeType == dmgGiver.pokeType1 || move.pokeType == dmgGiver.pokeType2){
		stab = Data.BattleSettings.sameTypeAttackBonusMultiplier;
	}
	var wab = 1;	// Weather Attack Bonus
	if (Data.TypeEffectiveness[move.pokeType].boostedIn == weather){
		wab = Data.BattleSettings.weatherAttackBonusMultiplier;
	}
	var fab = dmgGiver.fab || 1;	// Friend Attack Bonus mutiplier
	var mab = dmgGiver[move.moveType + "AttackBonus"] || 1;	// Move Attack Bonus mutiplier (for PvP)
	var effe1 = Data.TypeEffectiveness[move.pokeType][dmgReceiver.pokeType1] || 1;
	var effe2 = Data.TypeEffectiveness[move.pokeType][dmgReceiver.pokeType2] || 1;
	return Math.floor(0.5*dmgGiver.Atk/dmgReceiver.Def*move.power*effe1*effe2*stab*wab*fab*mab) + 1;
}


/**
	The CP formula, calculating the current CP of a Pokemon.
	@param {Object|Pokemon} pkm The Pokemon to calculate CP for. Expected to have Atk, Def and Stm. If not, then must have base stats, IV stats and cpm/level.
	@return {number} The CP value
*/
function calculateCP(pkm){
	var cpm = parseFloat(pkm.cpm);
	if (isNaN(cpm)){
		let levelSetting = getEntry(pkm.level.toString(), Data.LevelSettings, true);
		cpm = levelSetting.cpm;
	}
	var atk = pkm.Atk || (pkm.baseAtk + pkm.atkiv) * cpm;
	var def = pkm.Def || (pkm.baseDef + pkm.defiv) * cpm;
	var stm = pkm.Stm || (pkm.baseStm + pkm.stmiv) * cpm;
	return Math.max(10, Math.floor(atk * Math.sqrt(def * stm)/10));
}

/**
	Find a combination of {level, atkiv, defiv, stmiv} that yields the given CP for a Pokemon.
	@param {Pokemon} pkm The Pokemon to infer level and IVs for. Expected to have baseAtk, baseDef and baseStm.
	@param {number} cp The given CP.
	@return {Object} A set of {level, atkiv, defiv, stmiv} that yields the given CP. If no combination is found, return null.
*/
function inferLevelAndIVs(pkm, cp){
	var minIV = Data.IndividualValues[0].value, maxIV = Data.IndividualValues[Data.IndividualValues.length - 1].value;
	var pkm2 = {baseAtk: pkm.baseAtk, baseDef: pkm.baseDef, baseStm: pkm.baseStm};
	var minLevelIndex = null;
	pkm2.atkiv = pkm2.defiv = pkm2.stmiv = maxIV;
	for (var i = 0; i < Data.LevelSettings.length; i++){
		pkm2.cpm = Data.LevelSettings[i].cpm;
		if (calculateCP(pkm2) <= cp){
			minLevelIndex = i;
		}else{
			break;
		}
	}
	if (minLevelIndex == null)
		return null;
	for (var i = minLevelIndex; i < Data.LevelSettings.length; i++){
		pkm2.level = Data.LevelSettings[i].value;
		pkm2.cpm = Data.LevelSettings[i].cpm;
		for (pkm2.atkiv = minIV; pkm2.atkiv <= maxIV; pkm2.atkiv++){
			for (pkm2.defiv = minIV; pkm2.defiv <= maxIV; pkm2.defiv++){
				for (pkm2.stmiv = minIV; pkm2.stmiv <= maxIV; pkm2.stmiv++){
					if (calculateCP(pkm2) == cp){
						return pkm2;
					}
				}
			}
		}
	}
}



/** 
	@class
	@param {string|Move|Object} cfg Information of the move.
	@param {Object[]} database The database to look up for the move stats. If omitted, will look up all databases
*/
function Move(cfg, database){
	var moveData = null;
	if (typeof cfg == typeof ""){
		var moveName = cfg.toLowerCase();
		if (database){
			moveData = getEntry(moveName, database);
		}else{
			moveData = getEntry(moveName, Data.FastMoves) || getEntry(moveName, Data.ChargedMoves);
		}
	} else {
		moveData = cfg || null;
	}
	if (moveData == null){
		throw Error("Unknown Move: " + cfg);
	}
	leftMerge(this, moveData);
}



/** 
	@class
	@param {Object|Pokemon} cfg Keyword arguments for constructing the Pokemon.
*/
function Pokemon(cfg){
	if (Pokemon.prototype.isPrototypeOf(cfg)){ // Copy Construction
		leftMerge(this, cfg);
		return;
	}
	this.master = cfg.master || null;
	this.party = cfg.party || null;
	this.nickname = cfg.nickname || "";
	this.role = (cfg.role || "a").split("_")[0];
	this.raidTier = cfg.raidTier;
	this.immortal = cfg.immortal || false;
	if (this.role.toUpperCase() == this.role){
		this.immortal = true;
		this.role = this.role.toLowerCase();
	}
	this.fab = cfg.fab || 1;
	this.fastAttackBonus = 1;
	this.chargedAttackBonus = 1;
	this.fastMoveLagMs = (this.role == "a" ? Data.BattleSettings.fastMoveLagMs : 0);
	this.chargedMoveLagMs = (this.role == "a" ? Data.BattleSettings.chargedMoveLagMs : 0);
	this.energyDeltaPerHealthLost = Data.BattleSettings.energyDeltaPerHealthLost;
	
	var speciesData = (typeof cfg.species == typeof {} ? cfg.species : getEntry(cfg.name.toString().toLowerCase(), Data.Pokemon));
	if (speciesData == null){
		throw Error("Unknown Pokemon: " + cfg.name);
	}
	// Initialize basic stats
	this.name = speciesData.name;
	this.icon = cfg.icon || speciesData.icon;
	this.label = cfg.label || speciesData.label;
	this.pokeType1 = speciesData.pokeType1;
	this.pokeType2 = speciesData.pokeType2;
	this.baseAtk = speciesData.baseAtk;
	this.baseDef = speciesData.baseDef;
	this.baseStm = speciesData.baseStm;
	if (cfg.role && cfg.role.includes("_basic")){
		let inferred = inferLevelAndIVs(this, parseInt(cfg.cp));
		if (inferred == null){
			throw Error('No combination of level and IVs are found for ' + this.name);
		}
		cfg.atkiv = this.atkiv = inferred.atkiv;
		cfg.defiv = this.defiv = inferred.defiv;
		cfg.stmiv = this.stmiv = inferred.stmiv;
		cfg.level = this.level = inferred.level;
		this.cpm = inferred.cpm;
	}else{
		this.atkiv = parseInt(cfg.atkiv);
		this.defiv = parseInt(cfg.defiv);
		this.stmiv = parseInt(cfg.stmiv);
		this.level = cfg.level;
		this.cpm = parseFloat(cfg.cpm);
		if (isNaN(this.cpm)){
			if (this.level != undefined){
				let levelSetting = getEntry(this.level.toString(), Data.LevelSettings, true);
				if (levelSetting){
					this.cpm = levelSetting.cpm;
				}
			}
		}
	}
	
	// Initialize Moves
	if (cfg.fmove){
		this.fmove = new Move(cfg.fmove, Data.FastMoves);
	}
	if (cfg.cmove || cfg.cmoves){
		this.cmoves = [];
		if (cfg.cmoves){
			let unique_cmoves = cfg.cmoves.filter(function(item, pos){
				return cfg.cmoves.indexOf(item) == pos;
			});
			for (let cmove of unique_cmoves){
				this.cmoves.push(new Move(cmove, Data.ChargedMoves));
			}
			this.cmove = this.cmoves[0];
		}else{
			this.cmove = new Move(cfg.cmove, Data.ChargedMoves);
			this.cmoves.push(this.cmove);
			if (cfg.cmove2){
				let cmove2 = new Move(cfg.cmove2, Data.ChargedMoves);
				if (cmove2.name != this.cmove.name){
					this.cmoves.push(cmove2);
				}
			}
		}
	}
	
	// Initialize strategies
	this.strategy = new Strategy();
	this.strategy.bind(this);
	this.strategy.setActionStrategy(cfg.strategy);
	this.strategy.setShieldStrategy(cfg.strategy2);
	
	this.init();
}

/** 
	Initialize the Pokemon's battle states. Call this method before a new battle.
*/
Pokemon.prototype.init = function(){
	this.calculateStats();
	
	// Battle state variables
	this.active = false;
	this.damageReductionExpiration = -1;
	this.damageReductionPercent = 0;
	this.queuedAction = null;
	this.projectedRivalActions = new Timeline();
	this.strategy.init();
	
	// Performance metrics. Does not affect battle outcome
	this.activeDurationMs = 0;
	this.numDeaths = 0;
	this.tdo = 0;
	this.tdoFast = 0;
	this.numFastAttacks = 0;
	this.numChargedAttacks = 0;
	
	this.calculateStats();
	this.heal();
}

/** 
	Re-calculate and set the core stats of the Pokemon.
*/
Pokemon.prototype.calculateStats = function(){
	if (this.role == "gd"){ // gym defender
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = 2 * Math.floor(this.Stm);
	}else if (this.role == "rb") { // raid boss
		let raidTierSetting = getEntry(this.raidTier.toString(), Data.RaidTierSettings, true);
		this.cpm = raidTierSetting.cpm;
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		this.maxHP = raidTierSetting.HP;
	}else{ // default, attacker
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = Math.floor(this.Stm);
	}
}

/**
	Check whether the Pokemon is alive (is able to stay in battle).
	@return {boolean} True if its HP > 0 or it's immortal and false otherwise.
*/
Pokemon.prototype.alive = function(){
	return this.HP > 0 || this.immortal;
}

/** 
	Fully heal the Pokemon and set its energy to 0
*/
Pokemon.prototype.heal = function(){
	this.HP = this.maxHP;
	this.energy = 0;
	this.queuedAction = null;
}

/** 
	The Pokemon gains/loses energy.
	@param {number} energyDelta The amount of energy change. Positive value indicates energy gain.
*/
Pokemon.prototype.gainEnergy = function(energyDelta){
	this.energy += energyDelta;
	if (this.energy > Data.BattleSettings.maximumEnergy){
		this.energy = Data.BattleSettings.maximumEnergy;
	}
}

/** 
	The Pokemon takes damage and changes HP.
	@param {number} dmg The amount of HP to lose.
*/
Pokemon.prototype.takeDamage = function(dmg){
	if (this.alive()){
		this.HP -= dmg;
		this.gainEnergy(Math.ceil(dmg * this.energyDeltaPerHealthLost));
	}
	if (!this.alive()){
		this.numDeaths++;
	}
}


/** 
	Decides the primary charged move to use against an opponent.
	@enemy {Pokemon} The opponent.
	@weather {string} The current weather.
*/
Pokemon.prototype.choosePrimaryChargedMove = function(enemy, weather){
	var best_cmove = null;
	var best_dpe = 0;
	for (let cmove of this.cmoves){
		let dpe = damage(this, enemy, cmove, weather) / (-cmove.energyDelta);
		if (dpe > best_dpe){
			best_cmove = cmove;
			best_dpe = dpe;
		}
	}
	this.cmove = best_cmove;
}

/** 
	Increase the Pokemon's TDO to keep track of its battle performance.
	@param {number} dmg The amount of damage attributed to the Pokemon.
	@param {string} moveType The type of the move.
*/
Pokemon.prototype.attributeDamage = function(dmg, moveType){
	this.tdo += dmg;
	if (moveType == 'fast'){
		this.tdoFast += dmg;
	}
}

/** 
	Get the battle performance metrics of the Pokemon.
	@return {Object} Battle performance metrics.
*/
Pokemon.prototype.getStatistics = function(){
	return {
		name: this.name,
		nickname: this.nickname,
		hp: this.HP,
		energy: this.energy,
		tdo: this.tdo,
		tdoFast: this.tdoFast,
		duration: this.activeDurationMs/1000,
		dps: this.tdo / (this.activeDurationMs/1000),
		numFastAttacks: this.numFastAttacks,
		numChargedAttacks: this.numChargedAttacks
	};
}
/* End of Class <Pokemon> */



/** 
	@class
	@param {Object|Party} cfg Keyword arguments for constructing the party.
*/
function Party(cfg){
	if (Party.prototype.isPrototypeOf(cfg)){ // Copy Construction
		leftMerge(this, cfg);
		return;
	}
	this.revive = cfg.revive;
	this.pokemon = [];
	for (let pokemon of cfg.pokemon){
		for (var r = 0; r < (pokemon.copies || 1); r++){
			this.pokemon.push(new Pokemon(pokemon));
		}
	}
	this.headingPokemonIndex = 0;
	this.heal();
}

/** 
	Initialize the party. Call this method before a new battle.
*/
Party.prototype.init = function(){
	for (let pokemon of this.pokemon){
		pokemon.party = this;
		pokemon.init();
	}
	this.headingPokemonIndex = 0;
}

/**
	Get a Pokemon by ID.
	@param {number} id The ID to look up.
	@return {Pokemon} The Pokemon with the matched ID.
*/
Party.prototype.getPokemonById = function(id){
	for (let pokemon of this.pokemon){
		if (pokemon.id == id)
			return pokemon;
	}
	return null;
}

/** 
	Get the heading Pokemon of the party.
	@return {Pokemon} The heading Pokemon.
*/
Party.prototype.getHead = function(){
	return this.pokemon[this.headingPokemonIndex];
}

/** 
	Set the heading Pokemon of the party.
	@param {pokemon} The heading Pokemon.
*/
Party.prototype.setHead = function(pokemon){
	this.setHeadById(pokemon.id);
}

/**
	Set the heading Pokemon to the Pokemon with given ID.
	@param {number} id The ID to look up.
*/
Party.prototype.setHeadById = function(id){
	for (var i = 0; i < this.pokemon.length; i++){
		if (this.pokemon[i].id == id){
			this.headingPokemonIndex = i;
			return;
		}
	}
	throw Error("No Pokemon with id {" + id + "} found in this party");
}

/**
	Set heading Pokemon to the next alive Pokemon in the party.
	@return {boolean} true if there is such Pokemon in the party and false otherwise.
*/
Party.prototype.setHeadToNext = function(){
	for (var i = (this.headingPokemonIndex + 1) % this.pokemon.length; i != this.headingPokemonIndex; i = (i + 1) % this.pokemon.length){
		if (this.pokemon[i].alive()){
			this.headingPokemonIndex = i;
			return true;
		}
	}
	return false;
}

/** 
	Fully heal all Pokemon of the party and set the heading pokemon to the first one.
*/
Party.prototype.heal = function (){
	for (let pokemon of this.pokemon){
		pokemon.heal();
	}
	this.headingPokemonIndex = 0;
}

/** 
	Get the battle performance metrics of the party.
	@return {Object} Battle performance metrics.
*/
Party.prototype.getStatistics = function(){
	let sum_tdo = 0, sum_numDeaths = 0;
	for (let pokemon of this.pokemon){
		sum_tdo += pokemon.tdo;
		sum_numDeaths += pokemon.numDeaths;
	}
	return {
		tdo: sum_tdo,
		numDeaths: sum_numDeaths
	};
}




/**
	@class
	@param {Object|Player} cfg Keyword arguments for constructing the player.
*/
function Player(cfg){
	if (Player.prototype.isPrototypeOf(cfg)){ // Copy Construction
		leftMerge(this, cfg);
		return;
	}
	this.index = cfg.index;
	this.fab = cfg.fab || getFriendMultiplier(cfg.friend);
	this.team = cfg.team;
	this.rivals = [];
	this.parties = [];
	for (let party of cfg.parties){
		this.parties.push(new Party(party));
	}
	for (let party of this.parties){
		for (pokemon of party.pokemon){
			pokemon.master = this;
		}
	}
	this.headingPartyIndex = 0;
}

/** 
	Initialize the player. Call this method before a new battle.
*/
Player.prototype.init = function(){
	for (let party of this.parties){
		party.init();
	}
	this.headingPartyIndex = 0;
	this.protectShieldLeft = 2;
	this.switchingCooldownExpiration = -1;
}

/** 
	Get the heading Pokemon of the player.
	@return {Pokemon} The heading Pokemon.
*/
Player.prototype.getHead = function(){
	let party = this.getHeadParty();
	return party ? party.getHead() : null;
}

/** 
	Set the heading Pokemon of the player.
	@param {Pokemon} pokemon The heading Pokemon.
*/
Player.prototype.setHead = function(pokemon){
	let party = this.getHeadParty();
	if (party){
		party.setHead(pokemon);
	}else{
		throw new Error("Player has no heading party");
	}
}

/**
	Get a Pokemon by ID.
	@param {number} id The ID to look up.
	@return {Pokemon} The Pokemon with the matched ID.
*/
Player.prototype.getPokemonById = function(id){
	for (let party of this.parties){
		var pkm = party.getPokemonById(id);
		if (pkm)
			return pkm;
	}
	return null;
}

/**
	Set the heading Pokemon to the Pokemon with given ID.
	@param {number} id The ID to look up.
*/
Player.prototype.setHeadById = function(id){
	for (let party of this.parties){
		if (party.getPokemonById(id)){
			party.setHeadById(id);
			return;
		}
	}
	throw Error("No Pokemon with id {" + id + "} found in this player");
}


/** 
	Get the heading party of the player.
	@return {Party} The heading party.
*/
Player.prototype.getHeadParty = function(){
	return this.parties[this.headingPartyIndex];
}

/**
	Select the next alive Pokemon of the active party of the player.
	@return {boolean} true if the heading party has next alive Pokemon and false otherwise
*/
Player.prototype.setHeadToNext = function(){
	return this.getHeadParty().setHeadToNext();
}

/**
	Select the next available party.
	@return true if there is next party and false otherwise
*/
Player.prototype.setHeadPartyToNext = function(){
	if (++this.headingPartyIndex < this.parties.length){
		return true;
	}else{
		--this.headingPartyIndex;
		return false;
	}
}

/** 
	Get the battle performance metrics of the player.
	@return {Object} Battle performance metrics.
*/
Player.prototype.getStatistics = function(battleDurationMs){
	let sum_tdo = 0, sum_numDeaths = 0;
	for (let party of this.parties){
		let party_stat = party.getStatistics();
		sum_tdo += party_stat.tdo;
		sum_numDeaths += party_stat.numDeaths;
	}
	return {
		name: "Player " + (this.index + 1),
		tdo: sum_tdo,
		dps: sum_tdo / battleDurationMs,
		numDeaths: sum_numDeaths
	};
}



/**
	@class
	@classdesc A priority queue using 't' as key.
*/
function Timeline(){
	this.list = [];
}

/** 
	Clear all the items.
*/
Timeline.prototype.clear = function(){
	this.list = [];
}

/** 
	Add an item.
	@param {Object} e The item to add.
*/
Timeline.prototype.enqueue = function(e){
	for (var i = this.list.length - 1; i >= 0; i--){
		if (e.t >= this.list[i].t){
			break;
		}
	}
	this.list.splice(i + 1, 0, e);
}

/**
	Remove the item with the smallest key.
	@return {Object} The item with the smallest key.
*/
Timeline.prototype.dequeue = function(){
	return this.list.shift();
}



/**
	@class
	@classdesc Strategy class for choosing action and whether to use Protect Shield.
	@param {Object} kwargs Keyword arguments for initialization.
*/
function Strategy(kwargs){
	this.subject = null;
	this.dodgeAttackTypes = [];
	this.burstAttackStatus = 0; // 0: never burst; -1: burst, inactive;  1: burst, active
	this.numShieldsUsed = 0;
	this.numShieldsAllowed = 0;
	if (kwargs){
		this.setActionStrategy(kwargs.strategy);
		this.setShieldStrategy(kwargs.strategy2);
	}
	this.init();
}

/**
	Bind a Pokemon to the strategy instance.
	@param {Pokemon} pokemon The pokemon to bind.
*/
Strategy.prototype.bind = function(pokemon){
	this.subject = pokemon;	
}

/**
	Initialize the parameters for keeping track of strategy.
*/
Strategy.prototype.init = function(){
	this.numShieldsUsed = 0;
	if (this.burstAttackStatus == 1){
		this.burstAttackStatus = -1;
	}
}

/**
	Set the action strategy.
	@param {String} str A string representing the strategy.
*/
Strategy.prototype.setActionStrategy = function(str){
	if (str == "strat0"){
		this.getActionDecision = this.actionStrategyDefender;
	}else if (str == "strat1"){
		this.getActionDecision = this.actionStrategyNoDodge;
	}else if (str == "strat2"){
		this.dodgeAttackTypes = [ACTION.Charged];
		this.getActionDecision = this.actionStrategyDodge;
	}else if (str == "strat3"){
		this.dodgeAttackTypes = [ACTION.Fast, ACTION.Charged];
		this.getActionDecision = this.actionStrategyDodge;
	}else if (str == "strat4"){
		this.burstAttackStatus = -1;
		this.getActionDecision = this.actionStrategyNoDodge;
	}else if (str == "strat5"){
		this.getActionDecision = this.actionStrategyPvP;
	}
}

/**
	Get the action decision.
	This function is meant to be an interface only. To be overrided later.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {Object} An action object.
*/
Strategy.prototype.getActionDecision = function(kwargs){
	return {name: ACTION.Fast, delay: 0};
}

/**
	Get the burst charge attack decision.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {Boolean} True for using a charge right away, false for holding it (and burst later).
*/
Strategy.prototype.getBurstDecision = function(kwargs){
	if (this.burstAttackStatus == 0){
		return true;
	} else if (this.burstAttackStatus == 1){
		if (this.projectedEnergy + this.subject.cmove.energyDelta * 2 < 0){
			this.burstAttackStatus = -1;
		}
		return true;
	} else { // this.burstAttackStatus == -1
		if (this.projectedEnergy >= Data.BattleSettings.maximumEnergy){
			this.burstAttackStatus = 1;
			return true;
		} else if (this.subject.master.rivals[0].getHead().energy >= Data.BattleSettings.maximumEnergy) {
			this.burstAttackStatus = 1;
			return true;
		} else {
			return false;
		}
	}
}

/**
	Set the shield strategy.
	@param {String} str A string representing the strategy.
*/
Strategy.prototype.setShieldStrategy = function(str){
	str = str || "";
	if (str.includes(',')){
		this.numShieldsAllowed = str.split('0').length;
	} else {
		this.numShieldsAllowed = parseInt(str) || 0;
	}
}

/**
	Get the shield decision.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {Boolean} True for deciding to use shield and false otherwise.
*/
Strategy.prototype.getShieldDecision = function(kwargs){
	if (this.numShieldsUsed < this.numShieldsAllowed){
		++this.numShieldsUsed;
		return true;
	} else {
		return false;
	}
}

/**
	Get the projected when this action is to be executed.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {number} The projected energy.
*/
Strategy.prototype.getProjectedEnergy = function(kwargs){
	var projectedEnergy = this.subject.energy;
	if (kwargs.currentAction){
		if (kwargs.currentAction.name == ACTION.Fast){
			projectedEnergy += this.subject.fmove.energyDelta;
		}else if (kwargs.currentAction.name == ACTION.Charged){
			projectedEnergy += this.subject.cmove.energyDelta;
		}
	}
	return projectedEnergy;
}

/**
	Defender AI strategy.
*/
Strategy.prototype.actionStrategyDefender = function(kwargs){
	let actionName, delay;
	let numFastAttacks = this.subject.numFastAttacks + (kwargs.currentAction ? 1 : 0);
	if (numFastAttacks >= 2){
		let projectedEnergy = this.getProjectedEnergy(kwargs);
		if (projectedEnergy + this.subject.cmove.energyDelta >= 0 && Math.random() <= 0.5){
			actionName = ACTION.Charged;
		}else{
			actionName = ACTION.Fast;
		}
		delay = 1500 + round(1000 * Math.random()); // Add the standard defender delay
	}else if (numFastAttacks == 1){ // The second action
		actionName = ACTION.Fast;
		delay = Math.max(0, 1000 - this.subject.fmove.duration);
	}else{ // The first action
		actionName = ACTION.Fast;
		delay = 500;
	}
	return {
		name: actionName,
		delay: delay
	};
}

/**
	Attacker strategy: No dodge
*/
Strategy.prototype.actionStrategyNoDodge = function(kwargs){
	let projectedEnergy = this.getProjectedEnergy(kwargs);
	if (projectedEnergy + this.subject.cmove.energyDelta >= 0 && this.getBurstDecision(kwargs)){
		return {name: ACTION.Charged, delay: 0};
	}else{
		return {name: ACTION.Fast, delay: 0};
	}
}

/**
	Attacker strategy: Dodge
*/
Strategy.prototype.actionStrategyDodge = function(kwargs){
	if (kwargs.t < kwargs.tFree){
		return;
	}
	let rivalAttackAction = this.subject.projectedRivalActions.dequeue();
	while (rivalAttackAction){
		if (this.dodgeAttackTypes.includes(rivalAttackAction.name))
			break;
		rivalAttackAction = this.subject.projectedRivalActions.dequeue();
	}
	if (!rivalAttackAction){
		return this.actionStrategyNoDodge(kwargs);
	}
	var enemy_move = (rivalAttackAction.name == ACTION.Fast ? rivalAttackAction.from.fmove : rivalAttackAction.from.cmove);
	var hurtTime = rivalAttackAction.t + enemy_move.dws;
	if (this.damageReductionExpiration >= hurtTime){
		return this.actionStrategyNoDodge(kwargs);
	}
	let dmg = damage(rivalAttackAction.from, this.subject, enemy_move, kwargs.weather)
	let dodgedDmg = kwargs.dodgeBugActive ? dmg : Math.max(1, Math.floor(dmg * (1 - Data.BattleSettings.dodgeDamageReductionPercent)));
	if (dodgedDmg >= this.subject.HP){
		return this.actionStrategyNoDodge(kwargs);
	}
	let timeTillHurt = hurtTime - kwargs.tFree;
	if (this.subject.energy + this.subject.cmove.energyDelta >= 0 && timeTillHurt > this.subject.cmove.duration + this.subject.chargedMoveLagMs){
		// Fit in another charge move
		this.subject.projectedRivalActions.enqueue(rivalAttackAction); // Put the broadcasted action for next decision making
		return {name: ACTION.Charged, delay: 0};
	}else if (timeTillHurt > this.subject.fmove.duration + this.subject.fastMoveLagMs){
		// Fit in another fast move
		this.subject.projectedRivalActions.enqueue(rivalAttackAction); // Put the broadcasted action for next decision making
		return {name: ACTION.Fast, delay: 0};
	}else if (timeTillHurt >= 0){
		// Has time to dodge, and delay a little bit to wait for damage window if necessary
		return {
			name: ACTION.Dodge,
			delay: Math.max(0, timeTillHurt - Data.BattleSettings.dodgeWindowMs + 1)
		};
	}else {
		return this.actionStrategyNoDodge(kwargs);
	}
}

/**
	Attacker strategy: PvP
	1. The primary charge move is the move with the highest DPE
	2. If a charge move can kill the opponent right away, use it
*/
Strategy.prototype.actionStrategyPvP = function(kwargs){
	let projectedEnergy = this.getProjectedEnergy(kwargs);
	for (let move of this.subject.cmoves){
		if (projectedEnergy + move.energyDelta >= 0){
			if (move.name == this.subject.cmove.name){ // Primary move
				return {name: ACTION.Charged, delay: 0};
			} else { // Secondary move
				let enemy = this.subject.master.rivals[0].getHead();
				if (damage(this.subject, enemy, move) >= enemy.HP){
					this.subject.cmove = move;
					return {name: ACTION.Charged, delay: 0};
				}
			}
		}
	}
	return {name: ACTION.Fast, delay: 0};
}



/**
	@class
	@classdesc The highest-level class, where the battle takes place.
	@param {Object} cfg The structured simulation input.
*/
function World(cfg){
	// Configure general parameters
	this.battleMode = cfg.battleMode;	
	this.timelimitOriginal = parseInt(cfg.timelimit);
	if (!this.timelimitOriginal > 0){
		this.timelimitOriginal = -1;
	}
	this.timelimit = this.timelimitOriginal;
	this.weather = cfg.weather || "EXTREME";
	this.hasLog = cfg.hasLog || cfg.aggregation == "enum";
	this.dodgeBugActive = parseInt(cfg.dodgeBugActive) || false;
	
	// Configure players
	this.players = [];
	for (let player of cfg.players){
		this.players.push(new Player(player));
	}
	// Configure matchups
	for (let player of this.players){
		for (let player2 of this.players){
			if (player2.team != player.team){ // If you are not in my team, then you are my enemy!
				player.rivals.push(player2);
			}
		}
	}
	// Give each player an index for battle log usage
	// Give each Pokemon a unique ID for later comparison purpose
	let pokemon_id = 0, player_index = 0;
	for (player of this.players){
		player.index = player_index++;
		for (party of player.parties){
			for (pokemon of party.pokemon){
				pokemon.id = pokemon_id++;
				pokemon.fab = player.fab;
			}
		}
	}
	// Nullify revive strategy if unlimited time
	if (this.timelimit < 0){
		for (let player of this.players){
			if (player.team == "0"){
				for (let party of player.parties){
					party.revive = false;
				}
			}
		}
	}
	if (this.battleMode == "pvp"){
		this.overridePvP();
	}
	
	this.init();
}

/** 
	Override certain methods for PvP.
*/
World.prototype.overridePvP = function(){
	for (player of this.players){
		for (party of player.parties){
			for (pokemon of party.pokemon){
				pokemon.fastAttackBonus = Data.BattleSettings.fastAttackBonusMultiplier;
				pokemon.chargedAttackBonus = Data.BattleSettings.chargedAttackBonusMultiplier;
				pokemon.energyDeltaPerHealthLost = 0;
				pokemon.fastMoveLagMs = 0;
				pokemon.chargedMoveLagMs = 0;
			}
		}
	}
	
	this.registerCharged = function(pkm, action){
		this.timeline.enqueue({
			name: EVENT.Minigame, t: this.t + 250, subject: pkm, move: pkm.cmove
		});
		return this.t + 500;
	}
	
	this.getAttackOptions = function(e){
		var options = [];
		var curMove = e.move || {dws: 0, energyDelta: 0};
		var pkm = e.object || e.subject;
		for (let move of [pkm.fmove].concat(pkm.cmoves)){
			if (e.subject.energy - curMove.energyDelta + move.energyDelta >= 0){
				options.push({
					t: e.t, name: (move.moveType == "fast" ? EVENT.Damage : EVENT.Minigame), value: move.name,
					style: "move", text: move.label, icon: move.icon
				});
			}
		}
		return options;
	}
}

/** 
	Initialize for a new battle.
*/
World.prototype.init = function(){
	for (let player of this.players){
		player.init();
	}
	this.t = Data.BattleSettings.arenaEntryLagMs;
	this.timelimit = this.timelimitOriginal - Data.BattleSettings.arenaEarlyTerminationMs;
	this.battleStartMs = this.t;
	this.battleDurationMs = 0;
	
	this.defeatedTeam = "";
	this.faintedPokemon = [];
	
	this.timeline = new Timeline();
	for (let player of this.players){
		this.timeline.enqueue({
			name: EVENT.Enter, t: this.t, subject: player.getHead()
		});
	}
	this.log = [];
}

/**
	Get a Pokemon by ID.
	@param {number} id The ID to look up.
	@return {Pokemon} The Pokemon with the matched ID.
*/
World.prototype.getPokemonById = function(id){
	for (let player of this.players){
		var pkm = player.getPokemonById(id);
		if (pkm)
			return pkm;
	}
	return null;
}

/**
	Register the Fast attack action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pkm The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
World.prototype.registerFast = function(pkm, action){
	var tAction = this.t + action.delay || 0 + pkm.fastMoveLagMs;
	this.timeline.enqueue({
		name: EVENT.Damage, t: tAction + pkm.fmove.dws, subject: pkm, move: pkm.fmove
	});
	return tAction + pkm.fmove.duration;
}

/**
	Register the Charged attack action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pkm The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
World.prototype.registerCharged = function(pkm, action){
	var tAction = this.t + action.delay || 0 + pkm.chargedMoveLagMs;
	this.timeline.enqueue({
		name: EVENT.Damage, t: tAction + pkm.cmove.dws, subject: pkm, move: pkm.cmove
	});
	return tAction + pkm.cmove.duration;
}

/**
	Register the Dodge action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pkm The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
World.prototype.registerDodge = function(pkm, action){
	var tAction = this.t + action.delay || 0;
	this.timeline.enqueue({
		name: EVENT.Dodge, t: tAction, subject: pkm
	});
	return tAction + Data.BattleSettings.dodgeDurationMs;
}

/**
	Handles Free event.
	@param {Object} e The event to handle.
*/
World.prototype.handleFree = function(e){
	if (!e.subject.active)
		return;
	let currentAction = e.subject.queuedAction;
	let tFree = this.t;
	if (currentAction){
		tFree = this["register" + currentAction.name](e.subject, currentAction);
	}
	if (currentAction && (e.subject.role == "gd" || e.subject.role == "rb")){
		// Gym Defenders and Raid Bosses are forced to broadcast
		currentAction.t = this.t + currentAction.delay || 0;
		currentAction.from = e.subject;
		for (let rival of e.subject.master.rivals){
			let target = rival.getHead();
			if (target && target.active){
				target.projectedRivalActions.enqueue(currentAction);
			}
		}
	}
	e.subject.queuedAction = e.subject.strategy.getActionDecision({
		t: this.t, tFree: tFree, currentAction: currentAction, weather: this.weather, dodgeBugActive: this.dodgeBugActive
	});
	this.timeline.enqueue({
		name: EVENT.Free, t: tFree, subject: e.subject
	});
}

/**
	Handles Damage Event.
	@param {Object} e The event to handle.
*/
World.prototype.handleDamage = function(e){
	if (!e.subject.active){
		e.name = "";
		return;
	}
	e.subject.gainEnergy(e.move.energyDelta);
	if (e.move.moveType == "fast"){
		e.subject.numFastAttacks++;
	}else{
		e.subject.numChargedAttacks++;
	}
	for (let rival of e.subject.master.rivals){
		let target = rival.getHead();
		if (!target.active){
			continue;
		}
		let dmg = damage(e.subject, target, e.move, this.weather);
		if (this.t < target.damageReductionExpiration){
			dmg = Math.max(1, Math.floor(dmg * (1 - target.damageReductionPercent)));
		}
		e.subject.attributeDamage(dmg, e.move.moveType);
		target.takeDamage(dmg);
		if (!target.alive()){
			target.active = false;
			this.faintedPokemon.push(target);
		}
	}
	this.processFaintedPokemon();
}

/**
	Handles Dodge Event.
	@param {Object} e The event to handle.
*/
World.prototype.handleDodge = function(e){
	e.subject.damageReductionExpiration = this.t + Data.BattleSettings.dodgeWindowMs;
	e.subject.damageReductionPercent = Data.BattleSettings.dodgeDamageReductionPercent;
}

/**
	Handles Minigame Event.
	@param {Object} e The event to handle.
*/
World.prototype.handleMinigame = function(e){
	if (!e.subject.active){
		e.name = "";
		return;
	}
	for (let e2 of this.timeline.list){
		if (e2.name == EVENT.Free){ // Reset cool down
			e2.t = this.t + 250;
		}
	}
	e.subject.gainEnergy(e.move.energyDelta);
	// Ask each enemy whether to use Shield if not already specified, and do damage
	e.reactions = e.reactions || {};
	for (let rival of e.subject.master.rivals){
		var enemy = rival.getHead();
		var reaction = e.reactions[rival.index];
		if (!reaction){
			reaction = {
				shield: rival.protectShieldLeft > 0 && enemy.strategy.getShieldDecision()
			};
			e.reactions[rival.index] = reaction;
		}
		reaction.damage = damage(e.subject, enemy, e.move);
		if (reaction.shield){ // Shield
			enemy.takeDamage(1);
			e.subject.attributeDamage(1, e.move.moveType);
			rival.protectShieldLeft--;
		}else{ // Not shield
			enemy.takeDamage(reaction.damage);
			e.subject.attributeDamage(reaction.damage, e.move.moveType);
		}
		if (!enemy.alive()){
			this.faintedPokemon.push(enemy);
		}
	}
	this.processFaintedPokemon();
}


/**
	Handles Enter Event.
	@param {Object} e The event to handle.
*/
World.prototype.handleEnter = function(e){
	var player = e.subject.master;
	player.getHead().active = false;
	player.setHead(e.subject);
	e.subject.active = true;
	e.subject.queuedAction = null;
	for (let rival of player.rivals){
		var enemy = rival.getHead();
		e.subject.choosePrimaryChargedMove(enemy, this.weather);
		enemy.choosePrimaryChargedMove(e.subject, this.weather);
	}
	this.timeline.enqueue({
		name: EVENT.Free, t: this.t, subject: e.subject
	});
}

/**
	Handles Switch Event.
	@param {Object} e The event to handle.
*/
World.prototype.handleSwitch = function(e){
	var player = e.subject.master;
	e.object = player.getHead();
	if (e.object.id == e.subject.id)
		return;
	player.switchingCooldownExpiration = this.t + Data.BattleSettings.switchingCooldownDurationMs;
	this.handleEnter(e);
}

/**
	Process fainted Pokemon as the result of this turn.
*/
World.prototype.processFaintedPokemon = function(){
	for (let pkm of this.faintedPokemon){
		let player = pkm.master;
		let party = player.getHeadParty();
		pkm.active = false;
		if (player.setHeadToNext()){ // Select next Pokemon from current party
			this.timeline.enqueue({
				name: EVENT.Enter, t: this.t + Data.BattleSettings.swapDurationMs, subject: player.getHead()
			});
		}else if (party.revive){ // Max revive current party and re-lobby
			party.heal();
			this.timeline.enqueue({
				name: EVENT.Enter, 
				t: this.t + Data.BattleSettings.rejoinDurationMs + Data.BattleSettings.itemMenuAnimationTimeMs + party.pokemon.length * Data.BattleSettings.maxReviveTimePerPokemonMs,
				subject: player.getHead()
			});
		}else if (player.setHeadPartyToNext()){ // Select next Party and re-lobby
			this.timeline.enqueue({
				name: EVENT.Enter, 
				t: this.t + Data.BattleSettings.rejoinDurationMs,
				subject: player.getHead()
			});
		}else{ // This player is done. Check if his team is defeated
			if (this.isDefeated(player.team)){
				this.defeatedTeam = player.team;
			}
		}
	}
	this.faintedPokemon = [];
}

/**
	Check if the given team is defeated. That is, if no player of the team is still in game.
	@param {string} team The team to check whether it's defeated or not.
	@return {boolean} true if defeated and false otherwise.
*/
World.prototype.isDefeated = function(team){
	for (let player of this.players){
		if (player.team == team && player.getHead().alive()){
			return false;
		}
	}
	return true;
}

/**
	Check whether the battle has ended.
	@return {boolean} true if the battle should end.
*/
World.prototype.end = function(){
	return this.defeatedTeam || (this.t > this.timelimit && this.timelimit > 0);
}

/**
	Process the event and update the interal state.
	@param {Object} event The event to process.
*/
World.prototype.next = function(event){
	let timeDiff = event.t - this.t;
	this.t = event.t;
	this.battleDurationMs += timeDiff;
	for (let player of this.players){
		let pkm = player.getHead();
		if (pkm.active){
			pkm.activeDurationMs += timeDiff;
		}
	}
	this["handle" + event.name](event);
	if (this.hasLog){
		this.dump(event);
	}
}

/**
	Start simulation.
*/
World.prototype.battle = function(){
	while (!this.end()){
		let event = this.timeline.dequeue();
		this.next(event);
	}
}

/**
	Load, translate and process a log entry.
	@param {Object} entry Log entry to load.
*/
World.prototype.load = function(entry){
	var event = {t: entry.t};
	var subjectEvent = entry.events[entry.index];
	var curOption = subjectEvent.options[subjectEvent.index];
	event.name = curOption.name;
	if (curOption.name == EVENT.Enter){
		event.subject = this.getPokemonById(parseInt(curOption.value));
	}else if (curOption.name == EVENT.Switch){
		event.subject = this.getPokemonById(parseInt(curOption.value));
	}else if (curOption.name == EVENT.Damage || curOption.name == EVENT.Minigame){
		event.subject = this.players[entry.index].getHead();
		for (let move of [event.subject.fmove].concat(event.subject.cmoves)){
			if (curOption.value == event.subject.fmove.name){
				event.move = event.subject.fmove; break;
			}
		}
		if (curOption.name == EVENT.Minigame){
			event.reactions = {};
			for (var i = 0; i < this.players.length; i++){
				let entryEvent = entry.events[i];
				if (entryEvent){
					let curOption = entryEvent.options[entryEvent.index];
					if (curOption.name == "Shield"){
						event.reactions[i] = {shield: curOption.value};
					}
				}
			}
		}
	}else if (curOption.name == EVENT.Dodge){
		event.subject = this.players[entry.index].getHead();
	}else{
		throw Error("Unloadable Entry: ", entry);
	}
	this.next(event);
}

/**
	Load and process a list of log entries.
	@param {Object[]} entries Log entries to load.
*/
World.prototype.loadList = function(entries){
	for (var i = 0; i < entries.length; i++){
		entries[i]._pos_ = i;
	}
	entries.sort((a, b) => (a.t != b.t ? a.t - b.t : a._pos_ - b._pos_));
	for (let entry of entries){
		this.load(entry);
		if (entry.breakpoint)
			break;
	}
}

/**
	Resume the battle after reading and loading some log entries.
*/
World.prototype.resume = function(){
	this.timeline.clear();
	var hasFreeEvent = {};
	for (var i = 0; i < this.players.length; i++){ 
		if (hasFreeEvent[i]){
			continue;
		} else {
			hasFreeEvent[i] = true;
			let tFree = this.t;
			let pkm = this.players[i].getHead(); 
			for (var j = this.log.length - 1; j >= 0; j--){
				let entry = this.log[j];
				if (entry.index == i){
					let subjectEvent = entry.events[i];
					let curOption = subjectEvent.options[subjectEvent.index];
					if (curOption.name == EVENT.Damage){
						let move = new Move(curOption.value);
						tFree = entry.t - move.dws + move.duration;
					}else if (curOption.name == EVENT.Minigame){
						tFree = entry.t;
					}else if (curOption.name == EVENT.Dodge){
						tFree = entry.t + Data.BattleSettings.dodgeDurationMs;
					}
					break;
				}
			}
			this.timeline.enqueue({
				name: (pkm.active ? EVENT.Free : EVENT.Enter), t: tFree, subject: pkm
			});
		}
	}
	this.battle();
}

/**
	Get the Enter/Switch options for interactive batte log.
	@param {Object} e The current event/option.
	@return {Object[]} A list of all valid options, including the current option.
*/
World.prototype.getPokemonOptions = function(e){
	var options = [];
	var eventName = e.name;
	var curValue = "";
	if (e.name == EVENT.Enter || e.name == EVENT.Switch){
		options.push({
			t: e.t, name: e.name, value: e.subject.id,
			style: "pokemon", text: e.subject.label, icon: e.subject.icon
		});
	} else {
		eventName = EVENT.Switch;
		if (e.subject.master.switchingCooldownExpiration > e.t){
			return [];
		}
	}
	for (let pkm of e.subject.party.pokemon){
		if (pkm.id != e.subject.id && (!e.object || pkm.id != e.object.id) && pkm.alive()){
			options.push({
				t: e.t, name: eventName, value: pkm.id, 
				style: "pokemon", text: pkm.label, icon: pkm.icon
			});
		}
	}
	return options;
}

/**
	Get the Attack actions for interactive batte log.
	@param {Object} e The current event/option.
	@return {Object[]} A list of all valid options, including the current option.
*/
World.prototype.getAttackOptions = function(e){
	var options = [];
	var curMove = e.move || {dws: 0, energyDelta: 0};
	var pkm = e.object || e.subject;
	for (let move of [pkm.fmove].concat(pkm.cmoves)){
		if (pkm.energy - curMove.energyDelta + move.energyDelta >= 0){
			options.push({
				t: e.t + move.dws - curMove.dws, name: EVENT.Damage, value: move.name,
				style: "move", text: move.label, icon: move.icon
			});
		}
	}
	return options;
}

/**
	Translate a simulator event into a log entry.
	@param {Object} e Simulation event to log.
*/
World.prototype.dump = function(e){
	var entry = {
		t: e.t, index: e.subject.master.index, events: new Array(this.players.length)
	};
	var subjectEvent = {
		index: null, options: []
	};
	let curValue = null;
	if (e.name == EVENT.Enter){
		curValue = e.subject.id;
		subjectEvent.options = this.getPokemonOptions(e);
	}else if (e.name == EVENT.Switch){
		curValue = e.subject.id;
		subjectEvent.options = this.getPokemonOptions(e).concat(this.getAttackOptions(e));
	}else if (e.name == EVENT.Damage){
		curValue = e.move.name;
		subjectEvent.options = this.getPokemonOptions(e).concat(this.getAttackOptions(e));
		for (let rival of e.subject.master.rivals){
			entry.events[rival.index] = {
				index: 0, options: [{text: rival.getHead().HP.toString()}]
			};
		}
	}else if (e.name == EVENT.Dodge){
		curValue = 1;
		subjectEvent.options = [{name: EVENT.Dodge, value: 1, text: "Dodge"}].concat(this.getAttackOptions(e));
	}else if (e.name == EVENT.Minigame){
		curValue = e.move.name;
		subjectEvent.options = this.getPokemonOptions(e).concat(this.getAttackOptions(e));
		for (var i in e.reactions){
			entry.events[i] = {
				index: e.reactions[i].shield ? 1: 0,
				options: [
					{name: "Shield", value: 0, text: "No Shield (-" + e.reactions[i].damage + ")"}, 
					{name: "Shield", value: 1, text: "Shield (-1)"}
				]
			};
		}
	}else{ // Ignore other events
		return;
	}
	for (var i = 0; i < subjectEvent.options.length; i++){
		if (subjectEvent.options[i].name == e.name && subjectEvent.options[i].value == curValue){
			subjectEvent.index = i; break;
		}
	}
	entry.events[entry.index] = subjectEvent;
	this.log.push(entry);
}

/** 
	Get the battle results of the simulation.
	@return {{generalStat, playerStats, pokemonStats, battleLog}} Battle outcome metrics.
*/
World.prototype.getStatistics = function(){
	var general_stat = {};
	var player_stats = [];
	var pokemon_stats = [];
	general_stat['duration'] = this.battleDurationMs/1000;
	general_stat['battle_result'] = (this.isDefeated("1") ? 1 : 0);
	let sumTDO = 0, sumMaxHP = 0;
	general_stat['numDeaths'] = 0;
	for (let player of this.players){
		let ts = player.getStatistics(general_stat['duration']);
		if (player.team == "0"){
			general_stat['numDeaths'] += ts['numDeaths'];
		}
		player_stats.push(ts);
		let playerStat = [];
		for (let party of player.parties){
			let partyStat = [];
			for (let pokemon of party.pokemon){
				partyStat.push(pokemon.getStatistics());
				if (player.team == "0"){
					sumTDO += pokemon.tdo;
				}else{
					sumMaxHP += pokemon.maxHP;
				}
			}
			playerStat.push(partyStat);
		}
		pokemon_stats.push(playerStat);
	}
	general_stat['tdo'] = sumTDO;
	general_stat['tdo_percent'] = sumTDO / sumMaxHP * 100;
	general_stat['dps'] = sumTDO / (this.battleDurationMs/1000);
	
	return {
		generalStat: general_stat,
		playerStats: player_stats,
		pokemonStats: pokemon_stats,
		battleLog: this.log
	};	
}

