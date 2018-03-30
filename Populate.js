/* Helper functions */
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

// Handle Exclusive moves
function handleExclusiveMoves(pokemonDataBase){
	for (var i = 0; i < pokemonDataBase.length; i++){
		var pkm = pokemonDataBase[i];
		if (pkm.exclusiveMoves){
			pkm.fastMoves_exclusive = [];
			pkm.chargedMoves_exclusive = [];
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

function processUserPokeboxRawData(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var species_idx = get_species_index_by_name(data[i].species.toLowerCase());
		if (species_idx >= 0){
			var pkmRaw = {
				index : species_idx,
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
			for (var attr in POKEMON_SPECIES_DATA[species_idx])
				pkmRaw[attr] = POKEMON_SPECIES_DATA[species_idx][attr];
			
			pkmRaw.label = "$" + i + " " + data[i].nickname;
			pkmRaw.level = calculateLevelByCP(pkmRaw, pkmRaw.cp);
			box.push(pkmRaw);
		}
	}
	return box;
}


/* End of Helper Functions */


// TODO: Get CPM data: https://pokemongo.gamepress.gg/assets/data/cpm.json

// TODO: Get Type Advantages data

// Read Pokemon Data
function loadLatestPokemonData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({ 
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/pokemon-data-full.json?new', 
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
					image: data[i].uri,
					icon: pokemon_icon_url_by_dex(data[i].number),
					label: toTitleCase(data[i].title_1)
				};
				POKEMON_SPECIES_DATA.push(pkmData);
			}
			
		},
		complete: function(jqXHR, textStatus){
			handleExclusiveMoves(POKEMON_SPECIES_DATA);
			handleExclusiveMoves(POKEMON_SPECIES_DATA_LOCAL);
			oncomplete();
		}
	});		
}



// Read move data
function loadLatestMoveData(oncomplete){
	oncomplete = oncomplete || function(){return;};
	
	$.ajax({
		url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/move-data-full.json?new', 
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
				}else if (data[i].move_category == "Charge Move"){
					move.index = cmoveCount++;
					move.moveType = 'c';
					move.energyDelta = -Math.abs(parseInt(data[i].energy_cost));
					CHARGED_MOVE_DATA.push(move);
				}else{
					console.log("Ignore:");
					console.log(move);
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
	if (!(POKEMON_SPECIES_DATA_FETCHED && FAST_MOVE_DATA_FETCHED && CHARGED_MOVE_DATA_FETCHED)){
		return;
	}
	CURRENT_USER_BOX_FECTHED = true;
	
	$.ajax({ 
		url: '/user-pokemon-json-list?new&uid_raw=' + userid,
		dataType: 'json',
		success: function(data){
			var importedBox = processUserPokeboxRawData(data);
			USERS_INFO.push({id: userid, box: importedBox});
			udpateUserTable();
			send_feedback("Successfully imported user " + userid + " with " + importedBox.length + " Pokemon", false, 'userEditForm-feedback');
			oncomplete();
		},
		error: function(){
			send_feedback("Failed to import user " + userid, false, 'userEditForm-feedback');
		}
	});
}



$(document).ready(function(){
	if (!POKEMON_SPECIES_DATA_FETCHED){
		loadLatestPokemonData(function(){
			POKEMON_SPECIES_DATA_FETCHED = true;
			
			for (var i = 0; i < POKEMON_SPECIES_DATA_LOCAL.length; i++){
				POKEMON_SPECIES_DATA_LOCAL[i].index = POKEMON_SPECIES_DATA.length + i;
				POKEMON_SPECIES_DATA.push(POKEMON_SPECIES_DATA_LOCAL[i]);
			}
			
			if (typeof userID2 != 'underfined' && userID2 && !CURRENT_USER_BOX_FECTHED){
				loadLatestPokeBox(userID2, function(){
					udpateUserTable();
				});
			}
			
			if (!WRITTEN_USER_INPUT_FROM_INIT_URL){
				if (window.location.href.includes('?'))
					writeUserInput(uriToJSON(window.location.href.split('?')[1]));
				WRITTEN_USER_INPUT_FROM_INIT_URL = true;
			}
		});
	}

	if (!(FAST_MOVE_DATA_FETCHED && CHARGED_MOVE_DATA_FETCHED)){
		loadLatestMoveData(function(){ 
			FAST_MOVE_DATA_FETCHED = true; 
			CHARGED_MOVE_DATA_FETCHED = true;
			
			for (var i = 0; i < FAST_MOVE_DATA_LOCAL.length; i++){
				FAST_MOVE_DATA_LOCAL[i].index = FAST_MOVE_DATA.length + i;
				FAST_MOVE_DATA.push(FAST_MOVE_DATA_LOCAL[i]);
			}
			for (var i = 0; i < CHARGED_MOVE_DATA_LOCAL.length; i++){
				CHARGED_MOVE_DATA_LOCAL[i].index = CHARGED_MOVE_DATA.length + i;
				CHARGED_MOVE_DATA.push(CHARGED_MOVE_DATA_LOCAL[i]);
			}
			
			if (typeof userID2 != 'underfined' && userID2 && !CURRENT_USER_BOX_FECTHED){
				loadLatestPokeBox(userID2, function(){
					udpateUserTable();
				});
			}
			
			if (!WRITTEN_USER_INPUT_FROM_INIT_URL){
				if (window.location.href.includes('?'))
					writeUserInput(uriToJSON(window.location.href.split('?')[1]));
				WRITTEN_USER_INPUT_FROM_INIT_URL = true;
			}
		});
	}
});