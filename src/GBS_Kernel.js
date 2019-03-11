
/*
	Non-interface members
*/

var EVENT = {
	Free: "Free",
	Damage: "Damage",
	Dodge: "Dodge",
	Enter: "Enter",
	Switch: "Switch",
	Minigame: "Minigame",
	Effect: "Effect"
};

var ACTION = {
	Fast: "Fast",
	Charged: "Charged",
	Dodge: "Dodge"
};


function traverseLeaf(json, callback, path){
	path = path || [];
	if (typeof json == typeof "" || typeof json == typeof 0){
		callback(json, path);
		return;
	}
	if (json) {
			for (let key of Object.keys(json)){
			traverseLeaf(json[key], callback, path.concat([key]));
		}
	}
}

function getProperty(json, path){
	for (var i = 0; i < path.length; i++){
		json = json[path[i]];
	}
	return json;
}

function setProperty(json, path, value){
	for (var i = 0; i < path.length - 1; i++){
		json = json[path[i]];
	}
	json[path[path.length - 1]] = value;
}

function deepCopy(dst, src) {
	for (let attr of Object.keys(src)) {
		if (Array.isArray(src[attr])) {
			dst[attr] = [];
			deepCopy(dst[attr], src[attr]);
		} else if (typeof src[attr] == typeof {}) {
			dst[attr] = {};
			deepCopy(dst[attr], src[attr]);
		} else {
			dst[attr] = src[attr];
		}
	}
}


/** 
	@class
	@param {Object|Pokemon} config Information for constructing the Pokemon.
*/
function Pokemon(config){
	for (var attr in config) {
		this[attr] = config[attr];
	}
	
	// Initialize basic stats
	this.name = config.name;
	this.pokeType1 = config.pokeType1;
	this.pokeType2 = config.pokeType2;
	this.baseAtk = parseInt(config.baseAtk);
	this.baseDef = parseInt(config.baseDef);
	this.baseStm = parseInt(config.baseStm);
	this.atkiv = parseInt(config.atkiv);
	this.defiv = parseInt(config.defiv);
	this.stmiv = parseInt(config.stmiv);
	this.cpm = parseFloat(config.cpm);
	
	this.fmove = config.fmove;
	this.cmove = config.cmove;
	this.cmoves = config.cmoves;
	
	this.strategy = new Strategy(config);
	this.projectedRivalActions = new Timeline();
	if (Pokemon.prototype.isPrototypeOf(config)) {
		this.projectedRivalActions.list = [];
		deepCopy(this.projectedRivalActions.list, config.projectedRivalActions.list);
	}	
	this.strategy.bind(this);
}

