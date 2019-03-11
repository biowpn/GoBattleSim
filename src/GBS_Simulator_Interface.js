
/**
	Simulator Interface. This module serves as a programming interface to the simulator. It performs validation on the input, parses user raw input which could be batch input, and averages the output if the aggregation mode is average.
	@exports GBS
*/
var GBS = {};


/**
	Do batch simulations.
	@param {Object} input User input.
	@return {Object[]} A list of specific battle data.
*/
GBS.request = function(input){	
	AdditionalSummaryMetrics = {};
	input.hasLog = (input.aggregation == "enum");
	var battles = [];
	var battleInputs = GBS.parse(input);
	for (let binput of battleInputs){
		battles = battles.concat(processConfig(binput));
	}
	return battles;
}

/**
	Do single simulation.
	@param {Object} input Specific battle input.
	@param {Object[]} log Battle log to resume (optional).
	@return {BattleOutput} The result attle data.
*/
GBS.run = function(input, log) {
	var battle = new Battle(new BattleInput(input));
	battle.init();
	if (log) {
		battle.load(log);
	}
	battle.go();
	return battle.getBattleResult();
}

/**
	Parse a batch battle input to specific battle inputs.
	@param {Object} input General battle input.
	@param {Object[]} A list of specific battle input.
*/
GBS.parse = function(input, start){
	start = start || [0, 0, 0, 0];
	for (var i = start[0]; i < input.players.length; i++){
		let player = input.players[i];
		for (var j = start[1]; j < player.parties.length; j++){
			let party = player.parties[j];
			for (var k = start[2]; k < party.pokemon.length; k++){
				let pokemon = party.pokemon[k];
				let pokemonInstance = GM.get("pokemon", pokemon.name.trim().toLowerCase()) || {};
				for (var m = start[3]; m < AttributeDefinition.length; m++){
					let attrDef = AttributeDefinition[m];
					let value = (pokemon[attrDef.name] || attrDef.default).toString().toLowerCase();
					if (GM.get(attrDef.dbname, value) != null){
						continue;
					}else if (value[0] == '='){ // Dynamic Paster
						try{
							var arr = value.slice(1).split('.');
							var srcPokemonAddress = arr[0].trim(), srcAttrName = arr[1] || attrDef.name;
							var srcPokemon = (srcPokemonAddress == "this" ? pokemon : getPokemonConfig(input, srcPokemonAddress));
							pokemon[attrDef.name] = srcPokemon[srcAttrName];
							continue;
						}catch(err){
							throw new Exception((i+1) + "-" + (j+1) + "-" + (k+1) + '.' + attrDef.name + ": Invalid Dynamic Paster");
						}
					}else{ // Poke Query
						let selector = value[0];
						if (SELECTORS.includes(selector)){
							value = value.slice(1).trim() || attrDef.default;
						}
						let matches = GM.select(attrDef.dbname, value, attrDef.name == "name" ? null : pokemonInstance);
						if (matches.length == 0){
							return [];
						}
						if (selector != '?'){
							let metric = '*' + (i+1) + "-" + (j+1) + "-" + (k+1) + '.' + attrDef.name;
							AdditionalSummaryMetrics[metric] = metric;
						}
						let branches = [];
						for (let match of matches){
							let cfg_copy = {};
							deepCopy(cfg_copy, input);
							pokemon = cfg_copy.players[i].parties[j].pokemon[k];
							pokemon[attrDef.name] = match.name;
							if (attrDef.name == "name"){ 
								if (match.uid) {
									// Match user's Pokemon
									for (var a in match) {
										if (pokemon[a]) {
											pokemon[a] = pokemon[a].toString().replace("#", match[a]);
										} else {
											pokemon[a] = match[a];
										}
									}
								} else {
									// Match generic Pokemon, copy everything
									deepCopy(pokemon, match);
								}
							}
							branches = branches.concat(GBS.parse(cfg_copy, [i, j, k, m+1]));
						}
						if (selector == '?'){ // Forced prouping	
							branches = [branches];
						}
						return branches;
					}	
				}
				start[3] = 0;
			}
			start[2] = 0;
		}
		start[1] = 0;
	}
	return [input];
}

/**
	Take arithmetic average for each numerical metric in the battle data object.
	@param {Object[]} outputs A list of battle data object.
	@return {Object} Averged battle data.
*/
GBS.average = function(battles){
	var averageBattleOutput = JSON.parse(JSON.stringify(battles[0].output));
	
	// 1. Initialize everything to 0
	traverseLeaf(averageBattleOutput, function(v, path){
		if (!isNaN(parseFloat(v))){
			setProperty(averageBattleOutput, path, 0);
		}
	});
	
	// 2. Sum them up
	for (let battle of battles){
		battle.output.battleLog = [];
		traverseLeaf(battle.output, function(v, path){
			if (!isNaN(parseFloat(v))){
				setProperty(averageBattleOutput, path, getProperty(averageBattleOutput, path) + v);
			}
		});
	}
	
	// 3. Divide and get the results
	traverseLeaf(averageBattleOutput, function(v, path){
		if (!isNaN(parseFloat(v))){
			v = v / battles.length;
			setProperty(averageBattleOutput, path, v);
		}
	});
	
	return {
		input: battles[0].input,
		output: averageBattleOutput
	};
}

