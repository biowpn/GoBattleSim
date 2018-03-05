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




/* 
 * UI CORE FUNCTIONS 
 */

function initMasterSummaryTableMetrics(){
	MasterSummaryTableMetrics = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_METRICS));
	MasterSummaryTableHeaders = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_HEADERS));

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



function createAttackerNode(){
	var pokemonNode = document.createElement("div");
	pokemonNode.appendChild(document.createElement("div")); // head, contain the label of this Pokemon
	pokemonNode.appendChild(document.createElement("div")); // body, contain species/moves/etc configurations
	pokemonNode.appendChild(document.createElement("div")); // tail, contain controls
	
	// 1. Head
	// pokemonNode.children[0].innerHTML = "<h5>Unlabeled Pokemon</h5>";
	pokemonNode.children[0].innerHTML = "<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>";

	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=75%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['',''],'td'));
	tb1.children[1].children[0].innerHTML = "<input type='text' placeholder='Species'>";
	tb1.children[1].children[1].innerHTML = "<input type='number' placeholder='Copies' min='1' max='6'>";
	
	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>");
	tb2.appendChild(createRow(['','','',''],'td'));
	tb2.children[1].children[0].innerHTML = "<input type='number' placeholder='Level' min='1' max='40'>";
	tb2.children[1].children[1].innerHTML = "<input type='number' placeholder='HP. IV' min='0' max='15'>";
	tb2.children[1].children[2].innerHTML = "<input type='number' placeholder='Atk. IV' min='0' max='15'>";
	tb2.children[1].children[3].innerHTML = "<input type='number' placeholder='Def. IV' min='0' max='15'>";

	var tb3 = createElement("table", "<colgroup><col width=35%><col width=35%><col width=30%></colgroup>");
	tb3.appendChild(createRow(['','',''],'td'));
	tb3.children[1].children[0].innerHTML = "<input type='text' placeholder='Fast Move'>";
	tb3.children[1].children[1].innerHTML = "<input type='text' placeholder='Charged Move'>";
	tb3.children[1].children[2].innerHTML = "<select><option value='0'>No Dodge</option><option value='1'>Dodge Charged</option><option value='2'>Dodge All</option></select></td>";
	
	pokemonNode.children[1].appendChild(tb1);
	pokemonNode.children[1].appendChild(tb2);
	pokemonNode.children[1].appendChild(tb3);
	
	// 3. Tail
	var controlTable = createElement("table", "<colgroup><col width=25%><col width=25%><col width=50%></colgroup>");
	controlTable.appendChild(createRow(['','',''],'td'));
	
	
	var copyPokemonButton = createElement("button", "Copy");
	copyPokemonButton.onclick = function(){
		var pokemonNodeToCopyFrom = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		atkrCopyPasteClipboard = parseAttackerNode(pokemonNodeToCopyFrom);
	}
	var pastePokemonButton = createElement("button", "Paste");
	pastePokemonButton.onclick = function(){
		var pokemonNodeToPasteTo = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		writeAttackerNode(pokemonNodeToPasteTo, atkrCopyPasteClipboard);
	}
	var removePokemonButton = createElement("button", "Remove Pokemon");
	removePokemonButton.onclick = function(){
		var pokemonNodeToRemove = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		pokemonNodeToRemove.parentNode.removeChild(pokemonNodeToRemove);
		relabelAll();
	}
	controlTable.children[1].children[0].appendChild(copyPokemonButton);
	controlTable.children[1].children[1].appendChild(pastePokemonButton);
	controlTable.children[1].children[2].appendChild(removePokemonButton);
	pokemonNode.children[2].appendChild(controlTable);
	pokemonNode.children[2].appendChild(createElement('br',''));
	
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
	var controlTable = createElement("table","<colgroup><col width=25%><col width=50%><col width=25%></colgroup>");
	controlTable.appendChild(createRow(['','','']));
	
	controlTable.children[1].children[0].innerHTML = "Max Revive<input type='checkbox'></input>";
	
	var addPokemonButton = createElement("button", "Add Pokemon");
	addPokemonButton.onclick = function(){
		var partyNodeToAddPokemon = document.getElementById('ui-party-' + this.id.split(':')[1]);
		partyNodeToAddPokemon.children[1].appendChild(createAttackerNode());
		relabelAll();
	}
	var removePartyButton = createElement("button", "Remove Party");
	removePartyButton.onclick = function(){
		var partyNodeToRemove = document.getElementById('ui-party-' + this.id.split(':')[1]);
		partyNodeToRemove.parentNode.removeChild(partyNodeToRemove);
		relabelAll();
	}
	controlTable.children[1].children[1].appendChild(addPokemonButton);
	controlTable.children[1].children[2].appendChild(removePartyButton);
	partyNode.children[2].appendChild(controlTable);
	partyNode.children[2].appendChild(createElement('br',''));

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
	var controlTable = createElement("table","<colgroup><col width=50%><col width=50%></colgroup>");
	controlTable.appendChild(createRow(['',''],'td'));
	
	var addPartyButton = createElement("button", "Add Party");
	addPartyButton.onclick = function(){
		var playerNodeToAddPartyTo = document.getElementById('ui-player-' + this.id.split(':')[1]);
		playerNodeToAddPartyTo.children[1].appendChild(createPartyNode());
		relabelAll();
	}
	var removePlayerButton = createElement("button", "Remove Player");
	removePlayerButton.onclick = function(){
		var playerNodeToRemove = document.getElementById('ui-player-' + this.id.split(':')[1]);
		playerNodeToRemove.parentNode.removeChild(playerNodeToRemove);
		relabelAll();
	}
	controlTable.children[1].children[0].appendChild(addPartyButton);
	controlTable.children[1].children[1].appendChild(removePlayerButton);
	playerNode.children[2].appendChild(controlTable);
	playerNode.children[2].appendChild(createElement('br',''));
	
	return playerNode;
}

