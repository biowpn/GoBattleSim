/* GBS_Populate.js */


var FETCHED_STATUS = 0;
var FETCHED_STATUS_PASS = 4;

/* 
 *	PART I(a): GAME DATA
 */
 
const MAX_NUM_POKEMON_PER_PARTY = 6;
const MAX_NUM_PARTIES_PER_PLAYER = 5;
const MAX_NUM_OF_PLAYERS = 20;


var Data = {
	BattleSettings: {
		'sameTypeAttackBonusMultiplier': 1.2, 
		'maximumEnergy': 100, 
		'energyDeltaPerHealthLost': 0.5, 
		'dodgeDurationMs': 500, 
		'swapDurationMs': 1000, 
		'dodgeDamageReductionPercent': 0.75, 
		'weatherAttackBonusMultiplier': 1.2,
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
	},
	
	TypeEffectiveness: {"normal": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.0, "ghost": 0.51, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "fighting": {"normal": 1.4, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 0.51, "steel": 1.4, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.4, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "flying": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "poison": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 0.714, "ground": 0.714, "rock": 0.714, "bug": 1.0, "ghost": 0.714, "steel": 0.51, "fire": 1.0, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "ground": {"normal": 1.0, "fighting": 1.0, "flying": 0.51, "poison": 1.4, "ground": 1.0, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 1.4, "fire": 1.4, "water": 1.0, "grass": 0.714, "electric": 1.4, "psychic": 1.0, "ice": 1.0, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "rock": {"normal": 1.0, "fighting": 0.714, "flying": 1.4, "poison": 1.0, "ground": 0.714, "rock": 1.0, "bug": 1.4, "ghost": 1.0, "steel": 0.714, "fire": 1.4, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.0}, "bug": {"normal": 1.0, "fighting": 0.714, "flying": 0.714, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 0.714, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.4, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 1.4, "fairy": 0.714}, "ghost": {"normal": 0.51, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 1.0}, "steel": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.0, "electric": 0.714, "psychic": 1.0, "ice": 1.4, "dragon": 1.0, "dark": 1.0, "fairy": 1.4}, "fire": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 0.714, "bug": 1.4, "ghost": 1.0, "steel": 1.4, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 1.4, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "water": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.4, "rock": 1.4, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.4, "water": 0.714, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "grass": {"normal": 1.0, "fighting": 1.0, "flying": 0.714, "poison": 0.714, "ground": 1.4, "rock": 1.4, "bug": 0.714, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.4, "grass": 0.714, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "electric": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 0.51, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 1.0, "fire": 1.0, "water": 1.4, "grass": 0.714, "electric": 0.714, "psychic": 1.0, "ice": 1.0, "dragon": 0.714, "dark": 1.0, "fairy": 1.0}, "psychic": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 1.4, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 0.714, "ice": 1.0, "dragon": 1.0, "dark": 0.51, "fairy": 1.0}, "ice": {"normal": 1.0, "fighting": 1.0, "flying": 1.4, "poison": 1.0, "ground": 1.4, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 0.714, "grass": 1.4, "electric": 1.0, "psychic": 1.0, "ice": 0.714, "dragon": 1.4, "dark": 1.0, "fairy": 1.0}, "dragon": {"normal": 1.0, "fighting": 1.0, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.0, "fairy": 0.51}, "dark": {"normal": 1.0, "fighting": 0.714, "flying": 1.0, "poison": 1.0, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.4, "steel": 1.0, "fire": 1.0, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.4, "ice": 1.0, "dragon": 1.0, "dark": 0.714, "fairy": 0.714}, "fairy": {"normal": 1.0, "fighting": 1.4, "flying": 1.0, "poison": 0.714, "ground": 1.0, "rock": 1.0, "bug": 1.0, "ghost": 1.0, "steel": 0.714, "fire": 0.714, "water": 1.0, "grass": 1.0, "electric": 1.0, "psychic": 1.0, "ice": 1.0, "dragon": 1.4, "dark": 1.4, "fairy": 1.0}},
	
	WeatherSettings: [{'name': 'CLEAR', 'boostedTypes': ['grass', 'ground', 'fire']}, {'name': 'FOG', 'boostedTypes': ['dark', 'ghost']}, {'name': 'CLOUDY', 'boostedTypes': ['fairy', 'fighting', 'poison']}, {'name': 'PARTLY_CLOUDY', 'boostedTypes': ['normal', 'rock']}, {'name': 'RAINY', 'boostedTypes': ['water', 'electric', 'bug']}, {'name': 'SNOW', 'boostedTypes': ['ice', 'steel']}, {'name': 'WINDY', 'boostedTypes': ['dragon', 'flying', 'psychic']}, {'name': 'EXTREME', 'boostedTypes': []}],
	
	RaidTierSettings: [
		{"name": "1", "cpm": 0.6, "HP": 600},
		{"name": "2", "cpm": 0.67, "HP": 1800},
		{"name": "3", "cpm": 0.7300000190734863, "HP": 3000},
		{"name": "4", "cpm": 0.7900000214576721, "HP": 7500},
		{"name": "5", "cpm": 0.7900000214576721, "HP": 12500},
	],
	
	RaidBosses: [],
	
	Pokemon: [],
	
	PokemonForms: [],
	
	FastMoves: [], 
	
	ChargedMoves: [],
	
	MoveEffects: [],
	MoveEffectSubroutines: [],
	
	LevelSettings: [],
	
	IndividualValues: [],
	
	Users: [],
	
	Mods: []
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
	var moveNames = [];
	var L = S.split(",");
	for (var i = 0; i < L.length; i++){
		var name = L[i].trim().toLowerCase();
		if (name.length > 0)
			moveNames.push(name);
	}
	return moveNames;
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

function getEntryIndex(name, database){	
	// If entry with the name doesn't exist, return -1
	return _getEntryIndex(name, database, 0, database.length - 1);	
}

function getEntry(name, database){
	// If entry with the name doesn't exist, return null
	return _getEntry(name, database, 0, database.length - 1);	
}

function insertEntry(entry, database){
	// If entry with the name already exists, replaces the existing entry
	_insertEntry(entry, database, 0, database.length - 1);
}

function updateEntry(entry, database){
	// If entry with the name doesn't exist, insert the new entry
	_updateEntry(entry, database, 0, database.length - 1);
}

function removeEntry(name, database){
	// Returns the entry to be removed
	// If entry with the name doesn't exist, return null
	return _removeEntry(name, database, 0, database.length - 1);
}



function _getEntryIndex(name, database, start, end){
	if (start > end){
		return -1;
	}
	var middle = Math.round((start + end)/2);
	if (name == database[middle].name){
		return middle;
	}else if (name < database[middle].name){
		return _getEntryIndex(name, database, start, middle - 1);
	}else{
		return _getEntryIndex(name, database, middle + 1, end);
	}
}

function _getEntry(name, database, start, end){
	if (start > end){
		return null;
	}
	var middle = Math.round((start + end)/2);
	if (name == database[middle].name){
		return database[middle];
	}else if (name < database[middle].name){
		return _getEntry(name, database, start, middle - 1);
	}else{
		return _getEntry(name, database, middle + 1, end);
	}
}

function _insertEntry(entry, database, start, end){
	if (start > end){
		database.splice(start, 0, entry);
		return;
	}
	var middle = Math.round((start + end)/2);
	if (entry.name == database[middle].name){ 
		// Key (name) must be unique. Replace instead
		database[middle] = entry;
	}else if (entry.name < database[middle].name){
		_insertEntry(entry, database, start, middle - 1);
	}else{
		_insertEntry(entry, database, middle + 1, end);
	}
}

function _updateEntry(entry, database, start, end){
	if (start > end){
		database.splice(start, 1, entry);
		return;
	}
	var middle = Math.round((start + end)/2);
	if (entry.name == database[middle].name){
		database[middle] = entry;
	}else if (entry.name < database[middle].name){
		_updateEntry(entry, database, start, middle - 1);
	}else{
		_updateEntry(entry, database, middle + 1, end);
	}
}

function _removeEntry(name, database, start, end){
	if (start > end){
		return null;
	}
	var middle = Math.round((start + end)/2);
	if (name == database[middle].name){
		return database.splice(middle, 1)[0];
	}else if (name < database[middle].name){
		return _removeEntry(name, database, start, middle - 1);
	}else{
		return _removeEntry(name, database, middle + 1, end);
	}
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
		return "https://pokemongo.gamepress.gg/assets/img/sprites/" + dex + "MS.png";
	}else{
		return getPokemonIcon({dex: 0});
	}
}