/**
	Get or set the metrics (columns) used for the master summary table.
	@param {Object} user_metrics The metrics to set.
	@return {Object} The updated metrics.
*/
GBS.metrics = function(user_metrics){
	if (user_metrics) {
		DefaultSummaryMetrics = {};
		AdditionalSummaryMetrics = {};
		for (var m in user_metrics) {
			DefaultSummaryMetrics[m] = user_metrics[m];
		}
	}
	var combinedMetrics = {};
	for (var m in DefaultSummaryMetrics) {
		combinedMetrics[m] = DefaultSummaryMetrics[m];
	}
	for (var m in AdditionalSummaryMetrics) {
		combinedMetrics[m] = AdditionalSummaryMetrics[m];
	}
	return combinedMetrics;
}

/**
	Apply battle settings to the simulator.
	@param {Object} bdata Battle parameters. If omitted, default settings will be used.
*/
GBS.settings = function(bdata){
	if (bdata) {
		for (var param in bdata) {
			Battle.setting(param, bdata[param]);
		}
	} else {
		GM.each("battle", function(v, k){
			Battle.setting(k, v);
		});
	}
}

/**
	Change the global battle mode settings.
	@param {string} mode Name of the battle mode. "raid", "gym", or "pvp"
*/
GBS.mode = function(mode){
	if (mode == "pvp") {
		Battle.setting("globalAttackBonusMultiplier", GM.get("battle", "PvPAttackBonusMultiplier"));
		Battle.setting("energyDeltaPerHealthLost", 0);
		Battle.setting("fastMoveLagMs", 0);
		Battle.setting("chargedMoveLagMs", 0);
		GM.each("fast", function(move){
			for (var a in move.combat) {
				move[a] = move.combat[a];
			}
		});
		GM.each("charged", function(move){
			for (var a in move.combat) {
				move[a] = move.combat[a];
			}
		});
	} else {
		Battle.setting("globalAttackBonusMultiplier", 1);
		GBS.settings();
		GM.each("fast", function(move){
			for (var a in move.regular) {
				move[a] = move.regular[a];
			}
		});
		GM.each("charged", function(move){
			for (var a in move.regular) {
				move[a] = move.regular[a];
			}
		});
	}
}


/*
	Non-interface members
*/

var DefaultSummaryMetrics = {outcome: 'Outcome', duration: 'Time', tdo_percent: 'TDO%', dps: 'DPS', numDeaths: '#Death'};
var AdditionalSummaryMetrics = {};


/**
	@class A wrapper class to validate and format battle input.
	@param {Object} kwargs User input for a simulation.
*/
function BattleInput(kwargs) {
	deepCopy(this, kwargs);
	
	for (let player of this.players) {
		player.fab = (GM.get("friend", player.friend) || {}).multiplier || 1;
		for (let party of player.parties) {
			for (let pokemon of party.pokemon) {
				pokemon.name = pokemon.name.toLowerCase();
				let species = GM.get("pokemon", pokemon.name);
				if (!species) {
					throw new Error("No pokemon matched name", pokemon.name);
				}
				deepCopy(pokemon, species);
				
				// Find cpm
				let level_setting = GM.get("level", pokemon.level);
				if (level_setting) {
					pokemon.cpm = level_setting.cpm;
				}
				
				// Handle role, immortality, and cpm/level
				let role_params = (pokemon.role || "a").split('_');
				pokemon.role = role_params[0];
				pokemon.immortal = (pokemon.role == role_params[0].toUpperCase());
				if (role_params[1] == 'basic') {
					quartet = inferLevelAndIVs(pokemon, parseInt(pokemon.cp));
					if (quartet) {
						deepCopy(pokemon, quartet);
					} else {
						throw new Exception("No combination of IVs and level found");
					}
				}
				if (pokemon.role == "rb") {
					let raid_tier = GM.get("RaidTierSettings", pokemon.raidTier);
					pokemon.cpm = raid_tier.cpm;
					pokemon.maxHP = raid_tier.maxHP;
				}
				
				// Handle moves
				if (typeof pokemon.fmove == typeof "") {
					pokemon.fmove = GM.get("fast", pokemon.fmove.toLowerCase());
				}
				let cmoves = {};
				if (kwargs.cmoves) {
					for (let move of kwargs.cmoves) {
						if (typeof move == typeof "") {
							move = GM.get("charged", move.toLowerCase());
						}
						if (move) {
							cmoves[move.name] = move;
						}
					}
				} else if (typeof pokemon.cmove == typeof "") {
					let move = GM.get("charged", pokemon.cmove.toLowerCase());
					if (move) {
						cmoves[move.name] = move;
					}
					if (pokemon.cmove2) {
						if (typeof pokemon.cmove2 == typeof "") {
							move = GM.get("charged", pokemon.cmove2.toLowerCase());
						}
						if (move) {
							cmoves[move.name] = move;
						}
					}
				}
				pokemon.cmoves = Object.values(cmoves);
				
				if (this.battleMode == "pvp") {
					for (let move of [pokemon.fmove].concat(pokemon.cmoves)) {
						for (var a in move.combat) {
							move[a] = move.combat[a];
						}
					}
				}
			}
		}
	}
	
}


