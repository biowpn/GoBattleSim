
/**
	Simulator Interface. This module serves as a programming interface to the simulator. It performs validation on the input, parses user raw input which could be batch input, and averages the output if the aggregation mode is average.
	@exports GBS
*/
var GBS = {};

/**
 * get the version of GBS engine 
 */
GBS.version = function () {
	var GBS_version = Module.cwrap("GBS_version", "string", []);
	return GBS_version();
}

/**
 * get the last error emitted by GBS engine
 */
GBS.error = function () {
	var GBS_error = Module.cwrap("GBS_error", "string", []);
	return GBS_error();
}

/**
 * get/set the game master for GBS engine
 * 
 * Note: should call GBS.config(GM.conver()) once
 */
GBS.config = function (game_master) {
	var GBS_config = Module.cwrap("GBS_config", "string", ["number"]);
	var in_ptr = 0;
	if (game_master) {
		var _str = JSON.stringify(game_master);
		var _str_len = lengthBytesUTF8(_str);
		in_ptr = _malloc(_str_len + 1);
		stringToUTF8(_str, in_ptr, _str_len + 1);
	}
	var out = GBS_config(in_ptr);
	_free(in_ptr);
	return JSON.parse(out);
}

/**
 * initialize new simulation. This will clear all output.
 */
GBS.prepare = function (input) {
	var GBS_prepare = Module.cwrap("GBS_prepare", null, ["string"]);
	GBS_prepare(JSON.stringify(input));
}

/**
 * run the new simulation configured by the latest GBS.prepare().
 */
GBS.run = function () {
	var GBS_run = Module.cwrap("GBS_run", null, []);
	GBS_run();
}

/**
 * collect simulation output produced by the lastest GBS_run()
 */
GBS.collect = function () {
	var GBS_collect = Module.cwrap("GBS_collect", "string", []);
	return JSON.parse(GBS_collect());
}

/**
 * Do batch simulations.
 * 
 * @param {Object} input user simulation input (can be obtained via UI.read())
 * @return {Object[]} list of simulation <input, output> pairs.
 */
GBS.request = function (input) {
	AdditionalSummaryMetrics = {};
	input.enableLog = (input.aggregation == "enum");
	var sims = [];
	var parsed_inputs = GBS.parse(input);
	for (let sim_input of parsed_inputs) {
		sims = sims.concat(processConfig(sim_input));
	}
	return sims;
}

/**
 * Parse user simulation input.
 * 
 * notes:
 * The raw input only contain names, therefore we need to find the Pokemon/Move behind them.
 * Also, it may contain wild cards like "*fire". Therefore the result is a list of "specific" sim input.
 * 
 * @param {Object} input simulation input
 * @param {Object[]} start list of indices for recursion use
 * @return list of specific/parsed simulation input
 */
