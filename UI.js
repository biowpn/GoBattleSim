/* 
 * GLOBAL VARIABLES 
 */

// Storing user's Pokebox
var USER_POKEBOX = [];

// Pre-defined collections of Pokemon
var BEST_ATTACKERS_BY_TYPE_INDICES = [211, 247, 383, 242, 281, 67, 145, 243, 93, 102, 382, 143, 142, 88, 149, 75, 375, 381];
var TIER1_BOSSES_CURRENT_INDICES = [128, 319, 332, 360];
var TIER2_BOSSES_CURRENT_INDICES = [86, 90, 301, 302];
var TIER3_BOSSES_CURRENT_INDICES = [67, 123, 183, 220];
var TIER4_BOSSES_CURRENT_INDICES = [130, 142, 159, 247, 305, 358];
var TIER5_BOSSES_CURRENT_INDICES = [149, 383];

// To be populated dynamically
var RELEVANT_ATTACKERS_INDICES = [];
var POKEMON_BY_TYPE_INDICES = {};

// For auto complete
var POKEMON_SPECIES_OPTIONS = [];
var FAST_MOVES_OPTIONS = [];
var CHARGED_MOVE_OPTIONS = [];

const MAX_QUEUE_SIZE = 65536;
const MAX_SIM_PER_CONFIG = 1024;
const DEFAULT_SUMMARY_TABLE_METRICS = ['battle_result','duration','dfdr_HP_lost_percent','total_deaths'];
const DEFAULT_SUMMARY_TABLE_HEADERS = ['Outcome','Time','Progress','#Death'];

var simQueue = []; // Batch individual sims configurations here
var simResults = []; // This is used to store all sims
var atkrCopyPasteClipboard = null;

var enumPlayerStart = 0;
var enumPartyStart = 0;
var enumPokemonStart = 0;
var enumDefender = 0;

var MasterSummaryTableMetrics = [];
var MasterSummaryTableHeaders = {};
var MasterSummaryTableMetricsFilterOrder = [];



/* 
 * UI CORE FUNCTIONS 
 */

function initMasterSummaryTableMetrics(){
	MasterSummaryTableMetrics = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_METRICS));
	MasterSummaryTableHeaders = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_HEADERS));
	enumPlayerStart = 0;
	enumPartyStart = 0;
	enumPokemonStart = 0;
	enumDefender = 0;
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics.push(metric);
	MasterSummaryTableHeaders.push(nameDisplayed || metric);
}


function createElement(type, innerHTML){
	var e = document.createElement(type);
	e.innerHTML = innerHTML;
	return e;
}

function createRow(rowData, type){
	type = type || "td";
	var row = document.createElement("tr");
	for (var i = 0; i < rowData.length; i++){
		var d = document.createElement(type);
		d.innerHTML = rowData[i];
		row.appendChild(d);
	}
	return row;
}

function jsonToURI(json){ return encodeURIComponent(JSON.stringify(json)); }

function uriToJSON(urijson){ return JSON.parse(decodeURIComponent(urijson)); }

function exportConfigToUrl(cfg){
	// var cfg_min = JSON.parse(JSON.stringify(cfg));
	var cfg_min = {
		atkrSettings: [],
		dfdrSettings: {},
		generalSettings: cfg.generalSettings
	};
	for (var i = 0; i < cfg.atkrSettings.length; i++){
		cfg_min.atkrSettings.push({
			party_list: []
		});
		for (var j = 0; j < cfg.atkrSettings[i].party_list.length; j++){
			cfg_min.atkrSettings[i].party_list.push({
				revive_strategy : cfg.atkrSettings[i].party_list[j].revive_strategy,
				pokemon_list : []
			});
			for (var k = 0; k < cfg.atkrSettings[i].party_list[j].pokemon_list.length; k++){
				var pkm_min = {};
				copyAllInfo(pkm_min, cfg.atkrSettings[i].party_list[j].pokemon_list[k], true);
				cfg_min.atkrSettings[i].party_list[j].pokemon_list.push(pkm_min);
			}
		}
	}
	copyAllInfo(cfg_min.dfdrSettings, cfg.dfdrSettings, true);
	
	return jsonToURI(cfg_min);
}


function writeUserInputFromUrl(url){
	if (url.includes('?')){
		var userInput = uriToJSON(url.split('?')[1]);
		writeUserInput(userInput);
	}
}


function createAttackerNode(){
	var pokemonNode = document.createElement("div");
	pokemonNode.appendChild(document.createElement("div")); // head, contain the label of this Pokemon
	pokemonNode.appendChild(document.createElement("div")); // body, contain species/moves/etc configurations
	pokemonNode.appendChild(document.createElement("div")); // tail, contain controls
	
	// 1. Head
	pokemonNode.children[0].innerHTML = "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>";

	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=75%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['',''],'td'));
	tb1.children[1].children[0].innerHTML = "<input type='text' placeholder='Species'>";
	tb1.children[1].children[1].innerHTML = "<input type='number' placeholder='Copies' min='1' max='6'>";
	tb1.children[1].children[1].children[0].value = 1;
	tb1.children[1].children[1].children[0].onchange = function(){
		var addrIndices = this.id.split('-');
		var pokemonCount = countPokemonFromParty(addrIndices[2] + '-' + addrIndices[3]);
		if (pokemonCount > MAX_NUM_POKEMON_PER_PARTY){
			this.value -= pokemonCount - MAX_NUM_POKEMON_PER_PARTY;
		}
		if (this.value < 1)
			this.value = 1;
	}
	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>");
	tb2.appendChild(createRow(['','','',''],'td'));
	tb2.children[1].children[0].innerHTML = "<input placeholder='Level'>";
	tb2.children[1].children[1].innerHTML = "<input placeholder='HP. IV'>";
	tb2.children[1].children[2].innerHTML = "<input placeholder='Atk. IV'>";
	tb2.children[1].children[3].innerHTML = "<input placeholder='Def. IV'>";

	var tb3 = createElement("table", "<colgroup><col width=35%><col width=35%><col width=30%></colgroup>");
	tb3.appendChild(createRow(['','',''],'td'));
	tb3.children[1].children[0].innerHTML = "<input type='text' placeholder='Fast Move'>";
	tb3.children[1].children[1].innerHTML = "<input type='text' placeholder='Charged Move'>";
	tb3.children[1].children[2].innerHTML = "<select><option value='0'>No Dodge</option><option value='1'>Dodge Charged</option><option value='2'>Dodge All</option></select></td>";
	
	pokemonNode.children[1].appendChild(tb1);
	pokemonNode.children[1].appendChild(tb2);
	pokemonNode.children[1].appendChild(tb3);
	
	// 3. Tail
	pokemonNode.children[2].style = 'width:100%';
	var copyPokemonButton = createElement("button", "Copy");
	copyPokemonButton.style = 'width:25%';
	copyPokemonButton.onclick = function(){
		var pokemonNodeToCopyFrom = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		atkrCopyPasteClipboard = parseAttackerNode(pokemonNodeToCopyFrom);
	}
	var pastePokemonButton = createElement("button", "Paste");
	pastePokemonButton.style = 'width:25%';
	pastePokemonButton.onclick = function(){
		var pokemonNodeToPasteTo = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		writeAttackerNode(pokemonNodeToPasteTo, atkrCopyPasteClipboard);
	}
	var removePokemonButton = createElement("button", "Remove Pokemon");
	removePokemonButton.style = 'width:50%';
	removePokemonButton.onclick = function(){
var pokemonNodeToRemove = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
if (pokemonNodeToRemove.parentNode.children.length > 1){
			pokemonNodeToRemove.parentNode.removeChild(pokemonNodeToRemove);
			relabelAll();
		}else{
			send_feedback("Cannot remove the only Pokemon of the party.");
		}
	}
	pokemonNode.children[2].appendChild(copyPokemonButton);
	pokemonNode.children[2].appendChild(pastePokemonButton);
	pokemonNode.children[2].appendChild(removePokemonButton);
	
	return pokemonNode;
}