function getTypeIcon(kwargs){
	var moveDatabaseName = (kwargs.mtype == 'f' ? "FastMoves" : "ChargedMoves");
	if (kwargs && kwargs.index != undefined){
		return (Data[moveDatabaseName][kwargs.index] || {icon: getTypeIcon({pokeType: 'none'})}).icon;
	}else if (kwargs && kwargs.name != undefined){
		var move = getEntry(kwargs.name.toLowerCase(), Data[moveDatabaseName]);
		return move ? move.icon : '';
	}else if (kwargs && kwargs.pokeType){
		return "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + kwargs.pokeType.toLowerCase() + ".png";
	}else{
		return getTypeIcon({pokeType: 'none'});
	}
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
		
		// Handle move pools
		pkm.fastMoves = pkm.fastMoves || [];
		pkm.chargedMoves = pkm.chargedMoves || [];
		pkm.fastMoves_legacy = pkm.fastMoves_legacy || [];
		pkm.chargedMoves_legacy = pkm.chargedMoves_legacy || [];
		pkm.fastMoves_exclusive = pkm.fastMoves_exclusive || [];
		pkm.chargedMoves_exclusive = pkm.chargedMoves_exclusive || [];
		if (pkm.exclusiveMoves){
			pkm.exclusiveMoves.forEach(function(move){
				if (getEntryIndex(move, Data.FastMoves) >= 0)
					pkm.fastMoves_exclusive.push(move);
				else if (getEntryIndex(move, Data.ChargedMoves) >= 0)
					pkm.chargedMoves_exclusive.push(move);
			});
			delete pkm.exclusiveMoves;
		}
		
		// Handle boss markers
		pkm.marker_1 = '';
		for (var j = 0; j < Data.RaidBosses.length; j++){
			var boss = Data.RaidBosses[j];
			if (boss.name == pkm.name){
				pkm.marker_1 += boss.tier;
				pkm.marker_1 += (boss.future || boss.legacy || boss.special) ? '' : ' current';
				pkm.marker_1 += boss.future ? ' future' : '';
				pkm.marker_1 += boss.legacy ? ' legacy' : '';
				pkm.marker_1 += boss.special ? ' special' : '';
				break;
			}
		}
		
	}
}