GBS.parse = function (input, start) {
	start = start || [0, 0, 0, 0];
	for (var i = start[0]; i < input.players.length; i++) {
		let player = input.players[i];
		for (var j = start[1]; j < player.parties.length; j++) {
			let party = player.parties[j];
			for (var k = start[2]; k < party.pokemon.length; k++) {
				let pokemon = party.pokemon[k];
				let species = GM.get("pokemon", pokemon.name.trim().toLowerCase()) || {};
				for (var a in species) {
					if (!pokemon.hasOwnProperty(a)) {
						pokemon[a] = species[a];
					}
				}
				for (var m = start[3]; m < AttributeDefinition.length; m++) {
					let attrDef = AttributeDefinition[m];
					let value = (pokemon[attrDef.name] || attrDef.default).toString().toLowerCase();
					if (GM.get(attrDef.dbname, value) != null) {
						continue;
					} else if (value[0] == '=') { // Dynamic Paster
						try {
							var arr = value.slice(1).split('.');
							var srcPokemonAddress = arr[0].trim(), srcAttrName = arr[1] || attrDef.name;
							var srcPokemon = (srcPokemonAddress == "this" ? pokemon : getPokemonConfig(input, srcPokemonAddress));
							pokemon[attrDef.name] = srcPokemon[srcAttrName];
							continue;
						} catch (err) {
							throw new Exception((i + 1) + "-" + (j + 1) + "-" + (k + 1) + '.' + attrDef.name + ": Invalid Dynamic Paster");
						}
					} else { // Poke Query
						let selector = value[0];
						if (SELECTORS.includes(selector)) {
							value = value.slice(1).trim() || attrDef.default;
						}
						let matches = GM.select(attrDef.dbname, value, attrDef.name == "name" ? null : pokemon);
						if (matches.length == 0) {
							return [];
						}
						if (selector != '?') {
							let metric = '*' + (i + 1) + "-" + (j + 1) + "-" + (k + 1) + '.' + attrDef.name;
							AdditionalSummaryMetrics[metric] = metric;
						}
						let branches = [];
						for (let match of matches) {
							let cfg_copy = {};
							deepCopy(cfg_copy, input);
							pokemon = cfg_copy.players[i].parties[j].pokemon[k];
							pokemon[attrDef.name] = match.name;
							if (attrDef.name == "name") {
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
							branches = branches.concat(GBS.parse(cfg_copy, [i, j, k, m + 1]));
						}
						if (selector == '?') { // Forced prouping	
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
 * Take arithmetic average for each numerical metric in the battle data object.
 * @param {Object[]} sims a list of simulation <input, output> pair.
 * @return {Object} averaged simulation output.
 */
GBS.average = function (sims) {
	var averageBattleOutput = Object.assign({}, sims[0].output);

	// 1. Initialize everything to 0
	traverseLeaf(averageBattleOutput, function (v, path) {
		if (!isNaN(parseFloat(v))) {
			setProperty(averageBattleOutput, path, 0);
		}
	});

	// 2. Sum them up
	for (let battle of sims) {
		battle.output.battleLog = [];
		traverseLeaf(battle.output, function (v, path) {
			if (!isNaN(parseFloat(v))) {
				setProperty(averageBattleOutput, path, getProperty(averageBattleOutput, path) + v);
			}
		});
	}

	// 3. Divide and get the results
	traverseLeaf(averageBattleOutput, function (v, path) {
		if (!isNaN(parseFloat(v))) {
			v = v / sims.length;
			setProperty(averageBattleOutput, path, v);
		}
	});

	return {
		input: sims[0].input,
		output: averageBattleOutput
	};
}

/**
 * Get or set the metrics (columns) used for the master summary table.
 * @param {Object} user_metrics The metrics to set.
 * @return {Object} The updated metrics.
 */
GBS.metrics = function (user_metrics) {
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
 * Change the global battle mode.
 * 
 * @param {string} mode one of {"raid", "gym", "pvp"}
 */
GBS.mode = function (mode) {
	if (mode == "pvp") {
		GM.each("fast", function (move) {
			for (var a in move.combat) {
				move[a] = move.combat[a];
			}
		});
		GM.each("charged", function (move) {
			for (var a in move.combat) {
				move[a] = move.combat[a];
			}
		});
	} else {
		Battle.setting("globalAttackBonusMultiplier", 1);
		GM.each("fast", function (move) {
			for (var a in move.regular) {
				move[a] = move.regular[a];
			}
		});
		GM.each("charged", function (move) {
			for (var a in move.regular) {
				move[a] = move.regular[a];
			}
		});
	}
	GBS.config(GM.convert());
}



/**
 * Non-interface members
 */

var DefaultSummaryMetrics = { win: 'Outcome', duration: 'Time', tdoPercent: 'TDO%', dps: 'DPS', numDeaths: '#Death' };
var AdditionalSummaryMetrics = {};



function generateEngineMove(move) {
	var emove = {};
	emove.name = move.name;
	emove.pokeType = move.pokeType;
	emove.power = move.power;
	emove.energy = move.energyDelta;
	emove.duration = move.duration;
	emove.dws = move.dws;
	if (move.combat.effect) {
		emove.effect = move.combat.effect;
	}
	return emove;
}

/**
 * @class A wrapper class to validate and format Pokemon input.
 * @param {Object} kwargs Information defining the Pokemon.
 */
function PokemonInput(kwargs) {
	this.name = (kwargs.name !== undefined ? kwargs.name.toLowerCase() : undefined);
	let species = GM.get("pokemon", this.name);
	if (species == null) {
		throw new Error("Cannot create Pokemon due to no species data");
	}
	this.pokeType1 = species.pokeType1;
	this.pokeType2 = species.pokeType2;
	this.copies = parseInt(kwargs.copies) || 1;

	// 0. Role and immortality
	let roleArgs = (kwargs.role || "a").split('_');
	let role = roleArgs[0].toLowerCase();
	if (typeof kwargs.immortal == typeof false) {
		this.immortal = kwargs.immortal;
	} else {
		this.immortal = roleArgs[0] == roleArgs[0].toUpperCase();
	}

	// 1. The core three stats (Attack, Defense and Stamina)
	this.attack = kwargs.Atk;
	this.defense = kwargs.Def;
	this.maxHP = kwargs.maxHP;

	let stats = {};
	stats.stamina = kwargs.Stm;

	if (typeof this.attack == typeof 0 && typeof this.defense == typeof 0 && typeof this.maxHP == typeof 0) {
		// If Atk, Def and Stm are all defined, then no need to look up species stats.
	} else {
		// Otherwise (at least one of {Atk, Def, Stm} is missing), need to calculate them using Stat = (baseStat + ivStat) * cpm;
		// 1.1 Find baseAtk, baseDef and baseStm.
		if (typeof kwargs.baseAtk == typeof 0 && typeof kwargs.baseDef == typeof 0 && typeof kwargs.baseStm == typeof 0) {
			// If all of them are defined, then no need to look up species stats.
			stats.baseAtk = kwargs.baseAtk;
			stats.baseDef = kwargs.baseDef;
			stats.baseStm = kwargs.baseStm;
		} else {
			stats.baseAtk = species.baseAtk;
			stats.baseDef = species.baseDef;
			stats.baseStm = species.baseStm;
		}
		// 1.2 Unless the role of the Pokemon is "rb" (Raid Boss), need to find ivs
		if (role == "rb") {
			// For raid bosses, attack IV and defense IV are 15. maxHP and cpm are also defined.
			let raidTier = GM.get("RaidTierSettings", kwargs.raidTier);
			if (raidTier == null) {
				throw new Error("Raid Tier not found");
			}
			stats.atkiv = 15;
			stats.defiv = 15;
			stats.stmiv = 15;
			this.maxHP = raidTier.maxHP;
			stats.cpm = raidTier.cpm;
		} else {
			stats.atkiv = kwargs.atkiv;
			stats.defiv = kwargs.defiv;
			stats.stmiv = kwargs.stmiv;
			if (roleArgs[1] == "basic" || kwargs.atkiv == undefined || kwargs.defiv == undefined || kwargs.stmiv == undefined) {
				// Infer level and IVs from cp, given base stats.
				let quartet = inferLevelAndIVs(stats, parseInt(kwargs.cp));
				if (quartet) {
					stats.atkiv = quartet.atkiv;
					stats.defiv = quartet.defiv;
					stats.stmiv = quartet.stmiv;
					stats.level = quartet.level;
					stats.cpm = quartet.cpm;
				} else {
					throw new Error("No combination of IVs and level found");
				}
			} else {
				stats.atkiv = parseInt(stats.atkiv) || 0;
				stats.defiv = parseInt(stats.defiv) || 0;
				stats.stmiv = parseInt(stats.stmiv) || 0;
			}
		}
		// 1.3 Find cpm
		if (typeof stats.cpm == typeof 0) {
			// cpm already defined (such as raid boss), do nothing
		} else if (typeof kwargs.cpm == typeof 0) {
			stats.cpm = kwargs.cpm;
		} else {
			// Find cpm from level
			stats.level = kwargs.level;
			let levelSetting = GM.get("level", stats.level);
			if (levelSetting == null) {
				throw new Error("Cannot find level or cpm");
			}
			stats.cpm = levelSetting.cpm;
		}
		// 1.4 With everything ready, calculate the three stats if necessary
		if (typeof this.attack != typeof 0) {
			this.attack = (stats.baseAtk + stats.atkiv) * stats.cpm;
		}
		if (typeof this.defense != typeof 0) {
			this.defense = (stats.baseDef + stats.defiv) * stats.cpm;
		}
		if (typeof stats.stamina != typeof 0) {
			stats.stamina = (stats.baseStm + stats.stmiv) * stats.cpm;
		}
	}
	// 1.5 Calculate maxHP
	if (typeof this.maxHP != typeof 0) {
		if (role == "gd") { // Gym Defender
			this.maxHP = 2 * Math.floor(stats.stamina);
		} else { // Attacker
			this.maxHP = Math.floor(stats.stamina);
		}
	}

	// 2. Moves
	let fmove = {};
	if (typeof kwargs.fmove == typeof "") {
		fmove = GM.get("fast", kwargs.fmove.toLowerCase());
	} else {
		fmove = kwargs.fmove;
	}
	this.fmove = fmove ? generateEngineMove(fmove) : null;

	let cmoves = {};
	if (Array.isArray(kwargs.cmoves)) {
		for (let move of kwargs.cmoves) {
			if (typeof move == typeof "") {
				move = GM.get("charged", move.toLowerCase());
			}
			if (move) {
				cmoves[move.name] = move;
			}
		}
	} else if (typeof kwargs.cmove == typeof "") {
		let move = GM.get("charged", kwargs.cmove.toLowerCase());
		if (move) {
			cmoves[move.name] = move;
		}
		if (kwargs.cmove2) {
			if (typeof kwargs.cmove2 == typeof "") {
				move = GM.get("charged", kwargs.cmove2.toLowerCase());
			}
			if (move) {
				cmoves[move.name] = move;
			}
		}
	}
	this.cmoves = Object.values(cmoves).map(generateEngineMove);
}


/**
 * generate GBS engine input from parsed user input.
 * 
 * @param {*} sim_input parsed user input. must map to a specific pokemon/move (no wild card).
 * @return GBS engine input
 */
function generateEngineInput(sim_input) {
	var out = {
		battleMode: sim_input.battleMode,
		timelimit: sim_input.timelimit,
		weather: sim_input.weather,
		numSims: sim_input.numSims,
		aggregation: sim_input.aggregation,
		enableLog: (sim_input.aggregation == "enum")
	};

	let mini_players = [];
	let player_idx = 0;
	for (let player of sim_input["players"]) {
		let mini_player = {
			name: player.name || ("Player " + ++player_idx),
			team: 1 - parseInt(player.team),
			attack_multiplier: (GM.get("friend", player.friend) || {}).multiplier || 1.0,
			strategy: ""
		};
		let mini_parties = [];
		for (let party of player.parties) {
			let mini_party = {
				revive: party.revive,
				delay: parseInt(party.delay) || 0
			};
			let mini_pkm_list = [];
			for (let pkm of party.pokemon) {
				mini_player.strategy = pkm.strategy;
				mini_pkm_list.push(new PokemonInput(pkm));
			}
			mini_party["pokemon"] = mini_pkm_list;
			mini_parties.push(mini_party);
		}
		mini_player["parties"] = mini_parties;
		mini_players.push(mini_player);
	}
	out["players"] = mini_players;
	return out;
}

/**
 * generate by-player stats from by-pokemon stats
 * 
 * @param {*} sim_input simulation input
 * @param {*} sim_output simulation output
 */
function generateByPlayerStats(sim_input, sim_output) {
	// input
	var players = sim_input.players;
	var pokemon_stats = sim_output.pokemon;
	var overall_stats = sim_output.statistics;

	// output
	var player_stats = [];

	var pkm_idx = 0;
	var player_idx = 0;
	for (let player of players) {
		let player_stat = {
			name: player.name || "Player " + ++player_idx,
			tdo: 0,
			dps: 0,
			numDeaths: 0,
			maxHP: 0,
			parties: []
		};
		for (let party of player.parties) {
			let party_stat = {
				maxHP: 0,
				tdo: 0,
				numDeaths: 0,
				pokemon: []
			};
			for (let pkm of party.pokemon) {
				for (let i = 0; i < pkm.copies; ++i) {
					let pkm_stat = Object.assign({ name: pkm.name }, pokemon_stats[pkm_idx]);
					++pkm_idx;

					party_stat.tdo += pkm_stat.tdo;
					party_stat.numDeaths += pkm_stat.numDeaths;
					party_stat.pokemon.push(pkm_stat);
				}
			}

			player_stat.tdo += party_stat.tdo;
			player_stat.numDeaths += party_stat.numDeaths;
			player_stat.parties.push(party_stat);
		}

		player_stat.dps = player_stat.tdo / overall_stats.duration;
		player_stats.push(player_stat);
	}

	return player_stats;
}


/**
	The CP formula, calculating the current CP of a Pokemon.
	@param {Object|Pokemon} pkm The Pokemon to calculate CP for. Expected to have Atk, Def and Stm. If not, then must have base stats, IV stats and cpm/level.
	@return {number} The CP value
*/
function calculateCP(pkm) {
	var cpm = parseFloat(pkm.cpm);
	var atk = pkm.Atk || (pkm.baseAtk + pkm.atkiv) * cpm;
	var def = pkm.Def || (pkm.baseDef + pkm.defiv) * cpm;
	var stm = pkm.Stm || (pkm.baseStm + pkm.stmiv) * cpm;
	return Math.max(10, Math.floor(atk * Math.sqrt(def * stm) / 10));
}

/**
	Find a combination of {level, atkiv, defiv, stmiv} that yields the target CP for a Pokemon.
	@param {Pokemon} pkm The Pokemon to infer level and IVs for. Expected to have baseAtk, baseDef and baseStm.
	@param {number} cp The target CP.
	@param {boolean} exact If no combination yields the target CP, it return the combination that gets the closest but is less than the target CP.
	@return {Object} A combination that yields the target CP.
*/
function inferLevelAndIVs(pkm, cp, exact) {
	var pkm2 = { baseAtk: pkm.baseAtk, baseDef: pkm.baseDef, baseStm: pkm.baseStm };

	var levels = [];
	if (pkm.level !== undefined) {
		if (pkm.cpm == undefined) {
			levels = [GM.get("level", pkm.level)];
		} else {
			levels = [{ "name": pkm.level.toString(), "cpm": pkm.cpm }];
		}
	} else {
		GM.each("level", function (levelSetting) {
			levels.push(levelSetting);
		});
	}
	var atkivs = [];
	if (pkm.atkiv !== undefined) {
		atkivs = [parseInt(pkm.atkiv)];
	} else {
		atkivs = Array(16).fill().map((x, i) => i);
	}
	var defivs = [];
	if (pkm.defiv !== undefined) {
		defivs = [parseInt(pkm.defiv)];
	} else {
		defivs = Array(16).fill().map((x, i) => i);
	}
	var stmivs = [];
	if (pkm.stmiv !== undefined) {
		stmivs = [parseInt(pkm.stmiv)];
	} else {
		stmivs = Array(16).fill().map((x, i) => i);
	}

	var minLevelIndex = null;
	pkm2.atkiv = pkm2.defiv = pkm2.stmiv = 15;
	for (var i = 0; i < levels.length; i++) {
		pkm2.cpm = levels[i].cpm;
		if (calculateCP(pkm2) <= cp)
			minLevelIndex = i;
		else
			break;
	};
	if (minLevelIndex == null)
		return null;

	let pkm3 = { cpm: levels[0].cpm, level: levels[0].name, atkiv: 0, defiv: 0, stmiv: 0 };
	for (var i = minLevelIndex; i < levels.length; i++) {
		pkm2.level = levels[i].name;
		pkm2.cpm = levels[i].cpm;
		for (let aktiv of atkivs) {
			pkm2.atkiv = aktiv;
			for (let defiv of defivs) {
				pkm2.defiv = defiv;
				for (let stmiv of stmivs) {
					pkm2.stmiv = stmiv;
					pkm2.cp = calculateCP(pkm2);
					if (pkm2.cp == cp) {
						return pkm2;
					} else if (pkm2.cp > pkm3.cp && pkm2.cp < cp) {
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


function getPokemonConfig(cfg, address) {
	var arr = address.split('-');
	var i = parseInt(arr[0]) - 1, j = parseInt(arr[1]) - 1, k = parseInt(arr[2]) - 1; // indices start from 1 in address
	return cfg.players[i].parties[j].pokemon[k];
}

var AttributeDefinition = [
	{
		name: "name",
		dbname: "pokemon_all",
		default: "latios"
	}, {
		name: "level",
		dbname: "level",
		default: "40"
	}, {
		name: "atkiv",
		dbname: "IndividualValues",
		default: "15"
	}, {
		name: "defiv",
		dbname: "IndividualValues",
		default: "15"
	}, {
		name: "stmiv",
		dbname: "IndividualValues",
		default: "15"
	}, {
		name: "fmove",
		dbname: "fast",
		default: "current, legacy, exclusive"
	}, {
		name: "cmove",
		dbname: "charged",
		default: "current, legacy, exclusive"
	}, {
		name: "cmove2",
		dbname: "charged",
		default: "=this.cmove"
	}
];


function processConfig(sim_input) {
	let sims = [];
	if (Array.isArray(sim_input)) {
		for (let subInput of sim_input) {
			sims = sims.concat(processConfig(subInput));
		}
		return [GBS.average(sims)];
	} else {
		let engine_input = generateEngineInput(sim_input);
		GBS.prepare(engine_input);
		GBS.run();
		let engine_output = GBS.collect();

		if (sim_input.aggregation == "avrg") {
			let output = engine_output;
			output.players = generateByPlayerStats(engine_input, output);
			sims.push({
				input: sim_input,
				output: output
			});
		}
		else {
			for (let output of engine_output) {
				output.battleLog = convertEngineBattleLog(engine_input, output.battleLog);
				output.players = generateByPlayerStats(engine_input, output);
				sims.push({
					input: sim_input,
					output: output
				});
			}
		}
		return sims;
	}
}