function createPartyNode(){
	var partyNode = document.createElement("div");
	partyNode.appendChild(document.createElement("div")); // head, contain the label of this Party
	partyNode.appendChild(document.createElement("div")); // body, contain Pokemon Nodes
	partyNode.appendChild(document.createElement("div")); // tail, contain controls
	
	// 1. Head
	partyNode.children[0].innerHTML = "<h4>Unlabeled Party</h4>";
	
	// 2. Body
	partyNode.children[1].appendChild(createAttackerNode());
	
	// 3. Tail
	partyNode.children[2].style = "width:100%";
	partyNode.children[2].innerHTML = "<label style='width:25%'>Max Revive<input type='checkbox'></label>";
	
	var addPokemonButton = createElement("button", "Add Pokemon");
	addPokemonButton.style = "width:50%";
	addPokemonButton.onclick = function(){
		if (countPokemonFromParty(this.id.split(':')[1]) < MAX_NUM_POKEMON_PER_PARTY){
			var partyNodeToAddPokemon = document.getElementById('ui-party-' + this.id.split(':')[1]);
			partyNodeToAddPokemon.children[1].appendChild(createAttackerNode());
			relabelAll();
		}else{
			send_feedback("Exceeding Maximum number of Pokemon per party.");
		}
	}
	var removePartyButton = createElement("button", "Remove Party");
	removePartyButton.style = "width:25%";
	removePartyButton.onclick = function(){
		var partyNodeToRemove = document.getElementById('ui-party-' + this.id.split(':')[1]);
		if (partyNodeToRemove.parentNode.children.length > 1){
			partyNodeToRemove.parentNode.removeChild(partyNodeToRemove);
			relabelAll();
		}else{
			send_feedback("Cannot remove the only party of the player.");
		}
	}
	partyNode.children[2].appendChild(addPokemonButton);
	partyNode.children[2].appendChild(removePartyButton);
	
	return partyNode;
}

function createPlayerNode(){
	var playerNode = document.createElement("div");
	playerNode.appendChild(document.createElement("div")); // head, contain the label of this Player
	playerNode.appendChild(document.createElement("div")); // body, contain Party Nodes
	playerNode.appendChild(document.createElement("div")); // tail, contain controls
	
	// 1. Head
	playerNode.children[0].innerHTML = "<h3>Unlabeled Player</h3>";
	
	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	
	// 3. Tail
	playerNode.children[2].style = "width:100%";

	
	var addPartyButton = createElement("button", "Add Party");
	addPartyButton.style = "width:50%";
	addPartyButton.onclick = function(){
		var playerNodeToAddPartyTo = document.getElementById('ui-player-' + this.id.split(':')[1]);
		if(playerNodeToAddPartyTo.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER){
				playerNodeToAddPartyTo.children[1].appendChild(createPartyNode());
				relabelAll();
		}else{
			send_feedback("Exceeding Maximum number of Parties per player.");
		}
	}
	var removePlayerButton = createElement("button", "Remove Player");
	removePlayerButton.style = "width:50%";
	removePlayerButton.onclick = function(){
		if (document.getElementById('ui-attackerinputbody').children.length > 1){
			var playerNodeToRemove = document.getElementById('ui-player-' + this.id.split(':')[1]);
			playerNodeToRemove.parentNode.removeChild(playerNodeToRemove);
			relabelAll();
			document.getElementById('ui-addplayerbutton').disabled = false;
		}else{
			send_feedback("Cannot remove the only player");
		}
	}
	playerNode.children[2].appendChild(addPartyButton);
	playerNode.children[2].appendChild(removePlayerButton);
	
	return playerNode;
}

function addPlayerNode(){
var attackerFieldBody = document.getElementById("AttackerInput").children[1];
	if (attackerFieldBody.children.length < MAX_NUM_OF_PLAYERS){
		attackerFieldBody.appendChild(createPlayerNode());
		relabelAll();
	}else{
		document.getElementById('ui-addplayerbutton').setAttribute('disabled', true);
		send_feedback('Exceeding maximum number of players.');
	}
}