function parseUserPokebox(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var species_idx = getEntryIndex(data[i].species.toLowerCase(), Data.Pokemon);
		var pkm = {
			species : data[i].species.toLowerCase(),
			cp: parseInt(data[i].cp),
			level: 0,
			stmiv: parseInt(data[i].sta),
			atkiv: parseInt(data[i].atk),
			defiv: parseInt(data[i].def),
			fmove: data[i].fast_move.toLowerCase(),
			fmove_index : getEntryIndex(data[i].fast_move.toLowerCase(), Data.FastMoves),
			cmove: data[i].charge_move.toLowerCase(),
			cmove_index : getEntryIndex(data[i].charge_move.toLowerCase(), Data.ChargedMoves),
			nickname : data[i].nickname,
			nid: data[i].nid
		};
		if (species_idx < 0 || pkm.fmove_index < 0 || pkm.cmove_index < 0){
			console.log("[Error in importing User Pokemon: species/moves not in database]");
			console.log(data[i]);
			continue;
		}
		copyAllInfo(pkm, Data.Pokemon[species_idx]);
		pkm.box_index = i;
		pkm.level = calculateLevelByCP(pkm, pkm.cp);
		box.push(pkm);
	}
	return box;
}

/* End of Helper Functions */


// Get CPM
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


