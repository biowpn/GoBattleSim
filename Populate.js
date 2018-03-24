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

function processUserPokeboxRawData(data){
	var box = [];
	for (var i = 0; i < data.length; i++){
		var species_idx = get_species_index_by_name(data[i].species.toLowerCase());
		if (species_idx >= 0){
			var pkmRaw = {
				index : species_idx,
				species : data[i].species.toLowerCase(),
				copies: 1,
				cp: parseInt(data[i].cp),
				level: 0,
				stmiv: parseInt(data[i].sta),
				atkiv: parseInt(data[i].atk),
				defiv: parseInt(data[i].def),
				fmove: data[i].fast_move.toLowerCase(),
				fmove_index : get_fmove_index_by_name(data[i].fast_move.toLowerCase()),
				cmove: data[i].charge_move.toLowerCase(),
				cmove_index : get_cmove_index_by_name(data[i].charge_move.toLowerCase()),
				dodge: 0,
				nickname : data[i].nickname
			};
			for (var attr in POKEMON_SPECIES_DATA[species_idx])
				pkmRaw[attr] = POKEMON_SPECIES_DATA[species_idx][attr];
			
			pkmRaw.level = calculateLevelByCP(pkmRaw, pkmRaw.cp);
			box.push(pkmRaw);
		}
	}
	return box;
}


function populateAll(){
	if (POKEMON_SPECIES_DATA_FETCHED && MOVE_DATA_FETCHED && USER_POKEBOX_FETCHED){
		for (var i = 0; i < POKEMON_SPECIES_DATA.length; i++){
			var pkm = POKEMON_SPECIES_DATA[i];
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
		autocompleteMoveEditForm();
		autocompletePokemonEditForm();
		udpateUserTable();
		
		addPlayerNode();
		document.getElementById("ui-defenderinputbody").innerHTML = "";
		document.getElementById("ui-defenderinputbody").appendChild(createDefenderNode());
		autocompletePokemonNode('d');
		document.getElementById("simPerConfig").value = 1;
		
		if (window.location.href.includes('?'))
			writeUserInputFromUrl(window.location.href);
	}
}
/* End of Helper Functions */

var POKEMON_SPECIES_DATA_FETCHED = false;
var MOVE_DATA_FETCHED = false;
var USER_POKEBOX_FETCHED = false;


// TODO: Get CPM data: https://pokemongo.gamepress.gg/assets/data/cpm.json

// Read Pokemon Data
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
			if (pkmData.rating >= 2.5)
				RELEVANT_ATTACKERS_INDICES.push(i);

			POKEMON_SPECIES_DATA.push(pkmData);
		}
		POKEMON_SPECIES_DATA_FETCHED = true;
	},
	complete: function(jqXHR, textStatus){
		populateAll();
	}
});		
		

// Read move data
$.ajax({
	url: 'https://pokemongo.gamepress.gg/sites/pokemongo/files/pogo-jsons/move-data-full.json?new', 
	dataType: 'json', 
	success: function(data){
		for(var i = 0; i < data.length; i++){
			if (data[i].move_category == "Fast Move"){
				var move = {
					name: data[i].title.toLowerCase(),
					moveType: "f",
					power: parseInt(data[i].power),
					pokeType: data[i].move_type.toLowerCase(),
					energyDelta: Math.abs(parseInt(data[i].energy_gain)),
					dws: parseFloat(data[i].damage_window.split(' ')[0])*1000 || 0,
					duration: parseFloat(data[i].cooldown)*1000,
					pokeTypeIcon: poketype_icon_url_by_name(data[i].move_type)
				};
				FAST_MOVE_DATA.push(move);
			}else if (data[i].move_category == "Charge Move"){
				var move = {
					name: data[i].title.toLowerCase(),
					moveType: "c",
					power: parseInt(data[i].power),
					pokeType: data[i].move_type.toLowerCase(),
					energyDelta: -Math.abs(parseInt(data[i].energy_cost)),
					dws: parseFloat(data[i].damage_window.split(' ')[0])*1000,
					duration: parseFloat(data[i].cooldown)*1000,
					pokeTypeIcon: poketype_icon_url_by_name(data[i].move_type)
				};
				CHARGED_MOVE_DATA.push(move);
			}else{
				console.log("Unrecogized move type:");
				console.log(data[i]);
			}
		}
		MOVE_DATA_FETCHED = true;
	},
	complete: function(jqXHR, textStatus){
		populateAll();
	}
});

	
// Read User Pokebox
$(document).ready(function(){
	if(typeof userID2 == 'undefined'){
		USER_POKEBOX_FETCHED = true;
		populateAll();
	}else if(userID2){
		$.ajax({
			url: '/user-pokemon-json-list?new&uid_raw=' + userID2,
			dataType: 'json',
			success: function(data){
				USERS_INFO.push({id: userID2, box: processUserPokeboxRawData(data)});
				USER_POKEBOX_FETCHED = true;
			},
			complete: function(jqXHR, textStatus){
				populateAll();
			}
		});
	}else{
		USER_POKEBOX_FETCHED = true;
		populateAll();
	}
});