function relabelAll(){
	var playerNodes = document.getElementById("ui-attackerinputbody").children;
	for (var i = 0; i < playerNodes.length; i++){
		var playerNode = playerNodes[i];
		playerNode.id = 'ui-player-' + i;
		
		playerNode.children[0].children[0].innerHTML = "Player " + (i+1);
		
		playerNode.children[1].id = 'ui-playerbody-' + i;
		var partyNodes = playerNode.children[1].children;
		for (var j = 0; j < partyNodes.length; j++){
			var partyNode = partyNodes[j];
			partyNode.id = 'ui-party-' + i + '-' + j;
			
			partyNode.children[0].children[0].innerHTML = "Party " + (j+1);
			
			partyNode.children[1].id = 'ui-partybody-' + i + '-' + j;
			var pokemonNodes = partyNode.children[1].children;
			for (var k = 0; k < pokemonNodes.length; k++){
				var pokemonNode = pokemonNodes[k];
				pokemonNode.id = 'ui-pokemon-' + i + '-' + j + '-' + k;
				
				var tables = pokemonNode.children[1].children;
				tables[0].children[1].children[0].children[0].id = 'ui-species-' + i + '-' + j + '-' + k;
				tables[0].children[1].children[1].children[0].id = 'ui-copies-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[0].children[0].id = 'ui-fmove-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[1].children[0].id = 'ui-cmove-' + i + '-' + j + '-' + k;
				
				pokemonNode.children[2].id = 'ui-pokemontail-' + i + '-' + j + '-' + k;
				pokemonNode.children[2].children[0].id = 'copy_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[2].children[1].id = 'paste_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[2].children[2].id = 'remove_pokemon:' + i + '-' + j + '-' + k;
				$( '#ui-pokemontail-' + i + '-' + j + '-' + k ).controlgroup();
				
				
				autocompletePokemonNode(i + '-' + j + '-' + k);
				
			}
			$( '#ui-partybody-' + i + '-' + j ).sortable({axis: 'y'});
			
			partyNode.children[2].id = 'ui-partytail-' + i + '-' + j;
			
			partyNode.children[2].children[0]['id'] = 'revive_strategy_label:' + i + '-' + j;
			partyNode.children[2].children[0].id = 'revive_strategy:' + i + '-' + j;
			partyNode.children[2].children[1].id = 'add_pokemon:' + i + '-' + j;
			partyNode.children[2].children[2].id = 'remove_party:' + i + '-' + j;
			
			$( '#ui-partytail-' + i + '-' + j ).controlgroup();
		}
		$( '#ui-playerbody-' + i ).sortable({axis: 'y'});
		
		playerNode.children[2].id = "ui-playertail-" + i;
		playerNode.children[2].children[0].id = "add_party:" + i;
		playerNode.children[2].children[1].id = "remove_player:" + i;
		$( '#ui-playertail-' + i ).controlgroup();
	}
	$( '#ui-attackerinputbody' ).sortable({axis: 'y'});
	
}


function createDefenderNode(){
	var defenderNode = document.createElement("div");
	defenderNode.id = 'ui-pokemon-d';
	defenderNode.appendChild(document.createElement("div")); // head, contain the label of this Player
	defenderNode.appendChild(document.createElement("div")); // body, contain Party Nodes
	defenderNode.appendChild(document.createElement("div")); // tail, contain controls
	
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb1.appendChild(createRow(['']));
	tb1.children[1].children[0].innerHTML = "<input type='text' placeholder='Species' id='ui-species-d'>";

	// By default, set to raid mode input
	var tb2 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb2.appendChild(createRow(['']));
	tb2.children[1].children[0].innerHTML = "Raid Tier";
	var raidSelection = document.createElement("select");
	raidSelection.id = "raidTier";
	for (var i = 1; i <= 5; i++){
		var option = createElement("option", i);
		option.value = i;
		raidSelection.appendChild(option);
	}
	tb2.children[1].children[0].appendChild(raidSelection);
	
	
	var tb3 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb3.appendChild(createRow(['','']));
	tb3.children[1].children[0].innerHTML = "<input type='text' placeholder='Fast Move' id='ui-fmove-d'>";
	tb3.children[1].children[1].innerHTML = "<input type='text' placeholder='Charged Move' id='ui-cmove-d'>";
	
	defenderNode.children[1].appendChild(tb1);
	defenderNode.children[1].appendChild(tb2);
	defenderNode.children[1].appendChild(tb3);
	
	// 3. Tail
	// Nothing
	
	return defenderNode;
}

function updateDefenderNode(){
	var defenderNode = document.getElementById("DefenderInput").children[1].children[0];
	
	var mode = document.getElementById("battleMode").value;
	var tb2 = defenderNode.children[1].children[1];
	tb2.innerHTML = "";
	
	if (mode == "gym"){
		tb2.innerHTML = "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>";
		tb2.appendChild(createRow(['','','','']));
		tb2.children[1].children[0].innerHTML = "<input placeholder='Level'>";
		tb2.children[1].children[1].innerHTML = "<input placeholder='HP. IV'>";
		tb2.children[1].children[2].innerHTML = "<input placeholder='Atk. IV'>";
		tb2.children[1].children[3].innerHTML = "<input placeholder='Def. IV'>";
	}else if (mode == "raid"){
		tb2.innerHTML = "<colgroup><col width=100%></colgroup>";
		tb2.appendChild(createRow(['']));
		tb2.children[1].children[0].innerHTML = "Raid Tier";
		var raidSelection = document.createElement("select");
		raidSelection.id = "raidTier";
		for (var i = 1; i <= 5; i++){
			var option = createElement("option", i);
			option.value = i;
			raidSelection.appendChild(option);
		}
		tb2.children[1].children[0].appendChild(raidSelection);
	}
}


function autocompletePokemonNode(address){

	const address_const = address;
	$( '#ui-species-' + address ).autocomplete({
		minLength : 0,
		delay : 0,
		source : POKEMON_SPECIES_OPTIONS,
		select : function(event, ui) {
			this.value = ui.item.value;
			var inputStr = this.value.trim();
			var species_idx = get_species_index_by_name(inputStr);
			var thisPokemonNode = document.getElementById('ui-pokemon-' + address_const);
			if (inputStr[0] == '$'){
				var box_idx = parseInt(this.value.slice(1).split(' ')[0]);
				species_idx = get_species_index_by_name(USER_POKEBOX[box_idx].species);
				if (address_const != 'd')
					writeAttackerNode(thisPokemonNode, USER_POKEBOX[box_idx]);
				else
					writeDefenderNode(thisPokemonNode, USER_POKEBOX[box_idx]);
			}
			thisPokemonNode.children[0].innerHTML = pokemon_img_by_id(POKEMON_SPECIES_DATA[species_idx].dex);
			autocompletePokemonNodeMoves(address_const, species_idx);
		},
		change : function(event, ui){
			var inputStr = this.value.trim();
			var species_idx = get_species_index_by_name(inputStr);
			if (get_species_index_by_name(inputStr) >= 0)
				return;
			if (inputStr[0] == '$'){
				var box_idx = parseInt(this.value.slice(1).split(' ')[0]);
				if (box_idx >= 0 && box_idx <= USER_POKEBOX.length)
					species_idx = get_species_index_by_name(USER_POKEBOX[box_idx].species);
			}
			if (species_idx < 0){
				var thisPokemonNode = document.getElementById('ui-pokemon-' + address_const);
				thisPokemonNode.children[0].innerHTML = "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>";
				autocompletePokemonNodeMoves(address_const, -1);
			}
		}
	});
	
	$( '#ui-species-' + address ).bind("focus", function(){$(this).autocomplete("search", "");});
	autocompletePokemonNodeMoves(address_const, -1);
}