// Get evolution data, # deprecated
function fetchEvolutionData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/data.json?new', 
		dataType: 'json', 
		success: function(data){
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
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/raid-boss-list.json?new', 
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



// Read Pokemon Data
function fetchSpeciesData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pokemon-data-full.json?new',
		dataType: 'json', 
		success: function(data){
			Data.Pokemon = [];
			for(var i = 0; i < data.length; i++){
				var pkm = {
					dex : parseInt(data[i].number),
					box_index : -1,
					name : data[i].title_1.toLowerCase(),
					pokeType1 : parsePokemonTypeFromString(data[i].field_pokemon_type).pokeType1,
					pokeType2 : parsePokemonTypeFromString(data[i].field_pokemon_type).pokeType2,
					baseAtk : parseInt(data[i].atk),
					baseDef : parseInt(data[i].def),
					baseStm : parseInt(data[i].sta),
					fastMoves : parseMovesFromString(data[i].field_primary_moves),
					chargedMoves : parseMovesFromString(data[i].field_secondary_moves),
					fastMoves_legacy : parseMovesFromString(data[i].field_legacy_quick_moves),
					chargedMoves_legacy : parseMovesFromString(data[i].field_legacy_charge_moves),
					exclusiveMoves : parseMovesFromString(data[i].exclusive_moves),
					rating : parseFloat(data[i].rating) || 0,
					marker_1: '',
					image: data[i].uri,
					icon: getPokemonIcon({dex: data[i].number}),
					label: data[i].title_1
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


// Read Extra Pokemon form data
function fetchSpeciesFormData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		// url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pokemon_forms_data.json?new',
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pogo_data_projection.json?new',
		dataType: 'json', 
		success: function(data){
			Data.PokemonForms = [];
			for(var i = 0; i < data.length; i++){
				Data.PokemonForms.push(data[i]);
			}
			sortDatabase(Data.PokemonForms);
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}



// Read move data
function fetchMoveData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/move-data-full.json?new',
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
					move.moveType = 'f';
					move.energyDelta = Math.abs(parseInt(data[i].energy_gain));
					Data.FastMoves.push(move);
				}else{
					move.moveType = 'c';
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

// Import User
function fetchUserData(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: '/user-pokemon-json-list?_format=json&new&uid_raw=' + userid,
		dataType: 'json',
		success: function(data){
			Data.Users.push({
				id: userid,
				box: parseUserPokebox(data)
			});
			fetchUserTeamData(userid);
		},
		complete: function(){
			oncomplete();
		}
	});
}

// Import User Teams
function fetchUserTeamData(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: '/user-pokemon-team?_format=json&uid=' + userid,
		dataType: 'json',
		success: function(data){
			var user = null;
			for (var i = 0; i < Data.Users.length; i++){
				if (Data.Users[i].id == userid)
					user = Data.Users[i];
			}
			if(user){
				user.parties = [];
				for (var i = 0; i < data.length; i++){
					var party_raw = data[i];
					var party = {
						name: party_raw.title,
						pokemon_list: []
					};
					var team_nids = party_raw.team_nids.split(',');
					for (var j = 0; j < team_nids.length; j++){
						for (var k = 0; k < user.box.length; k++){
							if (user.box[k].nid == team_nids[j].trim()){
								party.pokemon_list.push(user.box[k]);
								break;
							}
						}
					}
					user.parties.push(party);
				}
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
					battleParties[name].name = name;
					insertEntry(battleParties[name], LocalData.BattleParties);
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
		delete LocalData.PokemonClipboard.index;
		LocalData.Pokemon.forEach(function(pkm){
			delete pkm.box_index;
			delete pkm.index;
		});
		LocalData.FastMoves.forEach(function(move){
			delete move.index;
		});
		LocalData.ChargedMoves.forEach(function(move){
			delete move.index;
		});
		LocalData.BattleParties.forEach(function(party){
			party.pokemon_list.forEach(function(pkm){
				delete pkm.index;
				delete pkm.box_index;
				delete pkm.fmove_index;
				delete pkm.cmove_index;
			});
		});
		
		saveLocalData();
	}
}

// Save to local data
function saveLocalData(){
	if (localStorage){
		localStorage.LocalData = JSON.stringify(LocalData);
	}
}


// Get all the data from server
function fetchAll(oncomplete){
	FETCHED_STATUS = 0;
	
	fetchLevelData();

	fetchSpeciesData(function(){
		FETCHED_STATUS++;
		fetchAll_then(function(){
			oncomplete();
		});
	});
	
	fetchSpeciesFormData(function(){
		FETCHED_STATUS++;
		fetchAll_then(function(){
			oncomplete();
		});
	});

	fetchMoveData(function(){ 
		FETCHED_STATUS++;
		fetchAll_then(function(){
			oncomplete();
		});
	});
	
	fetchRaidBossList(function(){
		FETCHED_STATUS++;
		fetchAll_then(function(){
			oncomplete();
		});
	});
}


function fetchAll_then(onfinish){
	if (FETCHED_STATUS == FETCHED_STATUS_PASS){
		handleSpeciesDatabase(Data.Pokemon);
		var modifiedCtrl = manuallyModifyData(Data);
		
		Data.Pokemon = mergeDatabase(Data.Pokemon, LocalData.Pokemon);
		Data.FastMoves = mergeDatabase(Data.FastMoves, LocalData.FastMoves);
		Data.ChargedMoves = mergeDatabase(Data.ChargedMoves, LocalData.ChargedMoves);
		
		if (onfinish)
			onfinish();
	}
}

function populateAll(dataReady){
	dataReady = dataReady || function(){};
	
	Data.WeatherSettings.forEach(function(weatherSetting){
		weatherSetting.boostedTypes.forEach(function(type){
			Data.TypeEffectiveness[type]['boostedIn'] = weatherSetting.name;
		});
	});
	Data.IndividualValues = [];
	for (var i = 0; i < 16; i++){
		Data.IndividualValues.push({value: i});
	}
	
	$(document).ready(function(){
		fetchLocalData(LocalData);

		fetchAll(function(){
			var isGamePressStaff = false;
			try{
				if (drupalSettings.ajaxPageState.libraries.includes('admin_toolbar')){
					isGamePressStaff = true;
				}
			}catch(err){
			}
			if (isGamePressStaff){
				console.log('[GamePress Staff Recognized]');
			}
			
			Data.Pokemon.forEach(function(pkm){
				pkm.icon = getPokemonIcon({name: pkm.name}) || pkm.icon;
			});
			
			var mod_tbody = document.getElementById('mod_tbody');
			if (mod_tbody){
				mod_tbody.innerHTML = '';
				for (var i = 0; i < Data.Mods.length; i++){
					mod_tbody.appendChild(createRow([
						Data.Mods[i].name,
						"<input type='checkbox' id='mod_checkbox_" + i + "'>"
					]));
				}
			}
			
			dataReady();
		});
	});
}