/** 
	Initialize the Pokemon's battle states. Call this method before a new battle.
*/
Pokemon.prototype.init = function(){
	// Battle state variables
	this.active = false;
	this.damageReductionExpiration = -1;
	this.damageReductionPercent = 0;
	this.queuedAction = null;
	this.projectedRivalActions = new Timeline();
	this.strategy.init();
	this.AtkStatStage = 0;
	this.DefStatStage = 0;
	
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
	Re-calculate and set the battle stats of the Pokemon.
*/
Pokemon.prototype.calculateStats = function(){
	if (this.role == "gd"){ // gym defender
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = 2 * Math.floor(this.Stm);
	}else if (this.role == "rb") { // raid boss
		this.Atk = (this.baseAtk + 15) * this.cpm;
		this.Def = (this.baseDef + 15) * this.cpm;
		// cpm and maxHP should have already been set when constructing this Pokemon
	}else{ // default, attacker
		this.Atk = (this.baseAtk + this.atkiv) * this.cpm;
		this.Def = (this.baseDef + this.defiv) * this.cpm;
		this.Stm = (this.baseStm + this.stmiv) * this.cpm;
		this.maxHP = Math.floor(this.Stm);
	}
}

/**
	Buff/debuff battle stats.
	@param {string} statName The name of the stat. "Atk" or "Def".
	@param {number} stageDelta The stage change.
	@param {number} minStage The minimum stage.
	@param {number[]} buffMultipliers A list of stat multipliers.
*/
Pokemon.prototype.buffStat = function(statName, stageDelta, minStage, buffMultipliers){
	var maxStage = minStage + buffMultipliers.length - 1;
	var stage = Math.max(minStage, Math.min(maxStage, this[statName + "StatStage"] + stageDelta));
	this[statName + "StatStage"] = stage;
	var multiplier = buffMultipliers[stage - minStage];
	this[statName] = (this['base' + statName] + this[statName.toLowerCase() + 'iv']) * this.cpm * multiplier;
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
	@param {number} maxEnergy The maximum energy allowed.
*/
Pokemon.prototype.gainEnergy = function(energyDelta, maxEnergy){
	this.energy += energyDelta;
	if (this.energy > maxEnergy){
		this.energy = maxEnergy;
	}
}

/** 
	The Pokemon takes damage and changes HP.
	@param {number} dmg The amount of HP to lose.
	@param {number} 
*/
Pokemon.prototype.takeDamage = function(dmg){
	if (this.alive()){
		this.HP -= dmg;
	}
	if (!this.alive()){
		this.numDeaths++;
	}
}


/** 
	Decides the primary charged move to use against an opponent.
	@param {Pokemon} enemy The enemy.
	@param {callback} moveDamage The damage of the move.
*/
Pokemon.prototype.choosePrimaryChargedMove = function(enemy, damageCalc){
	var best_cmove = null;
	var best_dpe = 0;
	for (let cmove of this.cmoves){
		let dpe = damageCalc(this, enemy, cmove) / (-cmove.energyDelta);
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
	Get the move of the Pokemon by name.
	@param {string} name The name of the move.
	@return {Object} The move instance of the Pokemon.
*/
Pokemon.prototype.getMoveByName = function(name){
	if (this.fmove.name == name)
		return this.fmove;
	for (let move of this.cmoves){
		if (move.name == name)
			return move;
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
		maxHP: this.maxHP,
		energy: this.energy,
		tdo: this.tdo,
		tdoFast: this.tdoFast,
		numDeaths: this.numDeaths,
		duration: this.activeDurationMs/1000,
		dps: this.tdo / (this.activeDurationMs/1000),
		numFastAttacks: this.numFastAttacks,
		numChargedAttacks: this.numChargedAttacks
	};
}
/* End of Class <Pokemon> */



/** 
	@class
	@param {Object|Party} config Keyword arguments for constructing the party.
*/
function Party(config){
	this.revive = config.revive;
	this.pokemon = [];
	for (let pokemon of config.pokemon){
		for (var r = 0; r < (pokemon.copies || 1); r++){
			this.pokemon.push(new Pokemon(pokemon));
		}
	}
	this.headingPokemonIndex = config.headingPokemonIndex || 0;
}

/** 
	Initialize the party. Call this method before a new battle.
*/
Party.prototype.init = function(){
	for (let pokemon of this.pokemon){
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
	Get the battle statistics of the party.
	@return {Object} Battle statistics.
*/
Party.prototype.getStatistics = function(){
	var statistics = {
		maxHP: 0,
		tdo: 0,
		numDeaths: 0,
		pokemon: []
	};
	for (let pokemon of this.pokemon){
		var pokemonStatistics = pokemon.getStatistics();
		statistics.maxHP += pokemonStatistics.maxHP;
		statistics.tdo += pokemonStatistics.tdo;
		statistics.numDeaths += pokemonStatistics.numDeaths;
		statistics.pokemon.push(pokemonStatistics);
	}
	return statistics;
}




/**
	@class
	@param {Object|Player} config Keyword arguments for constructing the player.
*/
function Player(config){
	this.index = config.index;
	this.fab = config.fab || 1;
	this.team = config.team;
	this.rivals = [];
	this.parties = [];
	for (let party of config.parties){
		this.parties.push(new Party(party));
	}
	for (let party of this.parties){
		for (pokemon of party.pokemon){
			pokemon.master = this;
		}
	}
	this.headingPartyIndex = config.headingPartyIndex || 0;
	this.numShieldsLeft = config.numShieldsLeft || 2;
	this.switchingCooldownExpiration = config.switchingCooldownExpiration || -1;
}

/** 
	Initialize the player. Call this method before a new battle.
*/
Player.prototype.init = function(){
	for (let party of this.parties){
		party.init();
	}
	this.headingPartyIndex = 0;
	this.numShieldsLeft = 2;
	this.switchingCooldownExpiration = -1;
}

/** 
	Get the heading Pokemon of the player.
	@return {Pokemon} The heading Pokemon.
*/
Player.prototype.getHead = function(){
	return this.getHeadParty().getHead();
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
	@param {number} battleDurationMs The duration of the battle in miliseconds.
	@return {Object} Battle performance metrics.
*/
Player.prototype.getStatistics = function(battleDurationMs){
	var statistics = {
		name: "Player " + (this.index + 1),
		tdo: 0,
		dps: 0,
		numDeaths: 0,
		maxHP: 0,
		parties: []
	};
	for (let party of this.parties){
		let partyStatistics = party.getStatistics();
		statistics.tdo += partyStatistics.tdo;
		statistics.numDeaths += partyStatistics.numDeaths;
		statistics.maxHP += partyStatistics.maxHP;
		statistics.parties.push(partyStatistics);
	}
	statistics.dps = statistics.tdo / (battleDurationMs / 1000);
	return statistics;
}



/**
	@class
	@classdesc A priority queue using 't' as key.
*/
function Timeline(){
	this.list = [];
}

/** 
	Add an item.
	@param {Object} e The item to add.
*/
Timeline.prototype.enqueue = function(e){
	for (var i = 0; i < this.list.length; i++){
		if (e.t < this.list[i].t || (e.t == this.list[i].t && e.index < this.list[i].index)){
			break;
		}
	}
	this.list.splice(i, 0, e);
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
	@param {Object|Strategy} kwargs Keyword arguments for initialization.
*/
function Strategy(kwargs){
	this.subject = null;
	this.dodgeAttackTypes = kwargs.dodgeAttackTypes || [];
	this.burstAttackStatus = kwargs.burstAttackStatus || 0; // 0: never burst; -1: burst, inactive;  1: burst, active
	this.numShieldsUsed = kwargs.numShieldsUsed || 0;
	this.numShieldsAllowed = kwargs.numShieldsAllowed || 0;
	if (Strategy.prototype.isPrototypeOf(kwargs)){
		this.getActionDecision = kwargs.getActionDecision;
	} else if (kwargs){
		this.setActionStrategy(kwargs.strategy);
		this.setShieldStrategy(kwargs.strategy2);
	}
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
	}else if (str == "strat6"){
		this.getActionDecision = this.actionStrategyNoDodgeFastOnly;
	}
}

/**
	Get the action decision.
	This function is meant to be an interface only. To be overrided later.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {Object} An action object.
*/
Strategy.prototype.getActionDecision = function(kwargs){
	return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 0};
}

/**
	Get the burst charge attack decision.
	@param {Object} kwargs Keyword arguments as parameters for making decision.
	@return {Boolean} True for using a charge right away, false for holding it (and burst later).
*/
Strategy.prototype.getBurstDecision = function(kwargs){
	if (this.burstAttackStatus == 0){
		return true;
	} 
	let projectedEnergy = this.getProjectedEnergy(kwargs);
	if (this.burstAttackStatus == 1){
		if (projectedEnergy + this.subject.cmove.energyDelta * 2 < 0){
			this.burstAttackStatus = -1;
		}
		return true;
	} else { // this.burstAttackStatus == -1
		if (projectedEnergy >= kwargs.maximumEnergy){
			this.burstAttackStatus = 1;
			return true;
		}
		var enemy = this.subject.master.rivals[0].getHead();
		if (enemy.energy >= kwargs.maximumEnergy) {
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
		this.numShieldsAllowed = str.split('0').length - 1;
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
	return this.numShieldsUsed < this.numShieldsAllowed;
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
	var numFastAttacks = this.subject.numFastAttacks + (kwargs.currentAction ? 1 : 0);
	if (numFastAttacks >= 2){
		var delay = 1500 + Math.round(1000 * Math.random()); // Add the standard defender delay
		let projectedEnergy = this.getProjectedEnergy(kwargs);
		if (projectedEnergy + this.subject.cmove.energyDelta >= 0){
			return [
				{name: ACTION.Fast, move: this.subject.fmove.name, delay: delay, weight: 0.5},
				{name: ACTION.Charged, move: this.subject.cmove.name, delay: delay, weight: 0.5}
			];
		} else {
			return {name: ACTION.Fast, move: this.subject.fmove.name, delay: delay};
		}
	}else if (numFastAttacks == 1){ // The second action
		return {name: ACTION.Fast, move: this.subject.fmove.name, delay: Math.max(0, 1000 - this.subject.fmove.duration)};
	}else{ // The first action
		return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 500};
	}
}

/**
	Attacker strategy: No dodge
*/
Strategy.prototype.actionStrategyNoDodge = function(kwargs){
	let projectedEnergy = this.getProjectedEnergy(kwargs);
	if (projectedEnergy + this.subject.cmove.energyDelta >= 0 && this.getBurstDecision(kwargs)){
		return {name: ACTION.Charged, move: this.subject.cmove.name, delay: 0};
	}else{
		return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 0};
	}
}

/**
	Attacker strategy: No dodge, use fast move only
*/
Strategy.prototype.actionStrategyNoDodgeFastOnly = function(kwargs){
	return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 0};
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
	var enemy = null;
	for (let rival of this.subject.master.rivals){
		enemy = rival.getPokemonById(rivalAttackAction.from);
		if (enemy)
			break;
	}
	var enemy_move = enemy.getMoveByName(rivalAttackAction.move);
	var hurtTime = rivalAttackAction.t + enemy_move.dws;
	if (this.damageReductionExpiration >= hurtTime){
		return this.actionStrategyNoDodge(kwargs);
	}
	let dmg = kwargs.damageCalc(enemy, this.subject, enemy_move);
	let dodgedDmg = kwargs.dodgeBugActive ? dmg : Math.max(1, Math.floor(dmg * (1 - kwargs.dodgeDamageReductionPercent)));
	if (dodgedDmg >= this.subject.HP){
		return this.actionStrategyNoDodge(kwargs);
	}
	let timeTillHurt = hurtTime - kwargs.tFree;
	if (this.subject.energy + this.subject.cmove.energyDelta >= 0 && timeTillHurt > this.subject.cmove.duration){
		// Fit in another charge move
		this.subject.projectedRivalActions.enqueue(rivalAttackAction); // Put the broadcasted action for next decision making
		return {name: ACTION.Charged, move: this.subject.cmove.name, delay: 0};
	}else if (timeTillHurt > this.subject.fmove.duration){
		// Fit in another fast move
		this.subject.projectedRivalActions.enqueue(rivalAttackAction); // Put the broadcasted action for next decision making
		return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 0};
	}else if (timeTillHurt >= 0){
		// Has time to dodge, and delay a little bit to wait for damage window if necessary
		return {
			name: ACTION.Dodge,
			delay: Math.max(0, timeTillHurt - kwargs.dodgeWindowMs + 1)
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
				return {name: ACTION.Charged, move: move.name, delay: 0};
			} else { // Secondary move
				let enemy = this.subject.master.rivals[0].getHead();
				if (kwargs.damageCalc(this.subject, enemy, move) >= enemy.HP){
					this.subject.cmove = move;
					return {name: ACTION.Charged, move: move.name, delay: 0};
				}
			}
		}
	}
	return {name: ACTION.Fast, move: this.subject.fmove.name, delay: 0};
}



/**
	@class
	@classdesc The highest-level class, where the battle takes place.
	@param {Object|Battle} config The structured simulation input.
*/
function Battle(config){
	// Configure general parameters
	this.battleMode = config.battleMode;
	this.aggregation = config.aggregation;
	this.timelimit = parseInt(config.timelimit);
	if (!this.timelimit > 0){
		this.timelimit = -1;
	}
	this.timelimitAdjusted = config.timelimitAdjusted || (this.timelimit - Battle.bdata.arenaEarlyTerminationMs);
	this.weather = config.weather;
	this.hasLog = config.hasLog;
	this.dodgeBugActive = parseInt(config.dodgeBugActive) || false;
	this.pokemon = []; // An array to manage all Pokemon
	this.timeline = new Timeline();
	this.log = [];
	this.battleDurationMs = config.battleDurationMs || 0;
	this.t = config.t || Battle.bdata.arenaEntryLagMs;
	// For copy constructing
	if (Battle.prototype.isPrototypeOf(config)){
		this.defeatedTeam = config.defeatedTeam;
		deepCopy(this.timeline.list, config.timeline.list);
		deepCopy(this.log, config.log);
	}
	
	// Configure players
	this.players = [];
	for (let player of config.players){
		this.players.push(new Player(player));
	}
	// Configure matchups
	for (let player of this.players){
		player.rivals = [];
		for (let player2 of this.players){
			if (player2.team != player.team){ // If you are not in my team, then you are my enemy!
				player.rivals.push(player2);
			}
		}
	}
	// Give each player an index
	// Give each Pokemon a unique ID
	let pokemon_id = 0, player_index = 0;
	for (player of this.players){
		player.index = player_index++;
		for (party of player.parties){
			for (pokemon of party.pokemon){
				this.pokemon.push(pokemon);
				pokemon.id = pokemon_id++;
				pokemon.fab = player.fab;
			}
		}
	}
	if (this.battleMode == "pvp"){
		this.overridePvP();
	}
	// Tree average
	this.treeHeight = config.treeHeight || 0;
	this.branches = [];
	
}

Battle.bdata = {};
/**
	@static Get/set battle parameters.
	@param {string} name The name of the battle parameter to get/set.
	@param {Object} value The value of the battle parameter to get/set.
	@return {Object} The updated value.
*/
Battle.setting = function(name, value){
	if (value != undefined) {
		var src = {};
		src[name] = value;
		deepCopy(Battle.bdata, src);
	}
	return Battle.bdata[name];
}


/** 
	Override certain methods for PvP.
*/
Battle.prototype.overridePvP = function(){
	
	this.registerCharged = function(pokemon, action){
		this.timeline.enqueue({
			name: EVENT.Minigame, t: this.t + 200, subject: pokemon.id, move: action.move, index: pokemon.master.index
		});
		return this.t + 500;
	}
	
	this.getAttackOptions = function(event){	
		var options = [];
		var subject = this.getPokemonById(event.subject);
		var curMove = subject.getMoveByName(event.move) || {dws: 0, energyDelta: 0};
		var pkm =  this.getPokemonById(event.object) || subject;
		for (let move of [pkm.fmove].concat(pkm.cmoves)){
			if (subject.energy - curMove.energyDelta + move.energyDelta >= 0){
				options.push({
					t: event.t, name: (move.moveType == "fast" ? EVENT.Damage : EVENT.Minigame), value: move.name,
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
Battle.prototype.init = function(){
	for (let player of this.players){
		player.init();
	}
	this.t = Battle.bdata.arenaEntryLagMs;
	this.timelimitAdjusted = this.timelimit - Battle.bdata.arenaEarlyTerminationMs;
	this.battleDurationMs = 0;
	this.defeatedTeam = "";
	this.timeline.list = [];
	for (let player of this.players){
		this.timeline.enqueue({
			name: EVENT.Enter, t: this.t, subject: player.getHead().id, index: player.index
		});
	}
	this.log = [];
	this.branches = [];
}

/**
	Get a Pokemon by ID.
	@param {number} id The ID to look up.
	@return {Pokemon} The Pokemon with the matched ID.
*/
Battle.prototype.getPokemonById = function(id){
	return this.pokemon[id];
}


/**
	Calculate the damage of an attack.
	@param {Pokemon} attacker The Pokemon using the attack.
	@param {Pokemon} receiver The Pokemon taking the hit.
	@param {Object} move The move being used.
	@return {number} The damage value.
*/
Battle.prototype.damage = function(attacker, receiver, move){
	var multiplier = 1;	
	if (move.pokeType == attacker.pokeType1 || move.pokeType == attacker.pokeType2){
		multiplier *= Battle.bdata.sameTypeAttackBonusMultiplier; // Same Type Attack Bonus
	}
	if (Battle.bdata.TypeBoostedWeather[move.pokeType] == this.weather){
		multiplier *= Battle.bdata.weatherAttackBonusMultiplier; // Weather Attack Bonus
	}
	multiplier *= attacker.fab || 1;	// Friend Attack Bonus multiplier
	multiplier *= Battle.bdata.globalAttackBonusMultiplier || 1;	// Global Attack Bonus multiplier
	multiplier *= Battle.bdata.TypeEffectiveness[move.pokeType][receiver.pokeType1] || 1;
	multiplier *= Battle.bdata.TypeEffectiveness[move.pokeType][receiver.pokeType2] || 1;
	return Math.floor(0.5 * attacker.Atk / receiver.Def * move.power * multiplier) + 1;
}


/**
	Register the Fast attack action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pokemon The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
Battle.prototype.registerFast = function(pokemon, action){
	var tAction = this.t + action.delay || 0 + Battle.bdata.fastMoveLagMs;
	var move = pokemon.getMoveByName(action.move);
	this.timeline.enqueue({
		name: EVENT.Damage, t: tAction + move.dws, subject: pokemon.id, move: action.move, index: pokemon.master.index
	});
	return tAction + move.duration;
}

/**
	Register the Charged attack action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pokemon The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
Battle.prototype.registerCharged = function(pokemon, action){
	var tAction = this.t + action.delay || 0 + Battle.bdata.chargedMoveLagMs;
	var move = pokemon.getMoveByName(action.move);
	this.timeline.enqueue({
		name: EVENT.Damage, t: tAction + move.dws, subject: pokemon.id, move: action.move, index: pokemon.master.index
	});
	return tAction + move.duration;
}

/**
	Register the Dodge action of a Pokemon by queuing appropriate events.
	@param {Pokemon} pokemon The pokemon who performs the action.
	@param {Object} action The action object.
	@return {number} The time when the Pokemon will be free again for another action.
*/
Battle.prototype.registerDodge = function(pokemon, action){
	var tAction = this.t + action.delay || 0;
	this.timeline.enqueue({
		name: EVENT.Dodge, t: tAction, subject: pokemon.id, index: pokemon.master.index
	});
	return tAction + Battle.bdata.dodgeDurationMs;
}

/**
	Handles Free event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleFree = function(event){
	var subject = this.getPokemonById(event.subject);
	if (!subject.active){
		return;
	}
		
	let currentAction = subject.queuedAction;
	let tFree = this.t;
	if (currentAction){
		tFree = this["register" + currentAction.name](subject, currentAction);
	}
	if (currentAction && (subject.role == "gd" || subject.role == "rb")){
		// Gym Defenders and Raid Bosses are forced to broadcast
		currentAction.t = this.t + currentAction.delay || 0;
		currentAction.from = subject.id;
		for (let rival of subject.master.rivals){
			let target = rival.getHead();
			if (target.active){
				target.projectedRivalActions.enqueue(currentAction);
			}
		}
	}
	subject.queuedAction = subject.strategy.getActionDecision({
		t: this.t, tFree: tFree, currentAction: currentAction, damageCalc: this.damage, dodgeBugActive: this.dodgeBugActive, 
		maximumEnergy: Battle.bdata.maximumEnergy, dodgeWindowMs: Battle.bdata.dodgeWindowMs, dodgeDamageReductionPercent: Battle.bdata.dodgeDamageReductionPercent
	});
	this.timeline.enqueue({
		name: EVENT.Free, t: tFree, subject: subject.id, index: subject.master.index
	});
	if (Array.isArray(subject.queuedAction)){
		if (this.aggregation == "tree" && this.treeHeight < Battle.bdata.maximumTreeHeight){
			let subject_id = subject.id;
			this.branch(subject.queuedAction, function(battle, action){
				battle.getPokemonById(subject_id).queuedAction = action;
				battle.go();
			});
		} else {
			var randomNumber = Math.random();
			for (let action of subject.queuedAction){
				if (randomNumber < action.weight){
					subject.queuedAction = action;
					break;
				} else {
					randomNumber -= action.weight;
				}
			}
		}
	}
}

/**
	Handles Damage Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleDamage = function(event){
	var subject = this.getPokemonById(event.subject);
	var move = subject.getMoveByName(event.move);
	if (!subject.active){
		event.name = "";
		return;
	}
	subject.gainEnergy(move.energyDelta, Battle.bdata.maximumEnergy);
	if (move.moveType == "fast"){
		subject.numFastAttacks++;
	}else{
		subject.numChargedAttacks++;
	}
	for (let rival of subject.master.rivals){
		let target = rival.getHead();
		if (!target.active){
			continue;
		}
		let dmg = this.damage(subject, target, move);
		if (this.t < target.damageReductionExpiration){
			dmg = Math.max(1, Math.floor(dmg * (1 - target.damageReductionPercent)));
		}
		subject.attributeDamage(dmg, move.moveType);
		target.takeDamage(dmg);
		target.gainEnergy(Math.ceil(dmg * Battle.bdata.energyDeltaPerHealthLost), Battle.bdata.maximumEnergy);
		if (!target.alive()){
			target.active = false;
			this.processFaintedPokemon(target);
		}
	}
}

/**
	Handles Dodge Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleDodge = function(event){
	var subject = this.getPokemonById(event.subject);
	subject.damageReductionExpiration = this.t + Battle.bdata.dodgeWindowMs;
	subject.damageReductionPercent = Battle.bdata.dodgeDamageReductionPercent;
}

/**
	Handles Minigame Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleMinigame = function(event){
	var subject = this.getPokemonById(event.subject);
	var move = subject.getMoveByName(event.move);
	if (!subject.active){
		event.name = "";
		return;
	}
	for (let e of this.timeline.list){
		if (e.name == EVENT.Free){ // Reset cool down
			e.t = this.t + 300;
		}
	}
	this.timeline.list.sort((a, b) => a.t - b.t);
	subject.gainEnergy(move.energyDelta);
	// Ask each enemy whether to use Shield if not already specified, and do damage
	event.reactions = event.reactions || {};
	for (let rival of subject.master.rivals){
		var enemy = rival.getHead();
		var reaction = event.reactions[rival.index];
		if (!reaction){
			reaction = {
				shield: rival.numShieldsLeft > 0 && enemy.strategy.getShieldDecision()
			};
			event.reactions[rival.index] = reaction;
		}
		reaction.damage = this.damage(subject, enemy, move);
		if (reaction.shield){ // Shield
			enemy.takeDamage(1);
			subject.attributeDamage(1, move.moveType);
			enemy.strategy.numShieldsUsed++;
			rival.numShieldsLeft--;
		}else{ // Not shield
			enemy.takeDamage(reaction.damage);
			subject.attributeDamage(reaction.damage, move.moveType);
		}
		if (!enemy.alive()){
			this.processFaintedPokemon(enemy);
		}
	}
	if (move.effect){
		this.timeline.enqueue({
			name: EVENT.Effect, t: this.t + 100, subject: subject.id, move: move.name, index: subject.master.index
		});
	}
}

/**
	Handles Effect Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleEffect = function(event){
	var subject = this.getPokemonById(event.subject);
	var move = subject.getMoveByName(event.move);
	if (!event.activated){
		if (this.aggregation == "tree" && this.treeHeight < Battle.bdata.maximumTreeHeight && move.effect.probability < 1){
			var event2 = {};
			deepCopy(event2, event);
			event.activated = 1;
			event.weight = move.effect.probability;
			event2.activated = -1;
			event2.weight = 1 - move.effect.probability;
			return this.branch([event, event2], function(battle, evt){
				battle.next(evt);
				battle.go();
			});
		} else {
			event.activated = Math.random() < move.effect.probability ? 1 : -1;
		}
	}
	let effect = move.effect;
	if (event.activated == 1){
		if (effect.name == "StatMod"){
			for (var i = 0; i < effect.subject.length; i++){
				if (effect.subject[i] == "self"){
					var stat = effect.stat[i];
					subject.buffStat(stat, effect.stageDelta[i], Battle.bdata.minimumStatStage, Battle.bdata[stat + "BuffMultiplier"]);
				} else if (effect.subject[i] == "enemy"){
					for (let rival of subject.master.rivals){
						var stat = effect.stat[i];
						rival.getHead().buffStat(stat, effect.stageDelta[i], Battle.bdata.minimumStatStage, Battle.bdata[stat + "BuffMultiplier"]);
					}
				}
			}
		}
	}
}

/**
	Handles Enter Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleEnter = function(event){
	var subject = this.getPokemonById(event.subject);
	var player = subject.master;
	player.getHead().active = false;
	player.setHead(subject);
	subject.active = true;
	subject.queuedAction = null;
	for (let rival of player.rivals){
		var enemy = rival.getHead();
		subject.choosePrimaryChargedMove(enemy, this.damage);
		enemy.choosePrimaryChargedMove(subject, this.damage);
	}
	this.timeline.enqueue({
		name: EVENT.Free, t: this.t + 500, subject: subject.id, index: player.index
	});
}

/**
	Handles Switch Event.
	@param {Object} event The event to handle.
*/
Battle.prototype.handleSwitch = function(event){
	var subject = this.getPokemonById(event.subject);
	var player = subject.master;
	event.object = player.getHead();
	if (event.object.id == subject.id)
		return;
	player.switchingCooldownExpiration = this.t + Battle.bdata.switchingCooldownDurationMs;
	this.handleEnter(event);
}

/**
	Process fainted Pokemon.
	@param {Pokemon} pokemon The fainted Pokemon.
*/
Battle.prototype.processFaintedPokemon = function(pokemon){
	let player = pokemon.master;
	let party = player.getHeadParty();
	pokemon.active = false;
	if (player.setHeadToNext()){ // Select next Pokemon from current party
		this.timeline.enqueue({
			name: EVENT.Enter, t: this.t + Battle.bdata.swapDurationMs, subject: player.getHead().id, index: player.index
		});
	}else if (party.revive){ // Max revive current party and re-lobby
		party.heal();
		this.timeline.enqueue({
			name: EVENT.Enter, 
			t: this.t + Battle.bdata.rejoinDurationMs + Battle.bdata.itemMenuAnimationTimeMs + party.pokemon.length * Battle.bdata.maxReviveTimePerPokemonMs,
			subject: player.getHead().id, index: player.index
		});
	}else if (player.setHeadPartyToNext()){ // Select next Party and re-lobby
		this.timeline.enqueue({
			name: EVENT.Enter, t: this.t + Battle.bdata.rejoinDurationMs, subject: player.getHead().id, index: player.index
		});
	}else{ // This player is done. Check if his team is defeated
		if (this.isDefeated(player.team)){
			this.defeatedTeam = player.team;
		}
	}
}

/**
	Check if the given team is defeated. That is, if no player of the team is still in game.
	@param {string} team The team to check whether it's defeated or not.
	@return {boolean} true if defeated and false otherwise.
*/
Battle.prototype.isDefeated = function(team){
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
Battle.prototype.end = function(){
	return this.defeatedTeam || (this.t > this.timelimitAdjusted && this.timelimit > 0) || this.branches.length;
}

/**
	Process the event and update the interal state.
	@param {Object} event The event to process.
*/
Battle.prototype.next = function(event){
	let timeDiff = event.t - this.t;
	this.t = event.t;
	this.battleDurationMs += timeDiff;
	for (let player of this.players){
		let pokemon = player.getHead();
		if (pokemon.active){
			pokemon.activeDurationMs += timeDiff;
		}
	}
	this["handle" + event.name](event);
	if (this.hasLog){
		var entry = this.toEntry(event);
		if (entry){
			this.log.push(entry);
		}
	}
}

/**
	Start simulation.
*/
Battle.prototype.go = function(){
	while (!this.end()){
		let event = this.timeline.dequeue();
		this.next(event);
	}
}

/**
	Translate a simulator event into a battle log entry.
	@param {Object} event Simulation event.
	@return {Object} Battle log entry.
*/
Battle.prototype.toEntry = function(event){
	var subject = this.getPokemonById(event.subject);
	var entry = {
		t: event.t, index: subject.master.index, events: new Array(this.players.length)
	};
	var subjectEvent = {
		index: null, options: []
	};
	let curValue = null;
	if (event.name == EVENT.Enter){
		curValue = subject.id;
		subjectEvent.options = this.getPokemonOptions(event);
	}else if (event.name == EVENT.Switch){
		curValue = subject.id;
		subjectEvent.options = this.getPokemonOptions(event).concat(this.getAttackOptions(event));
	}else if (event.name == EVENT.Damage){
		curValue = subject.getMoveByName(event.move).name;
		subjectEvent.options = this.getPokemonOptions(event).concat(this.getAttackOptions(event));
		for (let rival of subject.master.rivals){
			entry.events[rival.index] = {
				index: 0, options: [{text: rival.getHead().HP.toString()}]
			};
		}
	}else if (event.name == EVENT.Dodge){
		curValue = 1;
		subjectEvent.options = [{name: EVENT.Dodge, value: 1, text: "Dodge"}].concat(this.getAttackOptions(event));
	}else if (event.name == EVENT.Minigame){
		curValue = subject.getMoveByName(event.move).name;
		subjectEvent.options = this.getPokemonOptions(event).concat(this.getAttackOptions(event));
		for (var i in event.reactions){
			entry.events[i] = {
				index: event.reactions[i].shield ? 1: 0,
				options: [
					{name: "Shield", value: 0, text: "No Shield (-" + event.reactions[i].damage + ")"}, 
					{name: "Shield", value: 1, text: "Shield (-1)"}
				]
			};
		}
	}else if (event.name == EVENT.Effect){
		var move = subject.getMoveByName(event.move);
		curValue = event.activated;
		subjectEvent.options = [
			{t: event.t, name: EVENT.Effect, value: 1, value2: move.name, text: "Activate Effect: " + move.effect.name},
			{t: event.t, name: EVENT.Effect, value: -1, value2: move.name, text: "Deactivate Effect"}
		];
	}else{ // Ignore other events
		return;
	}
	for (var i = 0; i < subjectEvent.options.length; i++){
		if (subjectEvent.options[i].name == event.name && subjectEvent.options[i].value == curValue){
			subjectEvent.index = i; break;
		}
	}
	entry.events[entry.index] = subjectEvent;
	return entry;
}

/**
	Translate a log entry to simulator event.
	@param {Object} entry Battle log entry.
	@return {Object} Simulator event.
*/
Battle.prototype.toEvent = function(entry){
	var event = {t: entry.t};
	var subjectEvent = entry.events[entry.index];
	var curOption = subjectEvent.options[subjectEvent.index];
	event.name = curOption.name;
	if (curOption.name == EVENT.Enter){
		event.subject = curOption.value;
	}else if (curOption.name == EVENT.Switch){
		event.subject = curOption.value;
	}else if (curOption.name == EVENT.Damage){
		event.subject = this.players[entry.index].getHead().id;
		event.move = curOption.value;
	}else if (curOption.name == EVENT.Minigame){
		event.subject = this.players[entry.index].getHead().id;
		event.move = curOption.value;
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
	}else if (curOption.name == EVENT.Effect){
		event.subject = this.players[entry.index].getHead().id;
		event.move = curOption.value2;
		event.activated = curOption.value;
	}else if (curOption.name == EVENT.Dodge){
		event.subject = this.players[entry.index].getHead().id;
	}else{
		throw Error("Unloadable Entry: ", entry);
	}
	return event;
}

/**
	Load, translate and process a list of log entries.
	@param {Object[]} entries Log entries to load.
*/
Battle.prototype.load = function(entries){
	for (var i = 0; i < entries.length; i++){
		entries[i]._pos_ = i;
	}
	entries.sort((a, b) => (a.t != b.t ? a.t - b.t : a._pos_ - b._pos_));
	for (let entry of entries){
		var event = this.toEvent(entry);
		this.next(event);
		if (entry.breakpoint){
			break;
		}	
	}
	this.timeline.list = this.timeline.list.filter(e => (e.t > this.t && e.name != EVENT.Free));
	var hasFreeEvent = {};
	for (var i = 0; i < this.players.length; i++){
		if (hasFreeEvent[i]){
			continue;
		} else {
			hasFreeEvent[i] = true;
			let tFree = this.t;
			let pokemon = this.players[i].getHead();
			for (var j = this.log.length - 1; j >= 0; j--){
				let entry = this.log[j];
				if (entry.index == i){
					let subjectEvent = entry.events[i];
					let curOption = subjectEvent.options[subjectEvent.index];
					if (curOption.name == EVENT.Damage){
						let move = pokemon.getMoveByName(curOption.value);
						tFree = entry.t - move.dws + move.duration;
					}else if (curOption.name == EVENT.Minigame){
						tFree = entry.t + 300;
					}else if (curOption.name == EVENT.Effect){
						tFree = entry.t + 200;
					}else if (curOption.name == EVENT.Dodge){
						tFree = entry.t + Battle.bdata.dodgeDurationMs;
					}else if (curOption.name == EVENT.Enter || curOption.name == EVENT.Switch){
						tFree = entry.t + 500;
					}
					break;
				}
			}
			this.timeline.enqueue({
				name: (pokemon.active ? EVENT.Free : EVENT.Enter), t: tFree, subject: pokemon.id, index: i
			});
		}
	}
}

/**
	Get the Enter/Switch options for interactive batte log.
	@param {Object} event The current event/option.
	@return {Object[]} A list of valid options, including the current option.
*/
Battle.prototype.getPokemonOptions = function(event){
	var options = [];
	var eventName = event.name;
	var subject = this.getPokemonById(event.subject);
	var curValue = "";
	if (event.name == EVENT.Enter || event.name == EVENT.Switch){
		options.push({
			t: event.t, name: event.name, value: subject.id,
			style: "pokemon", text: subject.label, icon: subject.icon
		});
	} else {
		eventName = EVENT.Switch;
		if (subject.master.switchingCooldownExpiration > event.t){
			return [];
		}
	}
	for (let pkm of subject.master.getHeadParty().pokemon){
		if (pkm.id != subject.id && pkm.id != event.object && pkm.alive()){
			options.push({
				t: event.t, name: eventName, value: pkm.id, 
				style: "pokemon", text: pkm.label, icon: pkm.icon
			});
		}
	}
	return options;
}

/**
	Get the Attack actions for interactive batte log.
	@param {Object} event The current event/option.
	@return {Object[]} A list of valid options, including the current option.
*/
Battle.prototype.getAttackOptions = function(event){
	var options = [];
	var subject = this.getPokemonById(event.subject);
	var curMove = subject.getMoveByName(event.move) || {dws: 0, energyDelta: 0};
	var pkm =  this.getPokemonById(event.object) || subject;
	for (let move of [pkm.fmove].concat(pkm.cmoves)){
		if (pkm.energy - curMove.energyDelta + move.energyDelta >= 0){
			options.push({
				t: event.t + move.dws - curMove.dws, name: EVENT.Damage, value: move.name,
				style: "move", text: move.label, icon: move.icon
			});
		}
	}
	return options;
}

/**
	Terminate current simulation and evaluate branch outcomes.
	@param {Object[]} options A list of objects representing differrent branch. Each must have a weight and all weights must sum to 1.
	@param {Battle~branchCallback} callbackfn The operation to perform on each new battle instance.
*/
Battle.prototype.branch = function(options, callbackfn){
	for (let option of options){
		var battle = new Battle(this);
		battle.treeHeight += 1;
		callbackfn(battle, option);
		this.branches.push({weight: option.weight, statistics: battle.getStatistics("0", "1")});
	}
}
/**
 * @callback Battle~branchCallback
 * @param {Battle} battle The cloned battle instance.
 * @param {Object} option The object that represents this branch.
 */


/** 
	Get the battle statistics.
	@param {string} primary The primary team whose perspective is used for general stats.
	@param {string} opposite The opposite team.
	@return {Object} Battle result.
*/
Battle.prototype.getStatistics = function(primary, opposite){
	if (this.branches.length > 0){
		return this.getTreeAverageStatistics(primary, opposite);
	} else {
		var statistics = {
			duration: this.battleDurationMs/1000,
			outcome: this.isDefeated(opposite) ? 1 : 0,
			tdo: 0,
			tdo_percent: 0,
			dps: 0,
			numDeaths: 0,
			players: []
		};
	}
	let oppositeSumMaxHP = 0;
	for (let player of this.players){
		var playerStatistics = player.getStatistics(this.battleDurationMs);
		if (player.team == primary){
			statistics.tdo += playerStatistics.tdo;
			statistics.numDeaths += playerStatistics.numDeaths;
		} else {
			oppositeSumMaxHP += playerStatistics.maxHP;
		}
		statistics.players.push(playerStatistics);
	}
	statistics.tdo_percent = statistics.tdo / oppositeSumMaxHP * 100;
	statistics.dps = statistics.tdo / statistics.duration;
	return statistics;
}

/** 
	Get the tree averaged battle statistics.
	@return {Object} Tree averaged Battle result.
*/
Battle.prototype.getTreeAverageStatistics = function(){
	function add(json1, json2){
		var result = JSON.parse(JSON.stringify(json1));
		traverseLeaf(result, function(v, path){
			if (!isNaN(parseFloat(v))){
				setProperty(result, path, v + getProperty(json2, path));
			}
		});
		return result;
	}

	function multiply(json, num){
		var result = JSON.parse(JSON.stringify(json));
		traverseLeaf(result, function(v, path){
			if (!isNaN(parseFloat(v))){
				setProperty(result, path, v * num);
			}
		});
		return result;
	}
	var statistics = multiply(this.branches[0].statistics, this.branches[0].weight);
	for (var i = 1; i < this.branches.length; i++){
		statistics = add(statistics, multiply(this.branches[i].statistics, this.branches[i].weight));
	}
	return statistics;
}

/** 
	Get the battle results of the simulation.
	@param {string} primary The primary team whose perspective is used for general stats. Defaults to team "0".
	@return {Object} Battle result.
*/
Battle.prototype.getBattleResult = function(primary){
	primary = primary || "0";
	var opposite = (primary == "0" ? "1" : "0");
	return {
		statistics: this.getStatistics(primary, opposite),
		battleLog: this.log
	};	
}