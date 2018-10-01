/* GBS_Populate.js */

var raidBossListURL = "", pokemonDataFullURL = "", moveDataFullURL = "";

var FETCHED_STATUS = 0;
var FETCHED_STATUS_PASS = 5;

/* 
 *	PART I(a): GAME DATA
 */
 

var DefaultData = {
	BattleSettings: {
		'sameTypeAttackBonusMultiplier': 1.2,
		'maximumEnergy': 100, 
		'energyDeltaPerHealthLost': 0.5, 
		'dodgeDurationMs': 500, 
		'swapDurationMs': 1000, 
		'dodgeDamageReductionPercent': 0.75, 
		'weatherAttackBonusMultiplier': 1.2,
		'dodgeWindowMs': 700,
		'dodgeSwipeMs': 200,
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
	},
	
	FriendSettings: [
		{
			'name': "none",
			'label': "Lv.0 Non-Friend",
			'multiplier': 1.0
		},
		{
			'name': "good",
			'label': "Lv.1 Good Friend",
			'multiplier': 1.03
		},
		{
			'name': "great",
			'label': "Lv.2 Great Friend",
			'multiplier': 1.05
		},
		{
			'name': "ultra",
			'label': "Lv.3 Ultra Friend",
			'multiplier': 1.07
		},
		{
			'name': "best",
			'label': "Lv.4 Best Friend",
			'multiplier': 1.1
		},
	],
	
	TypeEffectiveness: {"normal": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.0, "ghost": 0.51, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "fighting": {"normal": 1.4, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 0.51, "steel": 1.4, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.4, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "flying": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "poison": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 0.714, "ground": 0.714, "rock": 0.714, "bug": 1.0, "ghost": 0.714, "steel": 0.51, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "ground": {"normal": 1.0, "fighting": 1.0, "flying": 0.51, "poison": 1.4, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 1.4, "fire": 1.4, "water": 1.0, "grass": 0.714, "electric": 1.4, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "rock": {"normal": 1.0, "fighting": 0.714, "flying": 1.4, "poison": 1.0, "ground": 0.714, "rock": 1.0, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.4, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "bug": {"normal": 1.0, "fighting": 0.714, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 0.714, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "ghost": {"normal": 0.51, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 1.0}, "steel": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.0, "electric": 0.714, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "fire": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 1.4, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "water": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.4, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.4, "water": 0.714, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "grass": {"normal": 1.0, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.4, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.4, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "electric": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 0.51, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.0, "water": 1.4, "grass": 0.714, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "psychic": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.4, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.0, "dragon": 1.0, "dark": 0.51, "fairy": 1.0}, "ice": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 1.4, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 0.714, "dragon": 1.4, "dark": 1.0, "fairy": 1.0}, "dragon": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.0, "fairy": 0.51}, "dark": {"normal": 1.0, "fighting": 0.714, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 0.714}, "fairy": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.4, "fairy": 1.0}},
	
	WeatherSettings: [
		{'name': 'EXTREME', 'label': "Extreme", 'boostedTypes': []},
		{'name': 'CLEAR', 'label': "Clear", 'boostedTypes': ['grass', 'ground', 'fire']},
		{'name': 'FOG', 'label': "Fog", 'boostedTypes': ['dark', 'ghost']},
		{'name': 'CLOUDY', 'label': "Cloudy", 'boostedTypes': ['fairy', 'fighting', 'poison']},
		{'name': 'PARTLY_CLOUDY', 'label': "Partly Cloudy", 'boostedTypes': ['normal', 'rock']},
		{'name': 'RAINY', 'label': "Rainy", 'boostedTypes': ['water', 'electric', 'bug']},
		{'name': 'SNOW', 'label': "Snow", 'boostedTypes': ['ice', 'steel']},
		{'name': 'WINDY', 'label': "Windy", 'boostedTypes': ['dragon', 'flying', 'psychic']}
	],
		
	
	RaidTierSettings: [
		{"name": "1", "label": "Tier 1", "cpm": 0.6, "HP": 600},
		{"name": "2", "label": "Tier 2", "cpm": 0.67, "HP": 1800},
		{"name": "3", "label": "Tier 3", "cpm": 0.7300000190734863, "HP": 3000},
		{"name": "4", "label": "Tier 4", "cpm": 0.7900000214576721, "HP": 7500},
		{"name": "5", "label": "Tier 5", "cpm": 0.7900000214576721, "HP": 12500},
		{"name": "6", "label": "Tier 6", "cpm": 0.7900000214576721, "HP": 18750}
	],
	
	RaidBosses: [],
	
	Pokemon: [],
	
	PokemonForms: [],
	
	FastMoves: [], 
	
	ChargedMoves: [],
	
	MoveEffects: [],
	
	LevelSettings: [],
	
	IndividualValues: [],
	
	Users: []
	
};


var LocalData = {
	Pokemon: [],
	FastMoves: [],
	ChargedMoves: [],
	BattleParties: [],
	BattleSettings: {},
	QuickStartWizardNoShow: 0,
	PokemonClipboard: 0
};

var Data = JSON.parse(JSON.stringify(DefaultData));


// To be overwritten
if (window['manuallyModifyData'] == undefined){
	manuallyModifyData = function(data){};
}

function parsePokemonTypeFromString(S){
	var L = S.split(",");
	return {
		pokeType1: L[0].trim().toLowerCase(),
		pokeType2: (L[1] || "none").trim().toLowerCase()
	};
}

function parseMovesFromString(S){
	S = S || "";
	var moves = [];
	for (name of S.split(",")){
		name = name.trim();
		if (name.length > 0)
			moves.push(name.toLowerCase());
	}
	return moves;
}

/* 
	Array-based Database Manipulation
*/
function sortDatabase(database){
	database.sort(function(a, b){
		return a.name == b.name ? 0 : (a.name < b.name ? -1 : 1);
	});
	return database;
}

function getEntryIndex(name, database, linearSearch){
	// If entry with the name doesn't exist, return -1
	if (linearSearch){
		for (var i = 0; i < database.length; i++){
			if (database[i].name == name)
				return i;
		}
		return -1;
	}else{
		return binarySearch(name, database, 0, database.length, function(db, idx, matched){
			return matched ? idx : -1;
		});
	}
}

function getEntry(name, database, linearSearch){
	// If entry with the name doesn't exist, return null
	if (linearSearch){
		for (var i = 0; i < database.length; i++){
			if (database[i].name == name)
				return database[i];
		}
		return null;
	}else{
		return binarySearch(name, database, 0, database.length, function(db, idx, matched){
			return matched ? db[idx] : null;
		});
	}
}

function insertEntry(entry, database){
	// If entry with the name already exists, replaces the existing entry
	return binarySearch(entry.name, database, 0, database.length, function(db, idx, matched){
		if (matched)
			db[idx] = entry;
		else
			db.splice(idx, 0, entry);
	});
}

function removeEntry(name, database){
	// Returns the entry to be removed
	// If entry with the name doesn't exist, return null
	return binarySearch(name, database, 0, database.length, function(db, idx, matched){
		if (matched)
			return db.splice(idx, 1)[0];
	});
}

function binarySearch(name, database, start, end, callback){
	if (start == end){
		return callback(database, start, false);
	}
	var mid = Math.floor((start + end)/2);
	if (name == database[mid].name)
		return callback(database, mid, true);
	else if (name < database[mid].name)
		return binarySearch(name, database, start, mid, callback);
	else
		return binarySearch(name, database, mid + 1, end, callback);
}



/*
	Utilities
*/

function getPokemonIcon(kwargs){
	if (kwargs && kwargs.index != undefined){
		return (Data.Pokemon[kwargs.index] || {icon: getPokemonIcon({dex: 0})}).icon;
	}else if (kwargs && kwargs.name != undefined){
		var pkm_form = getEntry(kwargs.name.toLowerCase(), Data.PokemonForms);
		return pkm_form ? pkm_form.icon : '';
	}else if (kwargs && kwargs.dex != undefined){
		var dex = kwargs.dex.toString();
		while (dex.length < 3)
			dex = '0' + dex;
		return "https://pokemongo.gamepress.gg/assets/img/sprites/" + dex + "MS.png?new";
	}else{
		return getPokemonIcon({dex: 0});
	}
}

function getTypeIcon(kwargs){
	let moveDatabase = Data[toTitleCase(kwargs.mtype) + "Moves"];
	if (kwargs && kwargs.index != undefined){
		return (moveDatabase[kwargs.index] || {icon: getTypeIcon({pokeType: 'none'})}).icon;
	}else if (kwargs && kwargs.name != undefined){
		var move = getEntry(kwargs.name.toLowerCase(), moveDatabase);
		return move ? move.icon : '';
	}else if (kwargs && kwargs.pokeType){
		return "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + kwargs.pokeType.toLowerCase() + ".png";
	}else{
		return getTypeIcon({pokeType: 'none'});
	}
}

function getFriendMultiplier(friend){
	for (var i = 0; i < Data.FriendSettings.length; i++){
		if (Data.FriendSettings[i].name == friend){
			return Data.FriendSettings[i].multiplier;
		}
	}
	return 1;
}

function calculateLevelUpCost(startLevel, endLevel){
	var hasStarted = false, hasEnded = false;
	var cost = {
		'stardust': 0,
		'candy': 0
	};
	for (var i = 0; i < Data.LevelSettings.length; i++){
		var levelSetting = Data.LevelSettings[i];
		hasStarted = hasStarted || (levelSetting.name == startLevel);
		hasEnded = hasEnded || (levelSetting.name == endLevel);
		if (hasStarted && !hasEnded){
			cost.stardust += levelSetting.stardust;
			cost.candy += levelSetting.candy;
		}
	}
	return cost;
}

// Returns a new merged database
function mergeDatabase(database1, database2, conflictSolver){
	conflictSolver = conflictSolver || function(e1, e2){ return e2; } // simple overwriting. Pick the "right" one
	
	var mergedDatabase = [];
	var i1 = 0, i2 = 0;
	while (true){
		if (i1 < database1.length && i2 < database2.length){
			if (database1[i1].name < database2[i2].name){
				mergedDatabase.push(database1[i1++]);
			}else if (database1[i1].name > database2[i2].name){
				mergedDatabase.push(database2[i2++]);
			}else{
				mergedDatabase.push(conflictSolver(database1[i1++], database2[i2++]));
			}
		}else if (i1 < database1.length){
			mergedDatabase.push(database1[i1++]);
		}else if (i2 < database2.length){
			mergedDatabase.push(database2[i2++]);
		}else{
			break;
		}
	}
	return mergedDatabase;
}

function mergeMovePools(srcPkm, targetPkm){
	var MovePoolNames = ['fastMoves', 'fastMoves_legacy', 'fastMoves_legacy', 'chargedMoves', 'chargedMoves_legacy', 'chargedMoves_exclusive'];
	var unique_move_names = {'f': [], 'c': []};
	
	MovePoolNames.forEach(function(attr){
		targetPkm[attr].forEach(function(moveName){
			unique_move_names[attr[0]].push(moveName);
		});
	});
	
	MovePoolNames.forEach(function(attr){
		srcPkm[attr].forEach(function(moveName){
			if (!unique_move_names[attr[0]].includes(moveName)){
				targetPkm[attr].push(moveName);
			}
		});
	});
	
	return targetPkm;
}


function handleSpeciesDatabase(pokemonDataBase){
	for (var i = 0; i < pokemonDataBase.length; i++){
		var pkm = pokemonDataBase[i];
		
		delete pkm['index'];
		delete pkm['marker_1'];
		
		// Handle move pools
		pkm.fastMoves = pkm.fastMoves || [];
		pkm.chargedMoves = pkm.chargedMoves || [];
		pkm.fastMoves_legacy = pkm.fastMoves_legacy || [];
		pkm.chargedMoves_legacy = pkm.chargedMoves_legacy || [];
		pkm.fastMoves_exclusive = pkm.fastMoves_exclusive || [];
		pkm.chargedMoves_exclusive = pkm.chargedMoves_exclusive || [];
		
		// Raid markers
		pkm.raidMarker = '';
		for (boss of Data.RaidBosses){
			if (boss.name == pkm.name){
				pkm.raidMarker += boss.tier;
				pkm.raidMarker += (boss.future || boss.legacy || boss.special) ? '' : ' current';
				pkm.raidMarker += boss.future ? ' future' : '';
				pkm.raidMarker += boss.legacy ? ' legacy' : '';
				pkm.raidMarker += boss.special ? ' special' : '';
				break;
			}
		}
	}
}


function parseUserPokebox(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var pkm = {
			name : (data[i].species || data[i].name).toLowerCase(),
			cp: parseInt(data[i].cp),
			level: parseFloat(data[i].level) || 1,
			stmiv: parseInt(data[i].sta || data[i].stmiv) || 0,
			atkiv: parseInt(data[i].atk || data[i].atkiv) || 0,
			defiv: parseInt(data[i].def || data[i].defiv) || 0,
			fmove: (data[i].fast_move || data[i].fmove).toLowerCase(),
			cmove: (data[i].charge_move || data[i].cmove).toLowerCase(),
			nickname : data[i].nickname,
			uid: data[i].uid
		};
		let species = getEntry(pkm.name, Data.Pokemon);
		leftMerge(pkm, species);
		pkm.nid = data[i].nid;
		pkm.label = pkm.nickname;
		box.push(pkm);
	}
	return box;
}