function addPlayerNode(){
	var attackerFieldBody = document.getElementById("AttackerInput").children[1];
	attackerFieldBody.appendChild(createPlayerNode());
	relabelAll();
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
				
				//pokemonNode.children[0].children[0].innerHTML = "Pokemon " + (k+1);
				
				var tables = pokemonNode.children[1].children;
				tables[0].children[1].children[0].children[0].id = 'ui-species-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[0].children[0].id = 'ui-fmove-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[1].children[0].id = 'ui-cmove-' + i + '-' + j + '-' + k;
				
				pokemonNode.children[2].children[0].children[1].children[0].children[0].id = 'copy_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[2].children[0].children[1].children[1].children[0].id = 'paste_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[2].children[0].children[1].children[2].children[0].id = 'remove_pokemon:' + i + '-' + j + '-' + k;
				
				autocompletePokemonNode(i + '-' + j + '-' + k);
			}
			$( '#ui-partybody-' + i + '-' + j ).sortable({axis: 'y'});
			
			partyNode.children[2].children[0].children[1].children[1].children[0].id = 'add_pokemon:' + i + '-' + j;
			partyNode.children[2].children[0].children[1].children[2].children[0].id = 'remove_party:' + i + '-' + j;
		}
		$( '#ui-playerbody-' + i ).sortable({axis: 'y'});
		
		playerNode.children[2].children[0].children[1].children[0].children[0].id = "add_party:" + i;
		playerNode.children[2].children[0].children[1].children[1].children[0].id = "remove_player:" + i;
	}
	$( '#ui-attackerinputbody' ).sortable({axis: 'y'});
	
}