function countPokemonFromParty(partyAddress){
	var partyNodeBody = document.getElementById('ui-partybody-' + partyAddress);
	var count = 0;
	for (var i = 0; i < partyNodeBody.children.length; i++){
		count += parseInt(document.getElementById('ui-copies-' + partyAddress + '-' + i).value) || 0;
	}
	return count;
}

function autocompletePokemonNodeMoves(address, species_idx){
	if (species_idx >= 0){
		$( '#ui-fmove-' + address ).autocomplete({
			minLength : 0,
			delay : 0,
			source: POKEMON_SPECIES_DATA[species_idx].fastMoves.concat(POKEMON_SPECIES_DATA[species_idx].fastMoves_legacy)
		});
		$( '#ui-cmove-' + address ).autocomplete({
			minLength : 0,
			delay : 0,
			source: POKEMON_SPECIES_DATA[species_idx].chargedMoves.concat(POKEMON_SPECIES_DATA[species_idx].chargedMoves_legacy)
		});
	}else{
		$( '#ui-fmove-' + address ).autocomplete({
			minLength : 0,
			delay : 0,
			source: FAST_MOVES_OPTIONS
		});
		$( '#ui-cmove-' + address ).autocomplete({
			minLength : 0,
			delay : 0,
			source: CHARGED_MOVE_OPTIONS
		});
	}
	$( '#ui-fmove-' + address ).bind("focus", function(){$(this).autocomplete("search", "");});
	$( '#ui-cmove-' + address ).bind("focus", function(){$(this).autocomplete("search", "");});
}



function parseAttackerNode(node){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	var box_idx = -1;
	var nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$')
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
	
	var pkm_cfg = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		nickname : box_idx >= 0 ? USER_POKEBOX[box_idx].nickname : "",
		species: box_idx >= 0 ? USER_POKEBOX[box_idx].species : (nameInputValue || '*'),
		copies: parseInt(row1.children[1].children[0].value) || 1,
		level: row2.children[0].children[0].value.trim(),
		stmiv: row2.children[1].children[0].value.trim(),
		atkiv: row2.children[2].children[0].value.trim(),
		defiv: row2.children[3].children[0].value.trim(),
		fmove: row3.children[0].children[0].value.trim() || '*',
		cmove: row3.children[1].children[0].value.trim() || '*',
		dodge: row3.children[2].children[0].value,
		raid_tier : 0
	};

	return pkm_cfg;
}

function parsePartyNode(node){
	var party_cfg = {
		revive_strategy: node.children[2].children[0].children[2].checked,
		pokemon_list: []
	};
	for (var k = 0; k < node.children[1].children.length; k++)
		party_cfg.pokemon_list.push(parseAttackerNode(node.children[1].children[k]));
	
	return party_cfg;
}

function parsePlayerNode(node){
	var player_cfg = {
		party_list: []
	};
	for (var j = 0; j < node.children[1].children.length; j++)
		player_cfg.party_list.push(parsePartyNode(node.children[1].children[j]));
	
	return player_cfg;
}

function parseDefenderNode(node){
	node = node.children[1];
	var row1 = node.children[0].children[1];
	var row2 = node.children[1].children[1];
	var row3 = node.children[2].children[1];
	
	var box_idx = -1;
	var nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$')
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
	
	var pkm_cfg = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		team_idx : -1,
		nickname : box_idx >= 0 ? USER_POKEBOX[box_idx].nickname : null,
		species: box_idx >= 0 ? USER_POKEBOX[box_idx].species : nameInputValue,
		level : 1,
		atkiv : 0,
		defiv : 0,
		stmiv : 0,
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim()
	};
	if (document.getElementById("battleMode").value == "gym"){
		pkm_cfg['level'] = row2.children[0].children[0].value.trim() || '30',
		pkm_cfg['stmiv'] = row2.children[1].children[0].value.trim() || '14',
		pkm_cfg['atkiv'] = row2.children[2].children[0].value.trim() || '15',
		pkm_cfg['defiv'] = row2.children[3].children[0].value.trim() || '13',
		pkm_cfg['raid_tier'] = -1;
	}else if (document.getElementById("battleMode").value == "raid"){
		pkm_cfg['raid_tier'] = parseInt(document.getElementById("raidTier").value);
	}
	return pkm_cfg;
}


function readUserInput(){
	// 1. General Settings
	var gSettings = {};
	if (document.getElementById("battleMode").value == "raid")
		gSettings['raidTier'] = (parseInt(document.getElementById("raidTier").value));
	else if (document.getElementById("battleMode").value == "gym")
		gSettings['raidTier'] = -1;
	gSettings['weather'] = document.getElementById("weather").value;
	gSettings['dodgeBug'] = parseInt(document.getElementById("dodgeBug").value);
	gSettings['simPerConfig'] = Math.max(1, Math.min(MAX_SIM_PER_CONFIG, parseInt(document.getElementById("simPerConfig").value)));
	gSettings['reportType'] = document.getElementById("reportType").value;
	if (gSettings['reportType'] == 'avrg')
		gSettings['logStyle'] = 0;
	else
		gSettings['logStyle'] = 1;
	
	// 2. Attacker Settings
	var player_list = [];
	var playerNodes = document.getElementById("AttackerInput").children[1].children;
	for (var i = 0; i < playerNodes.length; i++){
		var player_cfg = parsePlayerNode(playerNodes[i]);
		player_cfg.player_code = i + 1;
		player_list.push(player_cfg);
	}
	
	// 3. Defender Settings
	var defenderNode = document.getElementById("ui-defenderinputbody").children[0];
	var dfdr_info = parseDefenderNode(defenderNode);
	
	return {generalSettings : gSettings,
			atkrSettings : player_list,
			dfdrSettings : dfdr_info,
			enumeratedValues : {}
			};
}


