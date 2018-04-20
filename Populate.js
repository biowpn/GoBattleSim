/* Populate.js */

var USERS_INFO = [];
var PARTIES_LOCAL = {};

var POKEMON_SPECIES_DATA_FETCHED = false;
var RAID_BOSS_LIST_FETCHED = false;
var FAST_MOVE_DATA_FETCHED = false;
var CHARGED_MOVE_DATA_FETCHED = false;

/* user defined data*/
var FAST_MOVE_DATA_LOCAL = [];
var CHARGED_MOVE_DATA_LOCAL = [];
var POKEMON_SPECIES_DATA_LOCAL = [];
var RAID_BOSS_LIST = [];



function getPokemonType1FromString(S){
	var L = S.split(",");
	return L[0].trim().toLowerCase();
}

function getPokemonType2FromString(S){
	var L = S.split(",");
	if (L.length > 1)
		return L[1].trim().toLowerCase();
	else
		return "none";
}

function getMovesFromString(S){
	var res = [];
	var L = S.split(",");
	for (var i = 0; i < L.length; i++){
		var moveName = L[i].trim().toLowerCase();
		if (moveName.length > 0)
			res.push(moveName);
	}
	return res;
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

function handleExclusiveMoves(pokemonDataBase){
	for (var i = 0; i < pokemonDataBase.length; i++){
		var pkm = pokemonDataBase[i];
		pkm.fastMoves_exclusive = [];
		pkm.chargedMoves_exclusive = [];
		if (pkm.exclusiveMoves){
			pkm.exclusiveMoves.forEach(function(move){
				if (get_fmove_index_by_name(move) >= 0)
					pkm.fastMoves_exclusive.push(move);
				else if (get_cmove_index_by_name(move) >= 0)
					pkm.chargedMoves_exclusive.push(move);
			});
			delete pkm.exclusiveMoves;
		}
	}
}

function handleRaidBossMarker(pokemonDataBase){
	for (var i = 0; i < pokemonDataBase.length; i++){
		var pkm = pokemonDataBase[i];
		pkm.marker_1 = '';
		for (var j = 0; j < RAID_BOSS_LIST.length; j++){
			var boss = RAID_BOSS_LIST[j];
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

function processUserPokeboxRawData(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var pkmRaw = {
			index : get_species_index_by_name(data[i].species.toLowerCase()),
			box_index : i,
			species : data[i].species.toLowerCase(),
			cp: parseInt(data[i].cp),
			level: 0,
			stmiv: parseInt(data[i].sta),
			atkiv: parseInt(data[i].atk),
			defiv: parseInt(data[i].def),
			fmove: data[i].fast_move.toLowerCase(),
			fmove_index : get_fmove_index_by_name(data[i].fast_move.toLowerCase()),
			cmove: data[i].charge_move.toLowerCase(),
			cmove_index : get_cmove_index_by_name(data[i].charge_move.toLowerCase()),
			nickname : data[i].nickname
		};
		if (pkmRaw.index < 0 || pkmRaw.fmove_index < 0 || pkmRaw.cmove_index < 0){
			console.log("[Error in importing User Pokemon: species/moves not in database]");
			console.log(data[i]);
			continue;
		}
		copyAllInfo(pkmRaw, POKEMON_SPECIES_DATA[pkmRaw.index]);
		pkmRaw.level = calculateLevelByCP(pkmRaw, pkmRaw.cp);
		box.push(pkmRaw);
	}
	return box;
}

/* End of Helper Functions */

// TODO: Get Type Advantages data


// Get CPM
function loadCPMData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/assets/data/cpm.json?v2', 
		dataType: 'json', 
		success: function(data){
			for (var i = 0; i < data.length; i++){
				CPM_TABLE.push(parseFloat(data[i].field_cp_multiplier));
			}
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}



// Get raid boss list
function loadRaidBossList(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/raid-boss-list.json?v2', 
		dataType: 'json', 
		success: function(data){
			data.forEach(function(bossInfo){
				var parsedBossInfo = {
					name: createElement('div', bossInfo.title).children[0].innerText.toLowerCase(),
					tier: parseInt(createElement('div', bossInfo.tier).children[1].innerText),
					future: (bossInfo.future.toLowerCase() == 'on'),
					legacy: (bossInfo.legacy.toLowerCase() == 'on'),
					special: (bossInfo.special.toLowerCase() == 'on')
				};
				RAID_BOSS_LIST.push(parsedBossInfo);
			});
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}



// Read Pokemon Data
function loadLatestPokemonData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pokemon-data-full.json?v2',
		dataType: 'json', 
		success: function(data){
			for(var i = 0; i < data.length; i++){
				var pkmData = {
					index: i,
					dex : parseInt(data[i].number),
					box_index : -1,
					name : data[i].title_1.toLowerCase(),
					pokeType1 : getPokemonType1FromString(data[i].field_pokemon_type),
					pokeType2 : getPokemonType2FromString(data[i].field_pokemon_type),
					baseAtk : parseInt(data[i].atk),
					baseDef : parseInt(data[i].def),
					baseStm : parseInt(data[i].sta),
					fastMoves : getMovesFromString(data[i].field_primary_moves),
					chargedMoves : getMovesFromString(data[i].field_secondary_moves),
					fastMoves_legacy : getMovesFromString(data[i].field_legacy_quick_moves),
					chargedMoves_legacy : getMovesFromString(data[i].field_legacy_charge_moves),
					exclusiveMoves : getMovesFromString(data[i].exclusive_moves),
					rating : parseFloat(data[i].rating) || 0,
					marker_1: '',
					image: data[i].uri,
					icon: pokemon_icon_url_by_dex(data[i].number),
					label: toTitleCase(data[i].title_1)
				};
				POKEMON_SPECIES_DATA.push(pkmData);
			}
			
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}



// Read move data
function loadLatestMoveData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/move-data-full.json?v2',
		dataType: 'json', 
		success: function(data){
			var fmoveCount = 0, cmoveCount = 0;
			for(var i = 0; i < data.length; i++){
				var move = {
					name: data[i].title.toLowerCase(),
					power: parseInt(data[i].power),
					pokeType: data[i].move_type.toLowerCase(),
					dws: parseFloat(data[i].damage_window.split(' ')[0])*1000 || 0,
					duration: parseFloat(data[i].cooldown)*1000,
					label: toTitleCase(data[i].title),
					icon: poketype_icon_url_by_name(data[i].move_type)
				};
				if (data[i].move_category == "Fast Move"){
					move.index = fmoveCount++;
					move.moveType = 'f';
					move.energyDelta = Math.abs(parseInt(data[i].energy_gain));
					FAST_MOVE_DATA.push(move);
				}else{
					move.index = cmoveCount++;
					move.moveType = 'c';
					move.energyDelta = -Math.abs(parseInt(data[i].energy_cost));
					CHARGED_MOVE_DATA.push(move);
				}
			}
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}

// Read User Pokebox
function loadLatestPokeBox(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: '/user-pokemon-json-list?new&uid_raw=' + userid,
		dataType: 'json',
		success: function(data){
			var importedBox = processUserPokeboxRawData(data);
			USERS_INFO.push({id: userid, box: importedBox});
		},
		complete: function(){
			oncomplete();
		}
	});
}


// Manually Modify Data
function manualModifyData(){
	
	var fmove_transform = FAST_MOVE_DATA[get_fmove_index_by_name('transform')];
	if (fmove_transform){
		fmove_transform.effect = {
			name : 'transform',
			remaining : 1
		};
	}
	
	var cmove_mega_drain = CHARGED_MOVE_DATA[get_cmove_index_by_name('mega drain')];
	if (cmove_mega_drain){
		cmove_mega_drain.effect = {
			name : 'hp_draining',
			multipliers: [0.5],
			remaining: -1
		};
	}
	
	var cmove_giga_drain = CHARGED_MOVE_DATA[get_cmove_index_by_name('giga drain')];
	if (cmove_giga_drain){
		cmove_giga_drain.effect = {
			name : 'hp_draining',
			multipliers: [0.5],
			remaining: -1
		};
	}

	
	var pokemon_moltres = POKEMON_SPECIES_DATA[get_species_index_by_name('moltres')];
	if (pokemon_moltres){
		pokemon_moltres.fastMoves_legacy = [];
		pokemon_moltres.chargedMoves_legacy = [];
	}
	
	var pokemon_zapdos = POKEMON_SPECIES_DATA[get_species_index_by_name('zapdos')];
	if (pokemon_zapdos){
		pokemon_zapdos.fastMoves_legacy = [];
		pokemon_zapdos.chargedMoves_legacy = [];
	}
	
	var pokemon_kyogre = POKEMON_SPECIES_DATA[get_species_index_by_name('kyogre')];
	if (pokemon_kyogre){
		pokemon_kyogre.fastMoves_legacy = [];
	}
	
	var mega_ampharos = {
	  "index": POKEMON_SPECIES_DATA.length,
	  "box_index": -1,
	  "name": "mega ampharos",
	  "pokeType1": "electric",
	  "pokeType2": "dragon",
	  "baseAtk": 294,
	  "baseDef": 206,
	  "baseStm": 180,
	  "fastMoves": [
		"charge beam"
	  ],
	  "chargedMoves": [
		"dragon pulse"
	  ],
	  "fastMoves_legacy": [],
	  "chargedMoves_legacy": [],
	  "rating": 3.5,
	  "marker_1": "",
	  "image": "https://cdn.discordapp.com/attachments/434219048902066205/434219156095762432/181-mega.png",
	  "icon": "https://cdn.discordapp.com/attachments/434219048902066205/434219156095762432/181-mega.png",
	  "label": "Mega Ampharos",
	  "fastMoves_exclusive": [],
	  "chargedMoves_exclusive": []
	};
	POKEMON_SPECIES_DATA.push(mega_ampharos);
}


function handle_1(){
	if (POKEMON_SPECIES_DATA_FETCHED && RAID_BOSS_LIST_FETCHED && FAST_MOVE_DATA_FETCHED && CHARGED_MOVE_DATA_FETCHED){
		handleExclusiveMoves(POKEMON_SPECIES_DATA);
		handleRaidBossMarker(POKEMON_SPECIES_DATA);
		handleExclusiveMoves(POKEMON_SPECIES_DATA_LOCAL);
		manualModifyData();
		
		handle_2();
	}
}


$(document).ready(function(){
	if (localStorage){
		if (localStorage.POKEMON_SPECIES_DATA_LOCAL){
			POKEMON_SPECIES_DATA_LOCAL = JSON.parse(localStorage.POKEMON_SPECIES_DATA_LOCAL);
		}
		if (localStorage.FAST_MOVE_DATA_LOCAL){
			FAST_MOVE_DATA_LOCAL = JSON.parse(localStorage.FAST_MOVE_DATA_LOCAL);
		}
		if (localStorage.CHARGED_MOVE_DATA_LOCAL){
			CHARGED_MOVE_DATA_LOCAL = JSON.parse(localStorage.CHARGED_MOVE_DATA_LOCAL);
		}
		
		if (localStorage.EDITABLE_PARAMETERS_LOCAL){
			var EDITABLE_PARAMETERS = JSON.parse(localStorage.EDITABLE_PARAMETERS_LOCAL);
			for (var param in EDITABLE_PARAMETERS)
				window[param] = EDITABLE_PARAMETERS[param];
		}
		if (localStorage.PARTIES_LOCAL){	
			PARTIES_LOCAL = JSON.parse(localStorage.PARTIES_LOCAL);
		}
	}
	
	loadCPMData();
	
	loadLatestPokemonData(function(){
		POKEMON_SPECIES_DATA_FETCHED = true;

		for (var i = 0; i < POKEMON_SPECIES_DATA_LOCAL.length; i++){
			POKEMON_SPECIES_DATA_LOCAL[i].index = POKEMON_SPECIES_DATA.length;
			POKEMON_SPECIES_DATA.push(POKEMON_SPECIES_DATA_LOCAL[i]);
		}
		if (localStorage){
			localStorage.POKEMON_SPECIES_DATA_LOCAL = JSON.stringify(POKEMON_SPECIES_DATA_LOCAL);
		}
		
		handle_1();
	});

	loadLatestMoveData(function(){ 
		FAST_MOVE_DATA_FETCHED = true; 
		CHARGED_MOVE_DATA_FETCHED = true;

		for (var i = 0; i < FAST_MOVE_DATA_LOCAL.length; i++){
			FAST_MOVE_DATA_LOCAL[i].index = FAST_MOVE_DATA.length;
			FAST_MOVE_DATA.push(FAST_MOVE_DATA_LOCAL[i]);
		}
		for (var i = 0; i < CHARGED_MOVE_DATA_LOCAL.length; i++){
			CHARGED_MOVE_DATA_LOCAL[i].index = CHARGED_MOVE_DATA.length;
			CHARGED_MOVE_DATA.push(CHARGED_MOVE_DATA_LOCAL[i]);
		}
		if (localStorage){
			localStorage.FAST_MOVE_DATA_LOCAL = JSON.stringify(FAST_MOVE_DATA_LOCAL);
			localStorage.CHARGED_MOVE_DATA_LOCAL = JSON.stringify(CHARGED_MOVE_DATA_LOCAL);
		}
		
		handle_1();
	});
	
	loadRaidBossList(function(){
		RAID_BOSS_LIST_FETCHED = true;
		handle_1();
	});
});