function createDefenderNode(){
	var defenderNode = document.createElement("div");
	defenderNode.appendChild(document.createElement("div")); // head, contain the label of this Player
	defenderNode.appendChild(document.createElement("div")); // body, contain Party Nodes
	defenderNode.appendChild(document.createElement("div")); // tail, contain controls
	
	// 1. Head
	defenderNode.children[0].innerHTML = "<h3>Defender</h3>";
	
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
		tb2.children[1].children[0].innerHTML = "<input type='number' placeholder='Level'>";
		tb2.children[1].children[1].innerHTML = "<input type='number' placeholder='HP. IV'>";
		tb2.children[1].children[2].innerHTML = "<input type='number' placeholder='Atk. IV'>";
		tb2.children[1].children[3].innerHTML = "<input type='number' placeholder='Def. IV'>";
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
		delay : 0,
		source : POKEMON_SPECIES_OPTIONS,
		change : function(event, ui) {
			if (this.value[0] == '$' && USER_POKEBOX.length > 0 && address_const != 'd'){
				var idx = parseInt(this.value.slice(1).split(' ')[0]);
				writeAttackerNode(document.getElementById("ui-pokemon-" + address_const), USER_POKEBOX[idx]);
			}
		}
	});
	
	$( '#ui-fmove-' + address ).autocomplete({
		delay : 0,
		source: FAST_MOVES_OPTIONS
	});
	
	$( '#ui-cmove-' + address ).autocomplete({
		delay : 0,
		source: CHARGED_MOVE_OPTIONS
	});
	
}



function parseAttackerNode(node){
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
		nickname : box_idx >= 0 ? USER_POKEBOX[box_idx].nickname : null,
		species: box_idx >= 0 ? USER_POKEBOX[box_idx].species : nameInputValue,
		copies: row1.children[1].children[0].valueAsNumber || 1,
		level: Math.max(1, Math.min(40,row2.children[0].children[0].valueAsNumber)),
		stmiv: Math.max(0, Math.min(15,row2.children[1].children[0].valueAsNumber)),
		atkiv: Math.max(0, Math.min(15,row2.children[2].children[0].valueAsNumber)),
		defiv: Math.max(0, Math.min(15,row2.children[3].children[0].valueAsNumber)),
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim(),
		dodge: row3.children[2].children[0].value,
		raid_tier : 0
	};
	return pkm_cfg;
}

