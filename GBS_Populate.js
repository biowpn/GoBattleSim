/* GBS_Populate.js */

var USERS_INFO = [];
var PARTIES_LOCAL = {};

var FETCHED_STATUS = 0;
var FETCHED_STATUS_PASS = 4;

var FAST_MOVE_DATA_LOCAL = [];
var CHARGED_MOVE_DATA_LOCAL = [];
var POKEMON_SPECIES_DATA_LOCAL = [];
var RAID_BOSS_LIST = [];
var POKEMON_SPECIES_EVOLUTION_DATA = [];


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

function index_by_name(name, database){
	name = name.toLowerCase();
	for (var i = 0; i < database.length; i++){
		if (name == database[i].name)
			return i;
	}
	return -1;
}

function merge_database(srcDatabase, targetDatabase, conflictSolver){
	conflictSolver = conflictSolver || function(srcObj, targetObj){ return srcObj; } // simple overwriting
	
	for (var i = 0; i < srcDatabase.length; i++){
		if (srcDatabase[i].name == ''){
			srcDatabase.splice(i--, 1);
			continue;
		}
		var idx = index_by_name(srcDatabase[i].name, targetDatabase);
		if (idx >= 0){
			targetDatabase[idx] = conflictSolver(srcDatabase[i], targetDatabase[idx]);
		}else{
			targetDatabase.push(srcDatabase[i]);
		}
	}
	// Re-indexing
	for (var i = 0; i < targetDatabase.length; i++)
		targetDatabase[i].index = i;
}

function pkm_move_pool_merger(srcPkm, targetPkm){
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
		
		// Handle exclusive moves
		pkm.fastMoves_exclusive = [];
		pkm.chargedMoves_exclusive = [];
		if (pkm.exclusiveMoves){
			pkm.exclusiveMoves.forEach(function(move){
				if (index_by_name(move, FAST_MOVE_DATA) >= 0)
					pkm.fastMoves_exclusive.push(move);
				else if (index_by_name(move, CHARGED_MOVE_DATA) >= 0)
					pkm.chargedMoves_exclusive.push(move);
			});
			delete pkm.exclusiveMoves;
		}
		
		// Handle boss markers
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
		
		// Handle Evolution data
		pkm.evolution = [];
		var evolution_indices = POKEMON_SPECIES_EVOLUTION_DATA[i];
		if (evolution_indices){
			for (var j = 0; j < evolution_indices.length; j++){
				var pkm_evolution = POKEMON_SPECIES_DATA[evolution_indices[j]];
				if (pkm_evolution){
					pkm_evolution.pre_evolution = [pkm.name];
					pkm.evolution.push(pkm_evolution.name);
				}
			}
		}
	}
}


function processUserPokeboxRawData(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var pkmRaw = {
			index : index_by_name(data[i].species, POKEMON_SPECIES_DATA),
			species : data[i].species.toLowerCase(),
			cp: parseInt(data[i].cp),
			level: 0,
			stmiv: parseInt(data[i].sta),
			atkiv: parseInt(data[i].atk),
			defiv: parseInt(data[i].def),
			fmove: data[i].fast_move.toLowerCase(),
			fmove_index : index_by_name(data[i].fast_move, FAST_MOVE_DATA),
			cmove: data[i].charge_move.toLowerCase(),
			cmove_index : index_by_name(data[i].charge_move, CHARGED_MOVE_DATA),
			nickname : data[i].nickname,
			nid: data[i].nid
		};
		if (pkmRaw.index < 0 || pkmRaw.fmove_index < 0 || pkmRaw.cmove_index < 0){
			console.log("[Error in importing User Pokemon: species/moves not in database]");
			console.log(data[i]);
			continue;
		}
		copyAllInfo(pkmRaw, POKEMON_SPECIES_DATA[pkmRaw.index]);
		pkmRaw.box_index = i;
		pkmRaw.level = calculateLevelByCP(pkmRaw, pkmRaw.cp);
		box.push(pkmRaw);
	}
	return box;
}

/* End of Helper Functions */


// Get CPM
function loadCPMData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/assets/data/cpm.json?v2', 
		dataType: 'json', 
		success: function(data){
			CPM_TABLE = [];
			for (var i = 0; i < data.length; i++){
				CPM_TABLE.push(parseFloat(data[i].field_cp_multiplier));
			}
		},
		complete: function(jqXHR, textStatus){
			oncomplete();
		}
	});
}