function copyAllInfo(pkm_to, pkm_from, minimized){
	pkm_to.species = pkm_from.species;
	pkm_to.level = pkm_from.level;
	pkm_to.atkiv = pkm_from.atkiv;
	pkm_to.defiv = pkm_from.defiv;
	pkm_to.stmiv = pkm_from.stmiv;
	pkm_to.fmove = pkm_from.fmove;
	pkm_to.cmove = pkm_from.cmove;
	
	
	if (!minimized){
		pkm_to.nickname = pkm_from.nickname;
		pkm_to.box_index = pkm_from.box_index;
		pkm_to.index = get_species_index_by_name(pkm_from.species);
		pkm_to.fmove_index = get_fmove_index_by_name(pkm_to.fmove);
		pkm_to.cmove_index = get_cmove_index_by_name(pkm_to.cmove);
	}else{
		pkm_to.copies = pkm_from.copies;
		pkm_to.dodge = pkm_from.dodge;
	}
}

function writeAttackerNode(node, pkmConfig){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	if (pkmConfig.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' (' + pkmConfig.species +')';
	else
		row1.children[0].children[0].value = pkmConfig.species;
	
	var species_idx = get_species_index_by_name(pkmConfig.species);
	if (species_idx < 0){
		node.children[0].innerHTML = "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>";
	}else{
		node.children[0].innerHTML = pokemon_img_by_id(POKEMON_SPECIES_DATA[species_idx].dex);
	}
	
	row1.children[1].children[0].value = pkmConfig.copies;
	row2.children[0].children[0].value = pkmConfig.level;
	row2.children[1].children[0].value = pkmConfig.stmiv;
	row2.children[2].children[0].value = pkmConfig.atkiv;
	row2.children[3].children[0].value = pkmConfig.defiv;
	row3.children[0].children[0].value = pkmConfig.fmove;
	row3.children[1].children[0].value = pkmConfig.cmove;
	row3.children[2].children[0].value = pkmConfig.dodge;
}

function writePartyNode(node, partyConfig){
	node.children[1].innerHTML = "";

	for (var k = 0; k < partyConfig.pokemon_list.length; k++){
		var pokemonNode = createAttackerNode();
		writeAttackerNode(pokemonNode, partyConfig.pokemon_list[k]);
		node.children[1].appendChild(pokemonNode);
	}
	
	node.children[2].children[0].children[0].checked = partyConfig.revive_strategy;
	$('#' + node.children[2].id).controlgroup('refresh');
}

function writePlayerNode(node, playerConfig){
	node.children[1].innerHTML = "";

	for (var j = 0; j < playerConfig.party_list.length; j++){
		var partyNode = createPartyNode();
		writePartyNode(partyNode, playerConfig.party_list[j]);
		node.children[1].appendChild(partyNode);
	}
	
	// TODO: Some other Player settings to write
}

function writeDefenderNode(node, pkmConfig, raidTier){
	
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	if (pkmConfig.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' (' + pkmConfig.species +')';
	else
		row1.children[0].children[0].value = pkmConfig['species'];
	
	var species_idx = get_species_index_by_name(pkmConfig.species);
	if (species_idx < 0){
		node.children[0].innerHTML = "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>";
	}else{
		node.children[0].innerHTML = pokemon_img_by_id(POKEMON_SPECIES_DATA[species_idx].dex);
	}
	
	row3.children[0].children[0].value = pkmConfig['fmove'];
	row3.children[1].children[0].value = pkmConfig['cmove'];
	if (document.getElementById("battleMode").value == "gym"){
		row2.children[0].children[0].value = pkmConfig['level'];
		row2.children[1].children[0].value = pkmConfig['stmiv'];
		row2.children[2].children[0].value = pkmConfig['atkiv'];
		row2.children[3].children[0].value = pkmConfig['defiv'];
	}else if (document.getElementById("battleMode").value ==  "raid"){
		row2.children[0].children[0].value = pkmConfig['raid_tier'] || raidTier;
	}
}



function writeUserInput(cfg){
	document.getElementById("battleMode").value = (cfg['generalSettings']['raidTier'] == -1) ? "gym" : "raid";
	document.getElementById("weather").value = cfg['generalSettings']['weather'];
	document.getElementById("dodgeBug").value = cfg['generalSettings']['dodgeBug'];
	document.getElementById("simPerConfig").value = cfg['generalSettings']['simPerConfig'];
	document.getElementById("reportType").value = cfg['generalSettings']['reportType'];
	
	var attackerFieldBody = document.getElementById("AttackerInput").children[1];
	attackerFieldBody.innerHTML = "";
	for (var i = 0; i < cfg['atkrSettings'].length; i++){
		var playerNode = createPlayerNode();
		writePlayerNode(playerNode, cfg['atkrSettings'][i]);
		attackerFieldBody.appendChild(playerNode);
	}
	relabelAll();
		
	var defenderFieldBody = document.getElementById("DefenderInput").children[1];
	defenderFieldBody.innerHTML = "";
	var defenderNode = createDefenderNode();
	defenderFieldBody.appendChild(defenderNode);
	updateDefenderNode();
	writeDefenderNode(defenderNode, cfg['dfdrSettings'], cfg['generalSettings']['raidTier']);
	autocompletePokemonNode('d');
}


function enqueueSim(cfg){
	if (simQueue.length < MAX_QUEUE_SIZE){
		var cfg_copy = JSON.parse(JSON.stringify(cfg));
		simQueue.push(cfg_copy);
	}else
		send_feedback("Too many sims to unpack. Try to use less enumerators");
}

function unpackSpeciesKeyword(str){
	str = str.trim().toLowerCase();
	if (str == '' || str == 'rlvt')
		return RELEVANT_ATTACKERS_INDICES;
	else if (str[0] == '{' && str[str.length - 1] == '}'){
		var names = str.slice(1, str.length - 1).trim().split(',');
		var indices = [];
		for (var i = 0; i < names.length; i++){
			var pkm_idx = get_species_index_by_name(names[i].trim());
			if (pkm_idx >= 0)
				indices.push(pkm_idx);
			else
				send_feedback(names[i].trim() + " parsed to none inside list intializer", true);
		}
		return indices;
	}else if (str == 'babt')
		return BEST_ATTACKERS_BY_TYPE_INDICES;
	else if (str == 't1')
		return TIER1_BOSSES_CURRENT_INDICES;
	else if (str == 't2')
		return TIER2_BOSSES_CURRENT_INDICES;
	else if (str == 't3')
		return TIER3_BOSSES_CURRENT_INDICES;
	else if (str == 't4')
		return TIER4_BOSSES_CURRENT_INDICES;
	else if (str == 't5')
		return TIER5_BOSSES_CURRENT_INDICES;
	else if (str == 'all'){
		var pokemonIndices = [];
		for (var i = 0; i < POKEMON_SPECIES_DATA.length; i++)
			pokemonIndices.push(i);
		return pokemonIndices;
	}else if (POKEMON_BY_TYPE_INDICES.hasOwnProperty(str))
		return POKEMON_BY_TYPE_INDICES[str];
}

function unpackMoveKeyword(str, moveType, pkmIndex){
	var prefix = (moveType == 'f') ? "fast" : "charged";
	pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;

	str = str.toLowerCase();
	var moveIndices = [];
	var moveNames = [];
	if (str == '' || str == 'aggr'){
		moveNames = POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves"];
		moveNames = moveNames.concat(POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves_legacy"]);
		var exMoveNames = POKEMON_SPECIES_DATA[pkmIndex].exclusiveMoves;
		if (exMoveNames)
			for (var i = 0; i < exMoveNames.length; i++){
				var move_idx = pred(exMoveNames[i].trim());
				if (move_idx >= 0)
					moveIndices.push(move_idx);
			}
	}
	else if (str == 'cur')
		moveNames = POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves"];
	else if (str[0] == '{' && str[str.length - 1] == '}')
		moveNames = str.slice(1, str.length - 1).split(',');
	else if (str == 'all'){
		var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
		for (var i = 0; i < MovesData.length; i++)
			moveIndices.push(i);
	}
	
	for (var i = 0; i < moveNames.length; i++){
		var move_idx = pred(moveNames[i].trim());
		if (move_idx >= 0)
			moveIndices.push(move_idx);
	}
	return moveIndices;
}




function parseSpeciesExpression(cfg, pkmInfo, enumPrefix){
	if (pkmInfo.index >= 0)
		return 0;
	var expressionStr = pkmInfo.species;

	if (expressionStr[0] == '*'){// Enumerator
		var enumVariableName = '*' + enumPrefix + '.species';
		if (expressionStr[1] == '$'){ // Special case: User Pokebox. Also set the Level, IVs and moves
			if (USER_POKEBOX.length > 0 && !MasterSummaryTableMetrics.includes(enumVariableName))
				createNewMetric(enumVariableName);
			for (var i = 0; i < USER_POKEBOX.length; i++){
				copyAllInfo(pkmInfo, USER_POKEBOX[i], false);
				pkmInfo.box_index = i;
				cfg['enumeratedValues'][enumVariableName] = '$' + i + ' ' + USER_POKEBOX[i].nickname;
				enqueueSim(cfg);
			}
		}else{
			var indices = unpackSpeciesKeyword(expressionStr.slice(1));
			if (indices.length == 0){
				send_feedback(expressionStr + " parsed to none", true);
				return -1;
			}
			if (!MasterSummaryTableMetrics.includes(enumVariableName))
				createNewMetric(enumVariableName);
					
			for (var k = 0; k < indices.length; k++){
				pkmInfo.index = indices[k];
				pkmInfo.species = POKEMON_SPECIES_DATA[indices[k]].name;
				cfg['enumeratedValues'][enumVariableName] = pkmInfo.species;
				enqueueSim(cfg);
			}
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split('-');
			var playerIdx = parseInt(arr[0].trim()), partyIdx = parseInt(arr[1].trim()), pkmIdx = parseInt(arr[2].trim());
			var pkmConfigToCopyFrom = cfg['atkrSettings'][playerIdx].party_list[partyIdx].pokemon_list[pkmIdx];
			pkmInfo.index = pkmConfigToCopyFrom.index;
			pkmInfo.species = pkmConfigToCopyFrom.species;
			
			if (pkmConfigToCopyFrom.box_index >= 0){
				copyAllInfo(pkmInfo, pkmConfigToCopyFrom, false);
			}
			enqueueSim(cfg);
			return -1;
		}catch(err){
			console.log(err);
		}
	}else{
		pkmInfo.index = get_species_index_by_name(expressionStr);		
	}
	
	return (pkmInfo.index >= 0) ? 0 : -1;
}

function parseRangeExpression(cfg, pkmInfo, enumPrefix, attr){
	if (typeof pkmInfo[attr] == typeof 0)
		return 0;
	
	var LBound = (attr == 'level' ? 1 : 0), UBound = (attr == 'level' ? 40 : 15);
	
	if (pkmInfo[attr].includes('-')){
		var enumVariableName = '*' + enumPrefix + '.' + attr;
		if (!MasterSummaryTableMetrics.includes(enumVariableName))
			createNewMetric(enumVariableName);
		var bounds = pkmInfo[attr].split('-');
		bounds[0] = bounds[0].trim();
		bounds[1] = bounds[1].trim();
		LBound = Math.max((bounds[0] == '' ? LBound : parseInt(bounds[0])), LBound);
		UBound = Math.min((bounds[1] == '' ? UBound : parseInt(bounds[1])), UBound);
		for (var i = LBound; i <= UBound; i++){
			pkmInfo[attr] = i;
			cfg['enumeratedValues'][enumVariableName] = i;
			enqueueSim(cfg);
		}
		return -1;
	}else{
		pkmInfo[attr] = Math.max(LBound, Math.min(UBound, parseInt(pkmInfo[attr])));
		return 0;
	}
}

function parseMoveExpression(cfg, pkmInfo, enumPrefix, moveType){
	if (pkmInfo[moveType+'move_index'] >= 0)
		return 0;
	var expressionStr = pkmInfo[moveType+'move'];
	var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
	
	if (expressionStr[0] == '*'){ // Enumerator
		var enumVariableName = '*' + enumPrefix + '.' + moveType + 'move';
		var moveIndices = unpackMoveKeyword(expressionStr.slice(1), moveType, pkmInfo.index);
		if (moveIndices.length == 0){
			send_feedback(expressionStr + " parsed to none", true);
			return -1;
		}
		if (!MasterSummaryTableMetrics.includes(enumVariableName))
			createNewMetric(enumVariableName);
		for (var k = 0; k < moveIndices.length; k++){
			pkmInfo[moveType+'move_index'] = moveIndices[k];
			pkmInfo[moveType+'move'] = MovesData[moveIndices[k]].name;
			cfg['enumeratedValues'][enumVariableName] = pkmInfo[moveType+'move'];
			enqueueSim(cfg);
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split('-');
			var playerIdx = parseInt(arr[0].trim()), partyIdx = parseInt(arr[1].trim()), pkmIdx = parseInt(arr[2].trim());
			var pkmConfigToCopyFrom = cfg['atkrSettings'][playerIdx].party_list[partyIdx].pokemon_list[pkmIdx];
			pkmInfo[moveType+'move_index'] = pkmConfigToCopyFrom[moveType+'move_index'];
			pkmInfo[moveType+'move'] = pkmConfigToCopyFrom[moveType+'move'];
			enqueueSim(cfg);
			return -1;
		}catch(err){
			console.log(err);
		}
	}else{
		pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;
		pkmInfo[moveType+'move_index'] = pred(expressionStr);
	}
	return (pkmInfo[moveType+'move_index'] >= 0) ? 0 : -1;
}

function parsePokemonInput(cfg, pkmInfo, enumPrefix){
	if (parseSpeciesExpression(cfg, pkmInfo, enumPrefix) == -1)
		return -1;
	if (parseRangeExpression(cfg, pkmInfo, enumPrefix, 'level') == -1)
		return -1;
	if (parseRangeExpression(cfg, pkmInfo, enumPrefix, 'atkiv') == -1)
		return -1;
	if (parseRangeExpression(cfg, pkmInfo, enumPrefix, 'defiv') == -1)
		return -1;
	if (parseRangeExpression(cfg, pkmInfo, enumPrefix, 'stmiv') == -1)
		return -1;
	if (parseMoveExpression(cfg, pkmInfo, enumPrefix, 'f') == -1)
		return -1;
	if (parseMoveExpression(cfg, pkmInfo, enumPrefix, 'c') == -1)
		return -1;
	return 0;
}

function processQueue(cfg){
	for (var i = enumPlayerStart; i < cfg['atkrSettings'].length; i++){
		for (var j = enumPartyStart; j < cfg['atkrSettings'][i].party_list.length; j++){
			for (var k = enumPokemonStart; k < cfg['atkrSettings'][i].party_list[j].pokemon_list.length; k++){
				if (parsePokemonInput(cfg, cfg['atkrSettings'][i].party_list[j].pokemon_list[k], i+'-'+j+'-'+k) == -1)
					return -1;
				enumPokemonStart++;
			}
			enumPartyStart++;
			enumPokemonStart = 0;
		}
		enumPlayerStart++;
		enumPartyStart = 0;
		enumPokemonStart = 0;
	}
	
	if (enumDefender == 0 && parsePokemonInput(cfg, cfg['dfdrSettings'], 'd') == -1)
		return -1;
	enumDefender++;

	return 0;
}

function runSim(cfg){
	var interResults = [];
	var numSimRun = parseInt(cfg['generalSettings']['simPerConfig']);
	for (var i = 0; i < numSimRun; i++){
		var app_world = new World(cfg);
		app_world.battle();
		interResults.push(app_world.get_statistics());
	}
	if (cfg['generalSettings']['reportType'] == 'avrg')
		simResults.push({input: cfg, output: averageResults(interResults)});
	else if (cfg['generalSettings']['reportType'] == 'enum'){
		for (var i = 0; i < interResults.length; i++)
			simResults.push({input: cfg, output: interResults[i]});
	}
}

function averageResults(results){
	var avrgResult = results[0];
	var numResults = results.length;
	var sumWin = 0, sumDuration = 0, sumEnemyHPLostPctg = 0, sumDeaths = 0;
	for (var i = 0; i < numResults; i++){
		var gs = results[i]['generalStat'];
		if (gs['battle_result'] == 'Win')
			sumWin++;
		sumDuration += gs['duration'];
		sumEnemyHPLostPctg += gs['dfdr_HP_lost_percent'];
		sumDeaths += gs['total_deaths'];
	}
	if (numResults > 1){
		avrgResult['generalStat']['battle_result'] = Math.round(sumWin/numResults*100)/100 + " Win";
	}else{
		avrgResult['generalStat']['battle_result'] = results[0]['generalStat']['battle_result'];
	}
	avrgResult['generalStat']['duration'] = Math.round(sumDuration/numResults*10)/10;
	avrgResult['generalStat']['dfdr_HP_lost_percent'] = Math.round(sumEnemyHPLostPctg/numResults*100)/100;
	avrgResult['generalStat']['total_deaths'] = Math.round(sumDeaths/numResults*100)/100;
	
	return avrgResult;
}


function clearFeedbackTables(){
	document.getElementById("feedback_table1").innerHTML = "";
	document.getElementById("feedback_table2").innerHTML = "";
}

function clearAllSims(){
	simResults = [];
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0]);
	initMasterSummaryTableMetrics();
	displayMasterSummaryTable();
}

function createMasterSummaryTable(){
	var table = document.createElement("table");
	table.style = "width:100%";
	table.appendChild(createElement('thead',''));
	table.appendChild(createElement('tfoot',''));
	table.appendChild(createElement('tbody',''));

	table.children[0].appendChild(createRow(MasterSummaryTableHeaders.concat(["Details"]),"th"));
	table.children[1].appendChild(createRow(MasterSummaryTableHeaders.concat(["Details"]),"th"));
	
	for (var i = 0; i < simResults.length; i++){
		var sim = simResults[i];
		var row = [];
		MasterSummaryTableMetrics.forEach(function(m){
			row.push((m[0] == '*') ? sim.input.enumeratedValues[m] : sim.output.generalStat[m]);
		});
		row.push("<a onclick='displayDetail("+i+")'>Detail</a>");
		table.children[2].appendChild(createRow(row, "td"));
	}
	
	return table;
}

function createPlayerStatisticsString(playerStat){
	var pString = "Player " + playerStat.player_code;
	pString += ", TDO: " + playerStat.tdo + "(" + playerStat.tdo_percentage + "%)";
	pString += ", rejoined " + playerStat.num_rejoin + " time" + (playerStat.num_rejoin > 1 ? 's' : '');
	return pString;
}

function createPokemonStatisticsTable(pokemonStats){
	var table = document.createElement("table");
	table.appendChild(createRow(["<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>",
								"HP",
								"Energy",
								"TDO",
								"Duration",
								"DPS",
								"TEW"],"th"));
	for (var i = 0; i < pokemonStats.length; i++){
		var ps = pokemonStats[i];
		table.appendChild(createRow([ps.img, ps.hp, ps.energy, ps.tdo, ps.duration, ps.dps, ps.tew],"td"));
	}
	return table;
}


function displayMasterSummaryTable(){
	clearFeedbackTables();
	document.getElementById("feedback_buttons").innerHTML = "<button onclick='clearAllSims()'>Clear All</button>";
	
	var table = createMasterSummaryTable();
	table.id = 'ui-mastersummarytable';
	table.cellspacing = '0';
	table.width = '100%';
	table.class = "display nowrap";
	
	document.getElementById("feedback_table1").appendChild(table);
	
	
	table = $( '#ui-mastersummarytable' ).DataTable({
		scroller: true,
        scrollX: true,
		scrollY: '60vh'
	});
	table.class = 'display nowrap';
	table.columns().flatten().each( function ( colIdx ) {
		// Create the select list and search operation
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).footer()
			)
			.on( 'change', function (){
				table.column( colIdx ).search( $(this).val() ).draw();
				/*
				var temptable = table.column( colIdx ).search( $(this).val() );
				var order_idx = MasterSummaryTableMetricsFilterOrder.indexOf(parseInt(this.id.split('-')[3]));
				if (order_idx == -1)
					MasterSummaryTableMetricsFilterOrder.push(parseInt(this.id.split('-')[3]));
				else{
					if ($(this).val() == ' ')
						MasterSummaryTableMetricsFilterOrder.splice(order_idx);
					else
						MasterSummaryTableMetricsFilterOrder.splice(order_idx + 1);
					for (var i = 0; i < MasterSummaryTableMetrics.length; i++){
						if (!MasterSummaryTableMetricsFilterOrder.includes(i)){
							var selectToMod = document.getElementById('ui-mst-select-' + i);
							selectToMod.value = ' ';
							//selectToMod.innerHTML = '';
							// temptable.column( i ).search( '' );
						}
					}
				}
				temptable.draw();
				*/
			} );
			
		select[0].id = 'ui-mst-select-' + colIdx;
		
		// No filter
		select.append( $("<option value=' '>*</option>") );
		// Get the search data for the first column and add to the select list
		table.column( colIdx ).cache( 'search' ).sort().unique()
			.each( function ( d ) {
				var op = document.createElement('option');
				op.value = d;
				op.innerHTML = d;
				select.append(op);
			} );
	} );
}