function parsePartyNode(node){
	var party_cfg = {
		revive_strategy: node.children[2].children[0].children[1].children[0].children[0].checked,
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
		pkm_cfg['level'] = Math.max(1, Math.min(40,row2.children[0].children[0].valueAsNumber));
		pkm_cfg['stmiv'] = Math.max(0, Math.min(15,row2.children[1].children[0].valueAsNumber));
		pkm_cfg['atkiv'] = Math.max(0, Math.min(15,row2.children[2].children[0].valueAsNumber));
		pkm_cfg['defiv'] = Math.max(0, Math.min(15,row2.children[3].children[0].valueAsNumber));
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
	gSettings['simPerConfig'] = Math.max(1, Math.min(MAX_SIM_PER_CONFIG, document.getElementById("simPerConfig").valueAsNumber));
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


function copyAllInfo(pkm_to, pkm_from){
	pkm_to.nickname = pkm_from.nickname;
	pkm_to.box_index = pkm_from.box_index;
	pkm_to.species = pkm_from.species;
	pkm_to.index = get_species_index_by_name(pkm_from.species);
	pkm_to.level = pkm_from.level;
	pkm_to.atkiv = pkm_from.atkiv;
	pkm_to.defiv = pkm_from.defiv;
	pkm_to.stmiv = pkm_from.stmiv;
	pkm_to.fmove = pkm_from.fmove;
	pkm_to.fmove_index = get_fmove_index_by_name(pkm_to.fmove);
	pkm_to.cmove = pkm_from.cmove;
	pkm_to.cmove_index = get_cmove_index_by_name(pkm_to.cmove);
}

function writeAttackerNode(node, pkmConfig){
	node = node.children[1];
	var row1 = node.children[0].children[1];
	var row2 = node.children[1].children[1];
	var row3 = node.children[2].children[1];
	
	if (pkmConfig.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' (' + pkmConfig.species +')';
	else
		row1.children[0].children[0].value = pkmConfig.species;
	
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
	
	// TODO: Some other Party settings to write
	node.children[2].children[0].children[1].children[0].children[0].checked = partyConfig.revive_strategy;
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

function writeDefenderNode(node, pkmConfig){

	node = node.children[1];
	var row1 = node.children[0].children[1];
	var row2 = node.children[1].children[1];
	var row3 = node.children[2].children[1];
	
	if (pkmConfig.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' (' + pkmConfig.species +')';
	else
		row1.children[0].children[0].value = pkmConfig['species'];
	
	row3.children[0].children[0].value = pkmConfig['fmove'];
	row3.children[1].children[0].value = pkmConfig['cmove'];
	if (document.getElementById("battleMode").value == "gym"){
		row2.children[0].children[0].value = pkmConfig['level'];
		row2.children[1].children[0].value = pkmConfig['stmiv'];
		row2.children[2].children[0].value = pkmConfig['atkiv'];
		row2.children[3].children[0].value = pkmConfig['defiv'];
	}else if (document.getElementById("battleMode").value ==  "raid"){
		row2.children[0].children[0].value = pkmConfig['raid_tier'];
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
	writeDefenderNode(defenderNode, cfg['dfdrSettings']);
	defenderFieldBody.appendChild(defenderNode);
	autocompletePokemonNode('d');
}



function clearAllSims(){
	simResults = [];
	simResults = [];
	pageStart = 0;
	pageNumber = 1;
	pageNumberMax = 1;
	displayMasterSummaryTable();
}

function createMasterSummaryTable(){
	var table = document.createElement("table");
	table.style = "width:100%";
	table.appendChild(createElement('thead',''));
	table.appendChild(createElement('tbody',''));

	var headers = createRow(MasterSummaryTableHeaders.concat(["Details"]),"th");
	table.children[0].appendChild(headers);

	for (var i = 0; i < simResults.length; i++){
		var sim = simResults[i];
		var row = [];
		
		MasterSummaryTableMetrics.forEach(function(m){
			const v = (m[0] == '*') ? sim.input.enumeratedValues[m] : sim.output.generalStat[m];
			row.push(v || '');
		});

		row.push("<a onclick='displayDetail("+i+")'>Detail</a>");
		table.children[1].appendChild(createRow(row, "td"));
	}
	
	return table;
}

function createPlayerStatisticsTable(simRes){
	var table = document.createElement("table");
	
	table.appendChild(createRow(["Player#","TDO","TDO%","#Rejoin","#Deaths"],"th"));
	for (var i = 0; i < simRes.output.playerStat.length; i++){
		var ts = simRes.output.playerStat[i];
		table.appendChild(createRow([ts.player_code, ts.tdo, ts.tdo_percentage, ts.num_rejoin, ts.num_deaths], "td"));
	}
	return table;
}

function createPokemonStatisticsTable(simRes){
	var table = document.createElement("table");
	table.appendChild(createRow(["Player#",
								"<img src='https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png'></img>",
								"HP",
								"Energy",
								"TDO",
								"Duration",
								"DPS",
								"TEW"],"th"));
	for (var i = 0; i < simRes.output.pokemonStat.length; i++){
		var ps = simRes.output.pokemonStat[i];
		table.appendChild(createRow([ps.player_code, ps.img, ps.hp, ps.energy, ps.tdo, ps.duration, ps.dps, ps.tew],"td"));
	}
	return table;
}

function createBattleLogTable(simRes){
	var table = document.createElement("table");
	table.appendChild(createElement('thead',''));
	table.appendChild(createElement('tbody',''));

	var log = simRes.output.battleLog;

	var headers = ["Time"];
	for (var i = 0; i < simRes.input.atkrSettings.length; i++)
		headers.push("Player" + (i+1));
	headers.push("Defender");
	table.children[0].appendChild(createRow(headers, "th"));
	
	for (var i = 0; i < log.length; i++){
		table.children[1].appendChild(createRow(log[i]), "td");
	}
	
	return table;
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
				copyAllInfo(pkmInfo, USER_POKEBOX[i]);
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
				copyAllInfo(pkmInfo, pkmConfigToCopyFrom);
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

function enumeratePokemon(cfg, pkmInfo, enumPrefix){
	if (parseSpeciesExpression(cfg, pkmInfo, enumPrefix) == -1)
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
				if (enumeratePokemon(cfg, cfg['atkrSettings'][i].party_list[j].pokemon_list[k], i+'-'+j+'-'+k) == -1)
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
	
	if (enumDefender == 0 && enumeratePokemon(cfg, cfg['dfdrSettings'], 'd') == -1)
		return -1;
	enumDefender++;

	return 0;
}

function runSim(cfg){
	var interResults = [];
	for (var i = 0; i < cfg['generalSettings']['simPerConfig']; i++){
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
		avrgResult['generalStat']['battle_result'] = Math.round(sumWin/numResults*10)/10 + "Win";
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
	document.getElementById("feedback_table3").innerHTML = "";
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
	
	var columnWidths = [{width: 100/(MasterSummaryTableMetrics.length+1)+'%'}];
	MasterSummaryTableMetrics.forEach(function(m){
		columnWidths.push({width: 100/(MasterSummaryTableMetrics.length+1)+'%'});
	});
	
	table = $( '#ui-mastersummarytable' ).DataTable({
        scrollX: true
	});
	table.class = 'display nowrap';
	table.columns().flatten().each( function ( colIdx ) {
		// Create the select list and search operation
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).header()
			)
			.on( 'change', function () {
				table
					.column( colIdx )
					.search( $(this).val() )
					.draw();
			} );
		
		select.append( $("<option value=''> </option>") );
		// Get the search data for the first column and add to the select list
		table
			.column( colIdx )
			.cache( 'search' )
			.sort()
			.unique()
			.each( function ( d ) {
				select.append( $('<option value="'+d+'">'+d+'</option>') );
			} );
	} );
}

function displayDetail(i){
	clearFeedbackTables();
	writeUserInput(simResults[i]['input']);
	document.getElementById("feedback_buttons").innerHTML = "";
	var b = createElement("button","Back");
	b.onclick = function(){
		clearFeedbackTables();
		displayMetricsControlTable();
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	document.getElementById("feedback_table1").appendChild(createPlayerStatisticsTable(simResults[i]));
	document.getElementById("feedback_table2").appendChild(createPokemonStatisticsTable(simResults[i]));
	document.getElementById("feedback_table3").innerHTML = "<button onclick='displayBattleLog("+i+")'>Display Battle Log</button>";
	
}

function displayBattleLog(i){
	document.getElementById("feedback_table3").innerHTML = "";
	var logTable = createBattleLogTable(simResults[i]);
	logTable.id = 'ui-log-table';
	logTable.style = 'width:100%';
	document.getElementById("feedback_table3").appendChild(logTable);
	$( '#ui-log-table' ).DataTable({
		scrollX: true,
		scrollY: true,
		paging: false,
		searching: false
	});
}

function send_feedback(msg, appending){
	if (appending){
		document.getElementById("feedback_message").innerHTML += '<br>' + msg;
	}else
		document.getElementById("feedback_message").innerHTML = msg;
}

function main(){
	initMasterSummaryTableMetrics();
	enumPlayerStart = 0;
	enumPartyStart = 0;
	enumPokemonStart = 0;
	enumDefender = 0;
	simQueue.push(readUserInput());
	send_feedback("");
	while (simQueue.length > 0){
		var cfg = simQueue[0];
		if (processQueue(cfg) == -1)
			simQueue.shift();
		else
			runSim(simQueue.shift());
	}
	clearFeedbackTables();
	displayMasterSummaryTable();
	send_feedback(simResults.length + " simulations were done.", true);
}