// Get evolution data
function loadEvolutionData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/data.json?v2', 
		dataType: 'json', 
		success: function(data){
			POKEMON_SPECIES_EVOLUTION_DATA = [];
			for (var i = 0; i < data.pokemonData.length; i++){
				POKEMON_SPECIES_EVOLUTION_DATA.push(data.pokemonData[i].EVO || []);
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
			RAID_BOSS_LIST = [];
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
			POKEMON_SPECIES_DATA = [];
			for(var i = 0; i < data.length; i++){
				var pkmData = {
					index: i,
					dex : parseInt(data[i].number),
					value : parseInt(data[i].number),
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
			FAST_MOVE_DATA = [];
			CHARGED_MOVE_DATA = [];
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

// Import User
function loadUser(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: '/user-pokemon-json-list?_format=json&new&uid_raw=' + userid,
		dataType: 'json',
		success: function(data){
			var importedBox = processUserPokeboxRawData(data);
			USERS_INFO.push({id: userid, box: importedBox});
			loadLatestTeams(userid);
		},
		complete: function(){
			oncomplete();
		}
	});
}

// Import User Teams
function loadLatestTeams(userid, oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: '/user-pokemon-team?_format=json&uid=' + userid,
		dataType: 'json',
		success: function(data){
			var user = null;
			for (var i = 0; i < USERS_INFO.length; i++){
				if (USERS_INFO[i].id == userid)
					user = USERS_INFO[i];
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



// Manually Modify Data
function manualModifyData(){
	var fmove_transform = FAST_MOVE_DATA[index_by_name('transform', FAST_MOVE_DATA)];
	if (fmove_transform){
		fmove_transform.effect = {
			name : 'transform',
			remaining : 1
		};
	}
	
	var pokemon_moltres = POKEMON_SPECIES_DATA[index_by_name('moltres', POKEMON_SPECIES_DATA)];
	if (pokemon_moltres){
		pokemon_moltres.fastMoves_legacy = [];
		pokemon_moltres.chargedMoves_legacy = [];
	}
	
	var pokemon_zapdos = POKEMON_SPECIES_DATA[index_by_name('zapdos', POKEMON_SPECIES_DATA)];
	if (pokemon_zapdos){
		pokemon_zapdos.fastMoves_legacy = [];
		pokemon_zapdos.chargedMoves_legacy = [];
	}
	
	var pokemon_kyogre = POKEMON_SPECIES_DATA[index_by_name('kyogre', POKEMON_SPECIES_DATA)];
	if (pokemon_kyogre){
		pokemon_kyogre.fastMoves_legacy = [];
	}
	
}


// Get all the data
function handle_0(oncomplete){
	FETCHED_STATUS = 0;
	
	loadCPMData();
	
	loadEvolutionData(function(){
		FETCHED_STATUS++;
		handle_1(function(){
			oncomplete();
		});
	});
	
	loadLatestPokemonData(function(){
		FETCHED_STATUS++;
		handle_1(function(){
			oncomplete();
		});
	});

	loadLatestMoveData(function(){ 
		FETCHED_STATUS++;
		handle_1(function(){
			oncomplete();
		});
	});
	
	loadRaidBossList(function(){
		FETCHED_STATUS++;
		handle_1(function(){
			oncomplete();
		});
	});
}


function handle_1(onfinish){
	if (FETCHED_STATUS == FETCHED_STATUS_PASS){
		handleSpeciesDatabase(POKEMON_SPECIES_DATA);
		manualModifyData();
		
		merge_database(POKEMON_SPECIES_DATA_LOCAL, POKEMON_SPECIES_DATA);
		merge_database(FAST_MOVE_DATA_LOCAL, FAST_MOVE_DATA);
		merge_database(CHARGED_MOVE_DATA_LOCAL, CHARGED_MOVE_DATA);
		if (localStorage){
			localStorage.POKEMON_SPECIES_DATA_LOCAL = JSON.stringify(POKEMON_SPECIES_DATA_LOCAL);
			localStorage.FAST_MOVE_DATA_LOCAL = JSON.stringify(FAST_MOVE_DATA_LOCAL);
			localStorage.CHARGED_MOVE_DATA_LOCAL = JSON.stringify(CHARGED_MOVE_DATA_LOCAL);
		}
		
		if (onfinish)
			onfinish();
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
	
	var mod_tbody = document.getElementById('mod_tbody');
	if (mod_tbody){
		mod_tbody.innerHTML = '';
		for (var i = 0; i < MOD_LIST.length; i++){
			mod_tbody.appendChild(createRow([
				MOD_LIST[i].name,
				"<input type='checkbox' id='mod_checkbox_" + i + "'>"
			]));
		}
	}
	
	handle_0(function(){
		handle_2();
	});
	
	try{
		if (drupalSettings.ajaxPageState.libraries.includes('admin_toolbar')){
			console.log('[GamePress Staff Recognized]');
		}
	}catch(err){}
});