function displayDetail(i){
	clearFeedbackTables();
	
	// Replay the configuration
	writeUserInput(simResults[i]['input']);
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfigToUrl(simResults[i]['input']));
	
	// Add option to go back to Master Summary
	document.getElementById("feedback_buttons").innerHTML = "";
	var b = createElement("button","Back");
	b.onclick = function(){
		$( "#feedback_table1" ).accordion("destroy");
		$( "#feedback_table2" ).accordion("destroy");
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	
	// Prepare Player/Party/Pokemon summary
	var output = simResults[i]['output'];
	var fbSection = document.getElementById("feedback_table1");
	for (var i = 0; i < output.pokemonStats.length - 1; i++){
		fbSection.appendChild(createElement('h4',createPlayerStatisticsString(output.playerStats[i])));
		var playerDiv = document.createElement('div');
		playerDiv.id = 'ui-playerstat-' + i;
		for (var j = 0; j < output.pokemonStats[i].length; j++){
			playerDiv.appendChild(createElement('h5','Party ' + (j+1)));
			var partyDiv = document.createElement('div');
			partyDiv.appendChild(createPokemonStatisticsTable(output.pokemonStats[i][j]));
			playerDiv.appendChild(partyDiv);
		}
		fbSection.appendChild(playerDiv);
		
		$( '#' + playerDiv.id ).accordion({
			active: false,
			collapsible: true,
			heightStyle: 'content'
		});
	}
	fbSection.appendChild(createElement('h4','Defender'));
	var defenderDiv = document.createElement('div');
	defenderDiv.appendChild(createPokemonStatisticsTable([output.pokemonStats[output.pokemonStats.length - 1]]));
	fbSection.appendChild(defenderDiv);
	
	$( "#feedback_table1" ).accordion({
		active: false,
		collapsible: true,
		heightStyle: 'content'
	});
	
	// Battle Log
	var fbSection = document.getElementById("feedback_table2");
	fbSection.appendChild(createElement('h3','Battle Log'));
	var battleLogDiv = document.createElement('div');
	var battleLogTable = createBattleLogTable(output.battleLog, output.playerStats.length);
	battleLogTable.id = 'ui-log-table';
	battleLogDiv.appendChild(battleLogTable);
	fbSection.appendChild(battleLogDiv);
	
	$( '#ui-log-table' ).DataTable({
		scrollX: true,
		scrollY: '80vh',
		scroller: true,
		searching: false,
		ordering: false
	});
	$( "#feedback_table2" ).accordion({
		active: false,
		collapsible: true,
		heightStyle: 'content'
	});
}

function createBattleLogTable(log, playerCount){
	var table = document.createElement('table');
	table.appendChild(createElement('thead',''));
	table.appendChild(createElement('tbody',''));
	table.style = 'width:100%';
	table.class = 'display nowrap';
	
	var headers = ["Time"];
	for (var i = 0; i < playerCount; i++)
		headers.push("Player" + (i+1));
	headers.push("Defender");
	table.children[0].appendChild(createRow(headers, "th"));
	
	for (var i = 0; i < log.length; i++){
		table.children[1].appendChild(createRow(log[i]), "td");
	}
	
	return table;
}

function send_feedback(msg, appending){
	if (appending){
		document.getElementById("feedback_message").innerHTML += msg;
	}else
		document.getElementById("feedback_message").innerHTML = msg;
	document.getElementById("feedback_message").scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
}

function main(){
	initMasterSummaryTableMetrics();
	var userInput = readUserInput();
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfigToUrl(userInput));
	simQueue.push(userInput);
	send_feedback("");
	while (simQueue.length > 0){
		var cfg = simQueue[0];
		if (processQueue(cfg) == -1)
			simQueue.shift();
		else
			runSim(simQueue.shift());
	}
	displayMasterSummaryTable();
	send_feedback("Simulations were done.", true);
}