/* End of Helper Functions */


// Get Level Settings
function fetchLevelData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/assets/data/cpm.json?v2', 
		dataType: 'json', 
		success: function(data){
			Data.LevelSettings = [];
			for (var i = 0; i < data.length; i++){
				Data.LevelSettings.push({
					"name": data[i].name,
					"value": parseFloat(data[i].name),
					"cpm": parseFloat(data[i].field_cp_multiplier),
					"stardust": parseInt(data[i].field_stardust_cost),
					"candy": parseInt(data[i].field_candy_cost)
				});
			}
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Get raid boss list
function fetchRaidBossList(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: raidBossListURL, 
		dataType: 'json', 
		success: function(data){
			Data.RaidBosses = [];
			data.forEach(function(bossInfo){
				var parsedBossInfo = {
					name: createElement('div', bossInfo.title).children[0].innerText.toLowerCase(),
					tier: parseInt(createElement('div', bossInfo.tier).children[1].innerText),
					future: (bossInfo.future.toLowerCase() == 'on'),
					legacy: (bossInfo.legacy.toLowerCase() == 'on'),
					special: (bossInfo.special.toLowerCase() == 'on')
				};
				Data.RaidBosses.push(parsedBossInfo);
			});
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Get Pokemon Data
function fetchSpeciesData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: pokemonDataFullURL,
		dataType: 'json', 
		success: function(data){
			Data.Pokemon = [];
			for(var i = 0; i < data.length; i++){
				var pkm = {
					dex: parseInt(data[i].number),
					name: data[i].title_1.toLowerCase().replace("&#039;", "'"),
					pokeType1: parsePokemonTypeFromString(data[i].field_pokemon_type).pokeType1,
					pokeType2: parsePokemonTypeFromString(data[i].field_pokemon_type).pokeType2,
					baseAtk: parseInt(data[i].atk),
					baseDef: parseInt(data[i].def),
					baseStm: parseInt(data[i].sta),
					fastMoves: parseMovesFromString(data[i].field_primary_moves),
					chargedMoves: parseMovesFromString(data[i].field_secondary_moves),
					fastMoves_legacy: parseMovesFromString(data[i].field_legacy_quick_moves),
					chargedMoves_legacy: parseMovesFromString(data[i].field_legacy_charge_moves),
					fastMoves_exclusive: parseMovesFromString(data[i].quick_exclusive_moves),
					chargedMoves_exclusive: parseMovesFromString(data[i].charge_exclusive_moves),
					rating: parseFloat(data[i].rating) || 0,
					raidMarker: '',
					nid: data[i].nid,
					image: data[i].uri,
					icon: getPokemonIcon({dex: data[i].number}),
					label: data[i].title_1.replace("&#039;", "'"),
					evolutions: parseMovesFromString(data[i].field_evolutions),
				};
				Data.Pokemon.push(pkm);
			}
			sortDatabase(Data.Pokemon);
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Get supplement Pokemon form data
function fetchSpeciesFormData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pogo_data_projection.json?v2',
		dataType: 'json', 
		success: function(data){
			Data.PokemonForms = data;
			sortDatabase(Data.PokemonForms);
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Get move data
function fetchMoveData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: moveDataFullURL,
		dataType: 'json', 
		success: function(data){
			Data.FastMoves = [];
			Data.ChargedMoves = [];
			for(var i = 0; i < data.length; i++){
				var move = {
					name: data[i].title.toLowerCase(),
					power: parseInt(data[i].power),
					pokeType: data[i].move_type.toLowerCase(),
					dws: parseFloat(data[i].damage_window.split(' ')[0])*1000 || 0,
					duration: parseFloat(data[i].cooldown)*1000,
					label: toTitleCase(data[i].title),
					icon: getTypeIcon({pokeType: data[i].move_type})
				};
				if (data[i].move_category == "Fast Move"){
					move.moveType = 'fast';
					move.energyDelta = Math.abs(parseInt(data[i].energy_gain));
					Data.FastMoves.push(move);
				}else{
					move.moveType = 'charged';
					move.energyDelta = -Math.abs(parseInt(data[i].energy_cost));
					Data.ChargedMoves.push(move);
				}
			}
			sortDatabase(Data.FastMoves);
			sortDatabase(Data.ChargedMoves);
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Get User Pokemon data
function fetchUserData(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: 'https://pokemongo.gamepress.gg/user-pokemon-json-list?_format=json&new&uid_raw=' + userid,
		dataType: 'json',
		success: function(data){
			for (let pokemon of data){
				pokemon.uid = userid;
			}
			var user = {
				name: userid,
				uid: userid,
				box: data
			};
			insertEntry(user, Data.Users);
		},
		complete: function(){
			oncomplete();
		}
	});
}

// Get user parties
function fetchUserTeamData(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: 'https://pokemongo.gamepress.gg/user-pokemon-team?_format=json&uid=' + userid,
		dataType: 'json',
		success: function(data){
			var user = null;
			for (var i = 0; i < Data.Users.length; i++){
				if (Data.Users[i].uid == userid)
					user = Data.Users[i];
			}
			if (user){
				user.parties = [];
				for (var i = 0; i < data.length; i++){
					var party_raw = data[i];
					var party = {
						name: party_raw.title,
						label: party_raw.title,
						isLocal: false,
						pokemon: []
					};
					var team_nids = party_raw.team_nids.split(',');
					for (var j = 0; j < team_nids.length; j++){
						for (var k = 0; k < user.box.length; k++){
							if (user.box[k].nid == team_nids[j].trim()){
								party.pokemon.push(user.box[k]);
								break;
							}
						}
					}
					user.parties.push(party);
				}
				sortDatabase(user.parties);
			}
		},
		complete: function(){
			oncomplete();
		}
	});
}

// Get local data
function fetchLocalData(){
	if (localStorage){
		if (localStorage.LocalData){ // new
			LocalData = JSON.parse(localStorage.LocalData);
		}else{ // old, deprecated
			if (localStorage.POKEMON_SPECIES_DATA_LOCAL){
				LocalData.Pokemon = sortDatabase(JSON.parse(localStorage.POKEMON_SPECIES_DATA_LOCAL));
				delete localStorage.POKEMON_SPECIES_DATA_LOCAL;
			}
			if (localStorage.FAST_MOVE_DATA_LOCAL){
				LocalData.FastMoves = sortDatabase(JSON.parse(localStorage.FAST_MOVE_DATA_LOCAL));
				delete localStorage.FAST_MOVE_DATA_LOCAL;
			}
			if (localStorage.CHARGED_MOVE_DATA_LOCAL){
				LocalData.ChargedMoves = sortDatabase(JSON.parse(localStorage.CHARGED_MOVE_DATA_LOCAL));
				delete localStorage.CHARGED_MOVE_DATA_LOCAL;
			}
			if (localStorage.BATTLE_SETTINGS_LOCAL){
				LocalData.BattleSettings = JSON.parse(localStorage.BATTLE_SETTINGS_LOCAL);
				delete localStorage.BATTLE_SETTINGS_LOCAL;
			}
			if (localStorage.PARTIES_LOCAL){
				LocalData.BattleParties = [];
				var battleParties = JSON.parse(localStorage.PARTIES_LOCAL);
				for (var name in battleParties){
					var party = battleParties[name];
					party.name = name;
					party.label = name;
					party.isLocal = true;
					insertEntry(party, LocalData.BattleParties);
				}
				delete localStorage.PARTIES_LOCAL;
			}
			if (localStorage.QUICK_START_WIZARD_NO_SHOW){
				LocalData.QuickStartWizardNoShow = JSON.parse(localStorage.QUICK_START_WIZARD_NO_SHOW);
				delete localStorage.QUICK_START_WIZARD_NO_SHOW;
			}
			if (localStorage.CLIPBOARD_LOCAL){
				LocalData.PokemonClipboard = JSON.parse(localStorage.CLIPBOARD_LOCAL);
				delete localStorage.CLIPBOARD_LOCAL;
			}
		}
		// Removing the deprecated "index" attribute
		if (LocalData.PokemonClipboard){
			delete LocalData.PokemonClipboard.index;
			delete LocalData.PokemonClipboard.fmove_index;
			delete LocalData.PokemonClipboard.cmove_index;
		}
		for (let pokemon of LocalData.Pokemon){
			delete pokemon.box_index;
			delete pokemon.index;
		}
		for (let move of LocalData.FastMoves){
			move.moveType = "fast";
			delete move.index;
		}
		for (let move of LocalData.ChargedMoves){
			move.moveType = "charged";
			delete move.index;
		}
		for (let party of LocalData.BattleParties){
			if (party.pokemon_list){
				party.pokemon = party.pokemon_list;
				delete party.pokemon_list;
			}else{
				party.pokemon = party.pokemon || [];
			}
			party.isLocal = true;
			party.label = party.label || party.name;
			for (let pokemon of party.pokemon){
				delete pokemon.index;
				delete pokemon.box_index;
				delete pokemon.fmove_index;
				delete pokemon.cmove_index;
			}
		}
		saveLocalData();
	}
}

// Update local data
function saveLocalData(){
	if (localStorage){
		localStorage.LocalData = JSON.stringify(LocalData);
	}
}


// Get all the data from server
function fetchAll(oncomplete, isInit){
	FETCHED_STATUS = 0;
	
	fetchLevelData();
	
	fetchSpeciesFormData(function(){
		FETCHED_STATUS++;
		fetchAll_then(oncomplete);
	});
	
	var currTime = new Date().getTime();
	$.ajax({ 
		url: "https://gamepress.gg/json-list?_format=json&game_tid=1&" + currTime, 
		dataType: 'json', 
		success: function(data){
			for(var i = 0; i < data.length; i++){
				var curr = data[i];
				if (curr.title == "raid-boss-list-PoGO"){
					raidBossListURL = curr.url;
				}
				if (curr.title == "pokemon-data-full-en-PoGO"){
					pokemonDataFullURL = curr.url;
				}
				if (curr.title == "move-data-full-PoGO"){
					moveDataFullURL = curr.url;
				}
			}
		},
		complete: function(jqXHR, textStatus){
			fetchMoveData(function(){ 
				FETCHED_STATUS++;
				fetchAll_then(oncomplete);
			});
			fetchRaidBossList(function(){
				FETCHED_STATUS++;
				fetchAll_then(oncomplete);
			});
			fetchSpeciesData(function(){
				FETCHED_STATUS++;
				fetchAll_then(oncomplete);
			});
		}
	});
	
	if (isInit && window['userID2'] && userID2 != '0'){
		fetchUserData(userID2, function(){
			FETCHED_STATUS++;
			fetchAll_then(oncomplete);
		}, true);
	}else{
		FETCHED_STATUS++;
	}
}


function fetchAll_then(onfinish){
	if (FETCHED_STATUS == FETCHED_STATUS_PASS){
		handleSpeciesDatabase(Data.Pokemon);
		handleSpeciesDatabase(Data.PokemonForms);
		for (let user of Data.Users){
			user.box = parseUserPokebox(user.box);
			fetchUserTeamData(user.uid);
		}
		manuallyModifyData(Data);
		
		Data.Pokemon = mergeDatabase(Data.Pokemon, LocalData.Pokemon);
		Data.FastMoves = mergeDatabase(Data.FastMoves, LocalData.FastMoves);
		Data.ChargedMoves = mergeDatabase(Data.ChargedMoves, LocalData.ChargedMoves);
		leftMerge(Data.BattleSettings, LocalData.BattleSettings);
		
		for (let pkm of Data.PokemonForms){
			var pkm2 = getEntry(pkm.name, Data.Pokemon);
			if (pkm2){
				pkm2.icon = pkm.icon;
			}else{
				pkm = JSON.parse(JSON.stringify(pkm));
				pkm.fastMoves = [];
				pkm.chargedMoves = [];
				insertEntry(pkm, Data.Pokemon);
			}
		}
		
		if (onfinish)
			onfinish();
	}
}

function populateAll(dataReady){
	dataReady = dataReady || function(){};
	
	for (let weather of Data.WeatherSettings){
		for (let type of weather.boostedTypes){
			Data.TypeEffectiveness[type]['boostedIn'] = weather.name;
		}
	}

	Data.IndividualValues = [];
	for (var i = 0; i < 16; i++){
		Data.IndividualValues.push({value: i});
	}
	
	$(document).ready(function(){
		fetchLocalData(LocalData);
		fetchAll(dataReady, true);
	});
}