/**
	The CP formula, calculating the current CP of a Pokemon.
	@param {Object|Pokemon} pkm The Pokemon to calculate CP for. Expected to have Atk, Def and Stm. If not, then must have base stats, IV stats and cpm/level.
	@return {number} The CP value
*/
function calculateCP(pkm){
	var cpm = parseFloat(pkm.cpm);
	var atk = pkm.Atk || (pkm.baseAtk + pkm.atkiv) * cpm;
	var def = pkm.Def || (pkm.baseDef + pkm.defiv) * cpm;
	var stm = pkm.Stm || (pkm.baseStm + pkm.stmiv) * cpm;
	return Math.max(10, Math.floor(atk * Math.sqrt(def * stm)/10));
}

/**
	Find a combination of {level, atkiv, defiv, stmiv} that yields the target CP for a Pokemon.
	@param {Pokemon} pkm The Pokemon to infer level and IVs for. Expected to have baseAtk, baseDef and baseStm.
	@param {number} cp The target CP.
	@param {boolean} exact If no combination yields the target CP, it return the combination that gets the closest but is less than the target CP.
	@return {Object} A combination that yields the target CP.
*/
function inferLevelAndIVs(pkm, cp, exact){
	var minIV = 0, maxIV = 15;
	var pkm2 = {baseAtk: pkm.baseAtk, baseDef: pkm.baseDef, baseStm: pkm.baseStm};
	var levels = [];
	GM.each("level", function(level){
		levels.push(level);
	});
	var minLevelIndex = null;
	pkm2.atkiv = pkm2.defiv = pkm2.stmiv = maxIV;
	for (var i = 0; i < levels.length; i++){
		pkm2.cpm = levels[i].cpm;
		if (calculateCP(pkm2) <= cp)
			minLevelIndex = i;
		else
			break;
	};
	if (minLevelIndex == null)
		return null;
	let pkm3 = {cp: 10, cpm: 0, level: 1, atkiv: minIV, defiv: minIV, stmiv: minIV};
	for (var i = minLevelIndex; i < levels.length; i++){
		pkm2.level = levels[i].value;
		pkm2.cpm = levels[i].cpm;
		for (pkm2.atkiv = minIV; pkm2.atkiv <= maxIV; pkm2.atkiv++){
			for (pkm2.defiv = minIV; pkm2.defiv <= maxIV; pkm2.defiv++){
				for (pkm2.stmiv = minIV; pkm2.stmiv <= maxIV; pkm2.stmiv++){
					pkm2.cp = calculateCP(pkm2);
					if (pkm2.cp == cp){
						return pkm2;
					} else if (pkm2.cp > pkm3.cp && pkm2.cp < cp){
						pkm3.level = pkm2.level;
						pkm3.atkiv = pkm2.atkiv;
						pkm3.defiv = pkm2.defiv;
						pkm3.stmiv = pkm2.stmiv;
						pkm3.cpm = pkm2.cpm;
					}
				}
			}
		}
	}
	if (!exact)
		return pkm3;
}


function getPokemonConfig(cfg, address){
	var arr = address.split('-');
	var i = parseInt(arr[0])-1, j = parseInt(arr[1])-1, k = parseInt(arr[2])-1; // indices start from 1 in address
	return cfg.players[i].parties[j].pokemon[k];
}

var AttributeDefinition = [
	{
		name: "name",
		dbname: "pokemon_all",
		default: "latios"
	},{
		name: "level",
		dbname: "level",
		default: "40"
	},{
		name: "atkiv",
		dbname: "IndividualValues",
		default: "15"
	},{
		name: "defiv",
		dbname: "IndividualValues",
		default: "15"
	},{
		name: "stmiv",
		dbname: "IndividualValues",
		default: "15"
	},{
		name: "fmove",
		dbname: "fast",
		default: "current, legacy, exclusive"
	},{
		name: "cmove",
		dbname: "charged",
		default: "current, legacy, exclusive"
	},{
		name: "cmove2",
		dbname: "charged",
		default: "=this.cmove"
	}
];


function processConfig(input){
	var battles = [];
	if (Array.isArray(input)){
		for (let subInput of input){
			battles = battles.concat(processConfig(subInput));
		}
		return [GBS.average(battles)];
	}else{
		var battleInput = new BattleInput(input);
		if (battleInput.aggregation != "enum"){
			battleInput.hasLog = false;
		}
		var battle = new Battle(battleInput);
		let simPerConfig = parseInt(battleInput.simPerConfig) || 1;
		for (var i = 0; i < simPerConfig; i++){
			battle.init();
			battle.go();
			battles.push({
				input: input,
				output: battle.getBattleResult()
			});
		}
		if (battleInput.aggregation == "avrg"){
			battles = [GBS.average(battles)];
		}
		return battles;
	}
}