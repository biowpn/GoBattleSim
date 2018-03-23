/* 
 * GLOBAL VARIABLES 
 */

// Storing user's Pokebox
var USERS_INFO = [];

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

const MAX_QUEUE_SIZE = 65536;
const MAX_SIM_PER_CONFIG = 1024;
const DEFAULT_SUMMARY_TABLE_METRICS = ['battle_result','duration','tdo_percent','dps', 'total_deaths'];
const DEFAULT_SUMMARY_TABLE_HEADERS = ['Outcome','Time','TDO%','DPS','#Death'];

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
	enumPlayerStart = 0;
	enumPartyStart = 0;
	enumPokemonStart = 0;
}

function createNewMetric(metric, nameDisplayed){
	MasterSummaryTableMetrics.push(metric);
	MasterSummaryTableHeaders.push(nameDisplayed || metric);
}

function createElement(type, innerHTML, attrsAndValues){
	var e = document.createElement(type);
	e.innerHTML = innerHTML;
	for (var attr in attrsAndValues){
		e.setAttribute(attr, attrsAndValues[attr]);
	}
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

function pokemon_icon_url_by_dex(dex, size){
	dex = Math.max(0, dex);
	size = size || "MS";
	var dex_string = dex.toString();
	while (dex_string.length < 3)
		dex_string = "0" + dex_string;
	return "https://pokemongo.gamepress.gg/assets/img/sprites/" + dex_string + size + ".png";
}

function get_all_moves_by_index(pkmIndex, moveType){
	return POKEMON_SPECIES_DATA[pkmIndex][moveType + "Moves"].
		concat(POKEMON_SPECIES_DATA[pkmIndex][moveType + "Moves_legacy"]).
		concat(POKEMON_SPECIES_DATA[pkmIndex][moveType + "Moves_exclusive"]);
}

function getPokemonSpeciesOptions(userIndex){
	var speciesOptions = [];
	if (0 <= userIndex && userIndex < USERS_INFO.length){
		var userBox = USERS_INFO[userIndex].box;
		for (var i = 0; i < userBox.length; i++){
			userBox[i].box_index = i;
			speciesOptions.push({
				label: "$" + i + " " + userBox[i].nickname + " [" + toTitleCase(userBox[i].species) + "]",
				icon: pokemon_icon_url_by_dex(POKEMON_SPECIES_DATA[userBox[i].index].dex)
			});
		}
	}
	POKEMON_SPECIES_DATA.forEach(function(pkm){
		speciesOptions.push({
			label: toTitleCase(pkm.name),
			icon: pokemon_icon_url_by_dex(pkm.dex)
		});
	});
	return speciesOptions;
}

function getMoveOptions(moveType){
	var moveDatabase = moveType == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
	var moveOptions = [];
	moveDatabase.forEach(function(move){
		moveOptions.push({
			label: toTitleCase(move.name),
			icon: move.pokeTypeIcon
		});
	});
	return moveOptions;
}


function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function jsonToURI(json){ return encodeURIComponent(JSON.stringify(json)); }

function uriToJSON(urijson){ return JSON.parse(decodeURIComponent(urijson)); }

function exportConfigToUrl(cfg){
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
	pokemonNode.setAttribute('class', 'section-body section-pokemon-node');
	pokemonNode.appendChild(document.createElement("div")); // head
	pokemonNode.appendChild(document.createElement("div")); // body
	pokemonNode.appendChild(document.createElement("div")); // tail
	
	// 1. Head
	pokemonNode.children[0].setAttribute('class', 'section-node-head');
	pokemonNode.children[0].innerHTML = "<span class='section-pokemon-node-title'>Unlabeled Pokemon</span>";
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePokemonButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePokemonButton.onclick = function(){
		$('#ui-pokemonbody-' + this.id.split(':')[1]).slideToggle('fast');this.blur();
	}
	controlButtonDiv.appendChild(minimizePokemonButton);
	
	var copyPokemonButton = createElement('button','<i class="fa fa-files-o" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Copy'
	});
	copyPokemonButton.onclick = function(){
		var pokemonNodeToCopyFrom = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		atkrCopyPasteClipboard = parseAttackerNode(pokemonNodeToCopyFrom);this.blur();
	}
	controlButtonDiv.appendChild(copyPokemonButton);
	
	var pastePokemonButton = createElement('button','<i class="fa fa-clipboard" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Paste'
	});
	pastePokemonButton.onclick = function(){
		var pokemonNodeToPasteTo = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		writeAttackerNode(pokemonNodeToPasteTo, atkrCopyPasteClipboard);this.blur();
	}
	controlButtonDiv.appendChild(pastePokemonButton);
	
	var removePokemonButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Remove'
	});
	removePokemonButton.onclick = function(){
		var pokemonNodeToRemove = document.getElementById('ui-pokemon-' + this.id.split(':')[1]);
		if (pokemonNodeToRemove.parentNode.children.length > 1){
			pokemonNodeToRemove.parentNode.removeChild(pokemonNodeToRemove);
			relabelAll();
		}else{
			send_feedback("Cannot remove the only Pokemon of the party.");
		}
		this.blur();
	}
	controlButtonDiv.appendChild(removePokemonButton);
	
	pokemonNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=75%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['',''],'td'));
	
	tb1.children[1].children[0].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', style: 'background-image: url('+pokemon_icon_url_by_dex(0)+')'
	}));
	tb1.children[1].children[1].appendChild(createElement('input','',{
		type: 'number', placeholder: 'Copies', min: 1, max: 6, value: 1
	}));
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
	tb3.children[1].children[0].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Fast Move', class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	}));
	tb3.children[1].children[1].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Charged Move', class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	}));

	tb3.children[1].children[2].innerHTML = "<select><option value='0'>No Dodge</option><option value='1'>Dodge Charged</option><option value='2'>Dodge All</option></select>";
	
	pokemonNode.children[1].appendChild(tb1);
	pokemonNode.children[1].appendChild(tb2);
	pokemonNode.children[1].appendChild(tb3);
	
	// 3. Tail
	
	return pokemonNode;
}

function createPartyNode(){
	var partyNode = document.createElement("div");
	partyNode.setAttribute('class', 'section-body section-party-node');
	partyNode.appendChild(document.createElement("div")); // head
	partyNode.appendChild(document.createElement("div")); // body
	partyNode.appendChild(document.createElement("div")); // tail
	
	// 1. Head
	partyNode.children[0].setAttribute('class', 'section-node-head');
	partyNode.children[0].innerHTML = "<span class='section-party-node-title'>Unlabeled Party</span>";
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePartyButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePartyButton.onclick = function(){
		$('#ui-partybody-' + this.id.split(':')[1]).slideToggle('fast');this.blur();
	}
	controlButtonDiv.appendChild(minimizePartyButton);
	
	var removePartyButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePartyButton.onclick = function(){
		var partyNodeToRemove = document.getElementById('ui-party-' + this.id.split(':')[1]);
		if (partyNodeToRemove.parentNode.children.length > 1){
			partyNodeToRemove.parentNode.removeChild(partyNodeToRemove);
			relabelAll();
		}else{
			send_feedback("Cannot remove the only party of the player.");
		}
		this.blur();
	}
	controlButtonDiv.appendChild(removePartyButton);
	
	partyNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	partyNode.children[1].appendChild(createAttackerNode());
	
	// 3. Tail
	partyNode.children[2].style = "width:100%";
	partyNode.children[2].innerHTML = "<label style='width:50%'>Max Revive<input type='checkbox'></label>";
	
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
		this.blur();
	}
	partyNode.children[2].appendChild(addPokemonButton);
	
	return partyNode;
}

function createPlayerNode(){
	var playerNode = document.createElement("div");
	playerNode.setAttribute('class', 'section-body section-player-node');
	playerNode.appendChild(document.createElement("div")); // head
	playerNode.appendChild(document.createElement("div")); // body
	playerNode.appendChild(document.createElement("div")); // tail
	
	// 1. Head
	playerNode.children[0].setAttribute('class', 'section-node-head');
	playerNode.children[0].innerHTML = "<span class='section-player-node-title'>Unlabeled Player</span>";
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePlayerButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePlayerButton.onclick = function(){
		$('#ui-playerbody-' + this.id.split(':')[1]).slideToggle('fast');this.blur();
	}
	controlButtonDiv.appendChild(minimizePlayerButton);
	
	var removePlayerButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePlayerButton.onclick = function(){
		if (document.getElementById('ui-attackerinputbody').children.length > 1){
			var playerNodeToRemove = document.getElementById('ui-player-' + this.id.split(':')[1]);
			playerNodeToRemove.parentNode.removeChild(playerNodeToRemove);
			relabelAll();
			document.getElementById('ui-addplayerbutton').disabled = false;
		}else{
			send_feedback("Cannot remove the only player");
		}
		this.blur();
	}
	controlButtonDiv.appendChild(removePlayerButton);
	
	playerNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	
	// 3. Tail
	playerNode.children[2].style = "width:100%";
	var addPartyButton = createElement("button", "Add Party");
	//addPartyButton.style = "width:50%";
	addPartyButton.onclick = function(){
		var playerNodeToAddPartyTo = document.getElementById('ui-player-' + this.id.split(':')[1]);
		if(playerNodeToAddPartyTo.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER){
				playerNodeToAddPartyTo.children[1].appendChild(createPartyNode());
				relabelAll();
		}else{
			send_feedback("Exceeding Maximum number of Parties per player.");
		}
		this.blur();
	}
	playerNode.children[2].appendChild(addPartyButton);
	
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
		playerNode.children[0].children[1].children[0].id = 'minimize_player:' + i;
		playerNode.children[0].children[1].children[1].id = "remove_player:" + i;
		
		playerNode.children[1].id = 'ui-playerbody-' + i;
		var partyNodes = playerNode.children[1].children;
		for (var j = 0; j < partyNodes.length; j++){
			var partyNode = partyNodes[j];
			partyNode.id = 'ui-party-' + i + '-' + j;
			
			partyNode.children[0].children[0].innerHTML = "Party " + (j+1);
			partyNode.children[0].children[1].children[0].id = 'minimize_party:' + i + '-' + j;
			partyNode.children[0].children[1].children[1].id = 'remove_party:' + i + '-' + j;
			
			partyNode.children[1].id = 'ui-partybody-' + i + '-' + j;
			var pokemonNodes = partyNode.children[1].children;
			for (var k = 0; k < pokemonNodes.length; k++){
				var pokemonNode = pokemonNodes[k];
				pokemonNode.id = 'ui-pokemon-' + i + '-' + j + '-' + k;
				
				pokemonNode.children[0].id = 'ui-pokemonhead-' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[0].innerHTML = 'Pokemon ' + (k+1);
				pokemonNode.children[0].children[1].children[0].id = 'minimize_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[1].id = 'copy_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[2].id = 'paste_pokemon:' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[3].id = 'remove_pokemon:' + i + '-' + j + '-' + k;
				
				pokemonNode.children[1].id = 'ui-pokemonbody-' + i + '-' + j + '-' + k;
				var tables = pokemonNode.children[1].children;
				tables[0].children[1].children[0].children[0].id = 'ui-species-' + i + '-' + j + '-' + k;
				tables[0].children[1].children[1].children[0].id = 'ui-copies-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[0].children[0].id = 'ui-fmove-' + i + '-' + j + '-' + k;
				tables[2].children[1].children[1].children[0].id = 'ui-cmove-' + i + '-' + j + '-' + k;

				autocompletePokemonNode(i + '-' + j + '-' + k);
			}
			$( '#ui-partybody-' + i + '-' + j ).sortable({axis: 'y'});
			
			partyNode.children[2].id = 'ui-partytail-' + i + '-' + j;
			
			partyNode.children[2].children[0]['id'] = 'revive_strategy_label:' + i + '-' + j;
			partyNode.children[2].children[0].id = 'revive_strategy:' + i + '-' + j;
			partyNode.children[2].children[1].id = 'add_pokemon:' + i + '-' + j;
			
			$( '#ui-partytail-' + i + '-' + j ).controlgroup();
		}
		$( '#ui-playerbody-' + i ).sortable({axis: 'y'});
		
		playerNode.children[2].id = "ui-playertail-" + i;
		playerNode.children[2].children[0].id = "add_party:" + i;
		
		document.getElementById("add_party:" + i).setAttribute('class', 'player_button');
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
	
	// 1. Head
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb1.appendChild(createRow(['']));
	tb1.children[1].children[0].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', id: 'ui-species-d',
		style: 'background-image: url('+pokemon_icon_url_by_dex(0)+')'
	}));

	// By default, set to Tier 5 raid
	var tb2 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb2.appendChild(createRow(['']));
	var raidSelection = document.createElement("select");
	raidSelection.id = "raidTier";
	for (var i = 1; i <= 5; i++){
		var option = createElement("option", "Tier " + i);
		option.value = i;
		raidSelection.appendChild(option);
	}
	raidSelection.children[4].setAttribute("selected", "selected");
	tb2.children[1].children[0].appendChild(raidSelection);
	
	var tb3 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb3.appendChild(createRow(['','']));
	tb3.children[1].children[0].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Fast Move', class: 'input-with-icon move-input-with-icon', id: 'ui-fmove-d', style: 'background-image: url()'
	}));
	tb3.children[1].children[1].appendChild(createElement('input','',{
		type: 'text', placeholder: 'Charged Move', class: 'input-with-icon move-input-with-icon', id: 'ui-cmove-d', style: 'background-image: url()'
	}));
	
	defenderNode.children[1].appendChild(tb1);
	defenderNode.children[1].appendChild(tb2);
	defenderNode.children[1].appendChild(tb3);
	
	// 3. Tail
	
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
		var raidSelection = document.createElement("select");
		raidSelection.id = "raidTier";
		for (var i = 1; i <= 5; i++){
			var option = createElement("option", "Tier " + i);
			option.value = i;
			raidSelection.appendChild(option);
		}
		tb2.children[1].children[0].appendChild(raidSelection);
	}
}

function createIconLabelDiv(iconURL, label, iconClass){
	return "<div><span class='" + iconClass + "'>" + "<img src='"+iconURL+"'></img></span><span class='apitem-label'>" + label + "</span></div>";
}

function createIconLabelDiv2(iconURL, label, iconClass){
	return "<div class='input-with-icon " + iconClass + "' style='background-image: url(" + iconURL + ")'>" + label + "</div>";
}


function manual_render_autocomplete_pokemon_item(ul, item){
    return $( "<li>" )
        .append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-pokemon-icon') + "</div>" )
        .appendTo( ul );
}

function manual_render_autocomplete_move_item(ul, item){
    return $( "<li>" )
		.append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-move-icon') + "</div>" )
        .appendTo( ul );
}

function autocompletePokemonNode(address){
	const address_const = address;	
	$( '#ui-species-' + address ).autocomplete({
		minLength : 0,
		delay : 0,
		source : getPokemonSpeciesOptions(address == 'd' ? 0 : parseInt(address.split('-')[0])),
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item:{value:$(this).val()}});
		},
		change : function (event, ui){
			var thisPokemonNode = document.getElementById('ui-pokemon-' + address_const);
			var inputStr = this.value;
			var species_idx = get_species_index_by_name(inputStr), dex = 0;
			if (inputStr[0] == '$'){
				var user_idx = (address == 'd' ? 0 : parseInt(address.split('-')[0]));
				if (user_idx < USERS_INFO.length){
					var thisBox = USERS_INFO[user_idx].box;
					var box_idx = parseInt(inputStr.slice(1).split(' ')[0]);
					if (box_idx >= 0 && box_idx < thisBox.length){
						species_idx = get_species_index_by_name(thisBox[box_idx].species);
						if (address_const != 'd')
							writeAttackerNode(thisPokemonNode, thisBox[box_idx]);
						else
							writeDefenderNode(thisPokemonNode, thisBox[box_idx]);
					}
				}
			}
			if (species_idx >= 0){
				dex = POKEMON_SPECIES_DATA[species_idx].dex;
			}
			document.getElementById('ui-species-' + address_const).setAttribute('style', 
				'background-image: url('+pokemon_icon_url_by_dex(dex)+')');
			autocompletePokemonNodeMoves(address_const, species_idx);
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_pokemon_item;
	
	document.getElementById('ui-species-' + address).onfocus = function(){$(this).autocomplete("search", "");}
	
	var currentVal = $( '#ui-species-' + address ).val();
	var current_species_idx = get_species_index_by_name(currentVal);
	if (currentVal[0] == '$'){
		var user_idx = (address == 'd' ? 0 : parseInt(address.split('-')[0]));
		if (user_idx < USERS_INFO.length){
			var thisBox = USERS_INFO[user_idx].box;
			var box_idx = parseInt(currentVal.slice(1).split(' ')[0]);
			if (box_idx >= 0 && box_idx < thisBox.length)
				current_species_idx = get_species_index_by_name(thisBox[box_idx].species);
		}
	}
	autocompletePokemonNodeMoves(address_const, current_species_idx);
}

function autocompletePokemonNodeMoves(address, species_idx){
	var thisFastMoveOptions = [];
	var thisChargedMoveOptions = [];
	
	if (species_idx >= 0){
		get_all_moves_by_index(species_idx, 'fast').forEach(function(move){
				var moveData = FAST_MOVE_DATA[get_fmove_index_by_name(move)];
				thisFastMoveOptions.push({
					label: toTitleCase(moveData.name),
					icon: moveData.pokeTypeIcon
				});
			});
		get_all_moves_by_index(species_idx, 'charged').forEach(function(move){
				var moveData = CHARGED_MOVE_DATA[get_cmove_index_by_name(move)];
				thisChargedMoveOptions.push({
					label: toTitleCase(moveData.name),
					icon: moveData.pokeTypeIcon
				});
			});
	}else{
		thisFastMoveOptions = getMoveOptions('f');
		thisChargedMoveOptions = getMoveOptions('c');
	}
	
	const address_const = address;
	
	$( '#ui-fmove-' + address ).autocomplete({
		minLength : 0,
		delay : 0,
		source: thisFastMoveOptions,
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item:{value:$(this).val()}});
		},
		change : function(event, ui) {
			var inputStr = this.value;
			var move_idx = get_fmove_index_by_name(inputStr);
			if (move_idx >= 0){
				this.setAttribute('style', 'background-image: url(' + FAST_MOVE_DATA[move_idx].pokeTypeIcon + ')');
			}else{
				this.setAttribute('style', 'background-image: url()');
			}
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_move_item;
	
	$( '#ui-cmove-' + address ).autocomplete({
		minLength : 0,
		delay : 0,
		source: thisChargedMoveOptions,
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item:{value:$(this).val()}});
		},
		change : function(event, ui) {
			var inputStr = this.value;
			var move_idx = get_cmove_index_by_name(inputStr);
			if (move_idx >= 0){
				this.setAttribute('style', 'background-image: url(' + CHARGED_MOVE_DATA[move_idx].pokeTypeIcon + ')');
			}else{
				this.setAttribute('style', 'background-image: url()');
			}
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_move_item;
	
	document.getElementById('ui-fmove-' + address).onfocus = function(){$(this).autocomplete("search", "");};
	document.getElementById('ui-cmove-' + address).onfocus = function(){$(this).autocomplete("search", "");};
}

function countPokemonFromParty(partyAddress){
	var partyNodeBody = document.getElementById('ui-partybody-' + partyAddress);
	var count = 0;
	for (var i = 0; i < partyNodeBody.children.length; i++){
		count += parseInt(document.getElementById('ui-copies-' + partyAddress + '-' + i).value) || 0;
	}
	return count;
}

function parseAttackerNode(node){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	var box = [], userIndex = parseInt(node.id.split('-')[2]);
	if (userIndex < USERS_INFO.length)
		box = USERS_INFO[userIndex].box;
	
	var box_idx = -1, nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$'){
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
		if (box_idx == NaN || box_idx < 0 || box_idx >= box.length){
			send_feedback('Invalid PokeBox index', true);
			box_idx = -1;
		}
	}
	
	var pkm_cfg = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		nickname : box_idx >= 0 ? box[box_idx].nickname : "",
		species: box_idx >= 0 ? box[box_idx].species : nameInputValue,
		copies: parseInt(row1.children[1].children[0].value) || 1,
		level: row2.children[0].children[0].value.trim(),
		stmiv: row2.children[1].children[0].value.trim(),
		atkiv: row2.children[2].children[0].value.trim(),
		defiv: row2.children[3].children[0].value.trim(),
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim(),
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
	
	var box = [];
	if (USERS_INFO.length > 0)
		box = USERS_INFO[0].box; // Defender is always user 1 for now
	var box_idx = -1;
	var nameInputValue = row1.children[0].children[0].value.trim();
	if (nameInputValue[0] == '$'){
		box_idx = parseInt(nameInputValue.slice(1).split(' ')[0]);
		if (box_idx == NaN || box_idx < 0 || box_idx >= box.length){
			send_feedback('Invalid PokeBox index', true);
			box_idx = -1;
		}
	}
	
	var pkm_cfg = {
		box_index : box_idx,
		index : -1,
		fmove_index : -1,
		cmove_index : -1,
		team_idx : -1,
		nickname : box_idx >= 0 ? box[box_idx].nickname : null,
		species: box_idx >= 0 ? box[box_idx].species : nameInputValue,
		level : 1,
		atkiv : 0,
		defiv : 0,
		stmiv : 0,
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim()
	};
	if (document.getElementById("battleMode").value == "gym"){
		pkm_cfg['level'] = row2.children[0].children[0].value.trim(),
		pkm_cfg['stmiv'] = row2.children[1].children[0].value.trim(),
		pkm_cfg['atkiv'] = row2.children[2].children[0].value.trim(),
		pkm_cfg['defiv'] = row2.children[3].children[0].value.trim(),
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
	gSettings['immortalDefender'] = parseInt(document.getElementById("immortalDefender").value);
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
	
	return {
		generalSettings : gSettings,
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
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' [' + toTitleCase(pkmConfig.species) +']';
	else
		row1.children[0].children[0].value = toTitleCase(pkmConfig.species);
	
	var species_idx = get_species_index_by_name(pkmConfig.species);
	if (species_idx < 0){
		row1.children[0].children[0].setAttribute('style', 'background-image: url('+pokemon_icon_url_by_dex(0)+')');
	}else{
		row1.children[0].children[0].setAttribute('style', 
			'background-image: url('+pokemon_icon_url_by_dex(POKEMON_SPECIES_DATA[species_idx].dex)+')');
	}
	
	row1.children[1].children[0].value = pkmConfig.copies;
	row2.children[0].children[0].value = pkmConfig.level;
	row2.children[1].children[0].value = pkmConfig.stmiv;
	row2.children[2].children[0].value = pkmConfig.atkiv;
	row2.children[3].children[0].value = pkmConfig.defiv;
	
	row3.children[0].children[0].value = toTitleCase(pkmConfig.fmove);
	try{
		row3.children[0].children[0].setAttribute('style', 
		"background-image: url(" + FAST_MOVE_DATA[get_fmove_index_by_name(pkmConfig.fmove)].pokeTypeIcon + ')');
	}catch(err){}
	
	row3.children[1].children[0].value = toTitleCase(pkmConfig.cmove);
	try{
		row3.children[1].children[0].setAttribute('style', 
		"background-image: url(" + CHARGED_MOVE_DATA[get_cmove_index_by_name(pkmConfig.cmove)].pokeTypeIcon + ')');
	}catch(err){}
	
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
}

function writeDefenderNode(node, pkmConfig, raidTier){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	if (pkmConfig.box_index >= 0)
		row1.children[0].children[0].value = '$' + pkmConfig.box_index + ' ' + pkmConfig.nickname + ' [' + toTitleCase(pkmConfig.species) +']';
	else
		row1.children[0].children[0].value = pkmConfig['species'];
	
	var species_idx = get_species_index_by_name(pkmConfig.species);
	if (species_idx < 0){
		row1.children[0].children[0].setAttribute('style', 'background-image: url('+pokemon_icon_url_by_dex(0)+')');
	}else{
		row1.children[0].children[0].setAttribute('style', 'background-image: url('+pokemon_icon_url_by_dex(POKEMON_SPECIES_DATA[species_idx].dex)+')');
	}
	
	row3.children[0].children[0].value = toTitleCase(pkmConfig.fmove);
	try{
		row3.children[0].children[0].setAttribute('style', 
		"background-image: url(" + FAST_MOVE_DATA[get_fmove_index_by_name(pkmConfig.fmove)].pokeTypeIcon + ')');
	}catch(err){}
	
	row3.children[1].children[0].value = toTitleCase(pkmConfig.cmove);
	try{
		row3.children[1].children[0].setAttribute('style', 
		"background-image: url(" + CHARGED_MOVE_DATA[get_cmove_index_by_name(pkmConfig.cmove)].pokeTypeIcon + ')');
	}catch(err){}
	
	if (document.getElementById("battleMode").value == "gym"){
		row2.children[0].children[0].value = pkmConfig['level'];
		row2.children[1].children[0].value = pkmConfig['stmiv'];
		row2.children[2].children[0].value = pkmConfig['atkiv'];
		row2.children[3].children[0].value = pkmConfig['defiv'];
	}else if (document.getElementById("battleMode").value ==  "raid"){
		row2.children[0].children[0].value = pkmConfig['raid_tier'] || raidTier || 5;
	}
}



function writeUserInput(cfg){
	document.getElementById("battleMode").value = (cfg['generalSettings']['raidTier'] == -1) ? "gym" : "raid";
	document.getElementById("immortalDefender").value = cfg['generalSettings']['immortalDefender'] || 0;
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
	else
		return [];
}

function unpackMoveKeyword(str, moveType, pkmIndex){
	var prefix = (moveType == 'f') ? "fast" : "charged";
	var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
	pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;

	str = str.toLowerCase();
	var moveIndices = [];
	var moveNames = [];
	if (str == '' || str == 'aggr'){
		moveNames = get_all_moves_by_index(pkmIndex, prefix);
	}
	else if (str == 'cur')
		moveNames = POKEMON_SPECIES_DATA[pkmIndex][prefix + "Moves"];
	else if (str == 'stab'){
		get_all_moves_by_index(pkmIndex, prefix).forEach(function(move){
			var move_idx = pred(move);
			if (MovesData[move_idx].pokeType == POKEMON_SPECIES_DATA[pkmIndex].pokeType1 || MovesData[move_idx].pokeType == POKEMON_SPECIES_DATA[pkmIndex].pokeType2)
				moveIndices.push(move_idx);
		});
	}
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



function parseSpeciesExpression(cfg, pkmInfo, address){
	if (pkmInfo.index >= 0)
		return 0;
	var expressionStr = pkmInfo.species;
	if (expressionStr == ''){
		send_feedback(address + " species input: Empty", true);
		return -2;
	}

	if (expressionStr[0] == '*'){// Enumerator
		var enumVariableName = '*' + address + '.species';
		if (expressionStr[1] == '$'){ // Special case: User Pokebox. Also set the Level, IVs and moves
			var userIndex = parseInt(address.split('-')[0]) - 1;
			if (userIndex < USERS_INFO.length){
				var thisBox = USERS_INFO[userIndex].box;
				if (thisBox.length > 0 && !MasterSummaryTableMetrics.includes(enumVariableName))
					createNewMetric(enumVariableName);
				for (var i = 0; i < thisBox.length; i++){
					copyAllInfo(pkmInfo, thisBox[i], false);
					pkmInfo.box_index = i;
					cfg['enumeratedValues'][enumVariableName] = createIconLabelDiv2(
						POKEMON_SPECIES_DATA[pkmInfo.index].icon, pkmInfo.nickname + ' [' + toTitleCase(pkmInfo.species) + ']', 'species-input-with-icon');
					enqueueSim(cfg);
				}
			}
		}else{
			var indices = unpackSpeciesKeyword(expressionStr.slice(1));
			if (indices.length == 0){
				send_feedback(address + " species input: Does not match any Pokemon for Enumerator", true);
				return -2;
			}
			if (!MasterSummaryTableMetrics.includes(enumVariableName))
				createNewMetric(enumVariableName);
			for (var k = 0; k < indices.length; k++){
				pkmInfo.index = indices[k];
				pkmInfo.species = POKEMON_SPECIES_DATA[indices[k]].name;
				cfg['enumeratedValues'][enumVariableName] = createIconLabelDiv2(
					POKEMON_SPECIES_DATA[pkmInfo.index].icon, toTitleCase(pkmInfo.species), 'species-input-with-icon');
				enqueueSim(cfg);
			}
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split('-');
			var playerIdx = parseInt(arr[0].trim())-1, partyIdx = parseInt(arr[1].trim())-1, pkmIdx = parseInt(arr[2].trim())-1;
			var pkmConfigToCopyFrom = cfg['atkrSettings'][playerIdx].party_list[partyIdx].pokemon_list[pkmIdx];
			pkmInfo.index = pkmConfigToCopyFrom.index;
			pkmInfo.species = pkmConfigToCopyFrom.species;
			if (pkmConfigToCopyFrom.box_index >= 0)
				copyAllInfo(pkmInfo, pkmConfigToCopyFrom, false);
			enqueueSim(cfg);
		}catch(err){
			send_feedback(address + " species input: Invalid address for Dynamic Assignment Operator", true);
			return -2;
		}
		return -1;
	}else{
		pkmInfo.index = get_species_index_by_name(expressionStr);
		if (pkmInfo.index < 0){
			send_feedback(address + " species input: Does not match any Pokemon", true);
			return -2;
		}else
			return 0;
	}
}

function parseRangeExpression(cfg, pkmInfo, address, attr){
	if (typeof pkmInfo[attr] == typeof 0)
		return 0;
	if (pkmInfo[attr] == ''){
		send_feedback(address + '.' + attr + ": Empty", true);
		return -2;
	}
	
	var LBound = (attr == 'level' ? 1 : 0), UBound = (attr == 'level' ? 40 : 15);
	if (pkmInfo[attr][0] == '='){ // Dynamic Assignment Operator
		try{
			var arr = pkmInfo[attr].slice(1).split('-');
			var playerIdx = parseInt(arr[0].trim())-1, partyIdx = parseInt(arr[1].trim())-1, pkmIdx = parseInt(arr[2].trim())-1;
			var pkmConfigToCopyFrom = cfg['atkrSettings'][playerIdx].party_list[partyIdx].pokemon_list[pkmIdx];
			pkmInfo[attr] = pkmConfigToCopyFrom[attr];
			enqueueSim(cfg);
		}catch(err){
			send_feedback(address + '.' + attr + ": Invalid address for Dynamic Assignment Operator", true);
			return -2;
		}
		return -1;
	}else if (pkmInfo[attr].includes('-')){
		var enumVariableName = '*' + address + '.' + attr;
		if (!MasterSummaryTableMetrics.includes(enumVariableName))
			createNewMetric(enumVariableName);
		var bounds = pkmInfo[attr].split('-');
		LBound = Math.max((bounds[0].trim() == '' ? LBound : parseInt(bounds[0].trim())), LBound);
		UBound = Math.min((bounds[1].trim() == '' ? UBound : parseInt(bounds[1].trim())), UBound);
		if (LBound == NaN || UBound == NaN){
			send_feedback(address + '.' + attr + ": Invalid range for Range Generator", true);
			return -2;
		}
		for (var i = LBound; i <= UBound; i++){
			pkmInfo[attr] = i;
			cfg['enumeratedValues'][enumVariableName] = i;
			enqueueSim(cfg);
		}
		return -1;
	}else{
		pkmInfo[attr] = Math.max(LBound, Math.min(UBound, parseInt(pkmInfo[attr])));
		if (pkmInfo[attr] == NaN){
			send_feedback(address + '.' + attr + ": Invalid numerical input", true);
			return -2;
		}
		else
			return 0;
	}
}

function parseMoveExpression(cfg, pkmInfo, address, moveType){
	if (pkmInfo[moveType+'move_index'] >= 0)
		return 0;
	var expressionStr = pkmInfo[moveType+'move'];
	if (expressionStr == ''){
		send_feedback(address + '.' + moveType + "move: Empty", true);
		return -2;
	}
	
	var MovesData = (moveType == 'f') ? FAST_MOVE_DATA : CHARGED_MOVE_DATA;
	
	if (expressionStr[0] == '*'){ // Enumerator
		var enumVariableName = '*' + address + '.' + moveType + 'move';
		var moveIndices = unpackMoveKeyword(expressionStr.slice(1), moveType, pkmInfo.index);
		if (moveIndices.length == 0){
			send_feedback(address + '.' + moveType + "move: Does not match any move for Enumerator", true);
			return -2;
		}
		if (!MasterSummaryTableMetrics.includes(enumVariableName))
			createNewMetric(enumVariableName);
		for (var k = 0; k < moveIndices.length; k++){
			pkmInfo[moveType+'move_index'] = moveIndices[k];
			pkmInfo[moveType+'move'] = MovesData[moveIndices[k]].name;
			cfg['enumeratedValues'][enumVariableName] = createIconLabelDiv2(
				MovesData[moveIndices[k]].pokeTypeIcon, toTitleCase(MovesData[moveIndices[k]].name), 'move-input-with-icon');
			enqueueSim(cfg);
		}
		return -1;
	}else if (expressionStr[0] == '='){// Dynamic Assignment Operator
		try{
			var arr = expressionStr.slice(1).split('-');
			var playerIdx = parseInt(arr[0].trim())-1, partyIdx = parseInt(arr[1].trim())-1, pkmIdx = parseInt(arr[2].trim())-1;
			var pkmConfigToCopyFrom = cfg['atkrSettings'][playerIdx].party_list[partyIdx].pokemon_list[pkmIdx];
			pkmInfo[moveType+'move_index'] = pkmConfigToCopyFrom[moveType+'move_index'];
			pkmInfo[moveType+'move'] = pkmConfigToCopyFrom[moveType+'move'];
			enqueueSim(cfg);
		}catch(err){
			send_feedback(address + '.' + moveType + "move: Invalid address for Dynamic Assignment Operator", true);
			return -2;
		}
		return -1;
	}else{
		pred = (moveType == 'f') ? get_fmove_index_by_name : get_cmove_index_by_name;
		pkmInfo[moveType+'move_index'] = pred(expressionStr);
		if (pkmInfo[moveType+'move_index'] < 0){
			send_feedback(address + '.' + moveType + "move: Does not match any move", true);
			return -2;
		}else
			return 0;
	}
}


function parsePokemonInput(cfg, pkmInfo, address){
	var statusCode = parseSpeciesExpression(cfg, pkmInfo, address);
	if (statusCode != 0) return statusCode;
	statusCode = parseRangeExpression(cfg, pkmInfo, address, 'level');
	if (statusCode != 0) return statusCode;
	statusCode = parseRangeExpression(cfg, pkmInfo, address, 'atkiv');
	if (statusCode != 0) return statusCode;
	statusCode = parseRangeExpression(cfg, pkmInfo, address, 'defiv');
	if (statusCode != 0) return statusCode;
	statusCode = parseRangeExpression(cfg, pkmInfo, address, 'stmiv');
	if (statusCode != 0) return statusCode;
	statusCode = parseMoveExpression(cfg, pkmInfo, address, 'f');
	if (statusCode != 0) return statusCode;
	statusCode = parseMoveExpression(cfg, pkmInfo, address, 'c');
	return statusCode;
}

function parseWeatherInput(cfg){
	if (cfg.generalSettings.weather == '*'){
		createNewMetric('*weather');
		for (var i = 0; i < WEATHER_LIST.length; i++){
			cfg.generalSettings.weather = WEATHER_LIST[i];
			cfg.enumeratedValues['*weather'] = WEATHER_LIST[i];
			enqueueSim(cfg);
		}
		return -1;
	}else{
		return 0;
	}
}



function processQueue(cfg){
	var statusCode = 0;
	for (var i = enumPlayerStart; i < cfg['atkrSettings'].length; i++){
		for (var j = enumPartyStart; j < cfg['atkrSettings'][i].party_list.length; j++){
			for (var k = enumPokemonStart; k < cfg['atkrSettings'][i].party_list[j].pokemon_list.length; k++){
				statusCode = parsePokemonInput(cfg, cfg['atkrSettings'][i].party_list[j].pokemon_list[k], (i+1)+'-'+(j+1)+'-'+(k+1));
				if (statusCode != 0)
					return statusCode;
				enumPokemonStart++;
			}
			enumPartyStart++;
			enumPokemonStart = 0;
		}
		enumPlayerStart++;
		enumPartyStart = 0;
		enumPokemonStart = 0;
	}
	statusCode = parsePokemonInput(cfg, cfg['dfdrSettings'], 'd');
	if (statusCode != 0)
		return statusCode;
	
	statusCode = parseWeatherInput(cfg);
	if (statusCode != 0)
		return statusCode;
	
	return statusCode;
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
	var avrgR = JSON.parse(JSON.stringify(results[0])), numResults = results.length, numPlayer = results[0].playerStats.length;
	
	// These are the metrics to sum and average
	var generalStat_attrs = ['duration', 'tdo_percent', 'tdo', 'total_deaths'];
	var playerStats_attrs = ['tdo', 'tdo_percentage', 'num_rejoin'];
	var pokemonStats_attrs = ['hp', 'energy', 'tdo', 'duration', 'tew'];
	
	// 1. Initialize everything to 0
	avrgR['generalStat']['battle_result'] = 0;
	generalStat_attrs.forEach(function(attr){
		avrgR.generalStat[attr] = 0;
	});

	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){
			avrgR.playerStats[j][attr] = 0;
		});
	}
	
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < avrgR.pokemonStats[j].length; k++){
			for (var p = 0; p < avrgR.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){
					avrgR.pokemonStats[j][k][p][attr] = 0;
				});
			}
		}
	}
	pokemonStats_attrs.forEach(function(attr){
		avrgR.pokemonStats[numPlayer - 1][attr] = 0;
	});
	
	// 2. Sum them up
	for (var i = 0; i < numResults; i++){
		var result = results[i];
		
		// generalStat
		if (result.generalStat.battle_result == 'Win')
			avrgR.generalStat.battle_result++;
		generalStat_attrs.forEach(function(attr){
			avrgR.generalStat[attr] += result.generalStat[attr];
		});
		
		// playerStats
		for (var j = 0; j < numPlayer; j++){
			playerStats_attrs.forEach(function(attr){
				avrgR.playerStats[j][attr] += result.playerStats[j][attr];
			});
		}
		// pokemonStats, excluding defender first
		for (var j = 0; j < numPlayer; j++){
			for (var k = 0; k < result.pokemonStats[j].length; k++){
				for (var p = 0; p < result.pokemonStats[j][k].length; p++){
					pokemonStats_attrs.forEach(function(attr){
						avrgR.pokemonStats[j][k][p][attr] += result.pokemonStats[j][k][p][attr];
					});
				}
			}
		}
		// pokemonStats, defender
		pokemonStats_attrs.forEach(function(attr){
			avrgR.pokemonStats[numPlayer - 1][attr] += result.pokemonStats[numPlayer - 1][attr];
		});
	}
	
	// 3. Divide and get the results
	avrgR.generalStat.battle_result = Math.round(avrgR.generalStat.battle_result/numResults*10000)/100 + "% Win";
	avrgR.generalStat.dps = Math.round(avrgR.generalStat.tdo/avrgR.generalStat.duration*100)/100;
	generalStat_attrs.forEach(function(attr){
		avrgR.generalStat[attr] = Math.round(avrgR.generalStat[attr]/numResults*100)/100;
	});

	for (var j = 0; j < numPlayer; j++){
		playerStats_attrs.forEach(function(attr){
			avrgR.playerStats[j][attr] = Math.round(avrgR.playerStats[j][attr]/numResults*100)/100;
		});
	}
	
	for (var j = 0; j < numPlayer; j++){
		for (var k = 0; k < result.pokemonStats[j].length; k++){
			for (var p = 0; p < result.pokemonStats[j][k].length; p++){
				pokemonStats_attrs.forEach(function(attr){
					avrgR.pokemonStats[j][k][p][attr] = Math.round(avrgR.pokemonStats[j][k][p][attr]/numResults*100)/100;
				});
				avrgR.pokemonStats[j][k][p].dps = Math.round(avrgR.pokemonStats[j][k][p].tdo/avrgR.pokemonStats[j][k][p].duration*100)/100;
			}
		}
	}
	
	pokemonStats_attrs.forEach(function(attr){
		avrgR.pokemonStats[numPlayer][attr] = Math.round(avrgR.pokemonStats[numPlayer][attr]/numResults*100)/100;
	});
	avrgR.pokemonStats[numPlayer].dps = Math.round(avrgR.pokemonStats[numPlayer].tdo/avrgR.pokemonStats[numPlayer].duration*100)/100;
	
	return avrgR;
}


function clearFeedbackTables(){
	document.getElementById("feedback_table1").innerHTML = "";
	document.getElementById("feedback_table2").innerHTML = "";
}

function clearAllSims(){
	send_feedback("");
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
	table.appendChild(createRow(["<img src='" + pokemon_icon_url_by_dex(0) + "'></img>",
								"HP",
								"Energy",
								"TDO",
								"Duration",
								"DPS",
								"TEW"],"th"));
	for (var i = 0; i < pokemonStats.length; i++){
		var ps = pokemonStats[i];
		table.appendChild(createRow(["<img src='" + pokemon_icon_url_by_dex(POKEMON_SPECIES_DATA[ps.index].dex) + "'></img>", 
			ps.hp, ps.energy, ps.tdo, ps.duration, ps.dps, ps.tew],"td"));
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
	table.columns().flatten().each(function (colIdx){
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).footer()
			)
			.on( 'change', function (){
				table.column( colIdx ).search( $(this).val() ).draw();
			});
			
		select[0].id = 'ui-mst-select-' + colIdx;
		
		select.append( $("<option value=' '>*</option>") );
		table.column( colIdx ).cache( 'search' ).sort().unique()
			.each( function ( d ) {
				var op = document.createElement('option');
				op.value = d;
				op.innerHTML = d;
				select.append(op);
			});
	});
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
	
	var attrs = ['t'];
	var headers = ["Time"];
	for (var i = 0; i < playerCount; i++){
		attrs.push((i+1));
		headers.push("Player " + (i+1));
	}
	attrs.push('dfdr');
	headers.push("Defender");
	
	table.children[0].appendChild(createRow(headers, "th"));
	
	var sameTimeEvents = [];
	for (var i = 0; i < log.length; i++){
		var rawEntry = log[i];
		
		for (var attr in rawEntry){
			var fragments = rawEntry[attr].toString().split(':');
			if (fragments[0] == 'pokemon'){
				var pkmInfo = POKEMON_SPECIES_DATA[parseInt(fragments[1])];
				rawEntry[attr] = "<img src='" + pkmInfo.icon + "'></img>";
			}else if (fragments[0] == 'fmove'){
				var moveInfo = FAST_MOVE_DATA[parseInt(fragments[1])];
				rawEntry[attr] = createIconLabelDiv(moveInfo.pokeTypeIcon, toTitleCase(moveInfo.name), 'apitem-move-icon');
			}else if (fragments[0] == 'cmove'){
				var moveInfo = CHARGED_MOVE_DATA[parseInt(fragments[1])];
				rawEntry[attr] = createIconLabelDiv(moveInfo.pokeTypeIcon, toTitleCase(moveInfo.name), 'apitem-move-icon');
			}
		}
		
		var rowData = [];
		attrs.forEach(function(a){
			rowData.push(rawEntry[a]);
		});
		table.children[1].appendChild(createRow(rowData), "td");
	}
	return table;
}


function send_feedback(msg, appending, feedbackDivId){
	var feedbackSection = document.getElementById(feedbackDivId || "feedback_message");
	if (appending){
		feedbackSection.innerHTML += '<p>'+msg+'</p>';
	}else
		feedbackSection.innerHTML = '<p>'+msg+'</p>';
	if (!feedbackDivId)
		feedbackSection.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
}

function main(){
	send_feedback("======== GO ========", true);
	initMasterSummaryTableMetrics();
	var userInput = readUserInput(), statusCode = 0;
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfigToUrl(userInput));
	simQueue = [userInput];
	while (simQueue.length > 0){
		statusCode = processQueue(simQueue[0]);
		if (statusCode == -1)
			simQueue.shift();
		else if (statusCode == -2)
			break;
		else
			runSim(simQueue.shift());
	}
	displayMasterSummaryTable();
	if (simResults.length > 0)
		send_feedback("Simulations were done.", true);
}


function moveEditFormSubmit(){
	var moveType_input = document.getElementById('moveEditForm-moveType').value;
	var moveName = document.getElementById('moveEditForm-name').value.toLowerCase();
	var move = {
		name: moveName,
		moveType: moveType_input,
		power: parseInt(document.getElementById('moveEditForm-power').value),
		pokeType: document.getElementById('moveEditForm-pokeType').value.toLowerCase(),
		energyDelta: (moveType_input == 'f' ? 1 : -1) * Math.abs(parseInt(document.getElementById('moveEditForm-energyDelta').value)),
		dws: Math.abs(parseInt(document.getElementById('moveEditForm-dws').value)) * 1000,
		duration: Math.abs(parseInt(document.getElementById('moveEditForm-duration').value)) * 1000,
		pokeTypeIcon: "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + document.getElementById('moveEditForm-pokeType').value.toLowerCase() +".png"
	};
	
	var moveDatabase = (moveType_input == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	pred = (moveType_input == 'f' ? get_fmove_index_by_name : get_cmove_index_by_name);
	var idx = pred(moveName);
	
	if (idx >= 0){
		moveDatabase[idx] = move;
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been updated.', false, 'moveEditForm-feedback');
	}else{
		moveDatabase.push(move);
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been added.', false, 'moveEditForm-feedback');
	}
	autocompleteMoveEditForm();
}


function autocompleteMoveEditForm(){
	var moveType_input = document.getElementById('moveEditForm-moveType').value;
	var moveDatabase = (moveType_input == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	pred = (moveType_input == 'f' ? get_fmove_index_by_name : get_cmove_index_by_name);
	
	$( '#moveEditForm-name' ).autocomplete({
		appendTo : '#moveEditForm',
		minLength : 0,
		delay : 0,
		source: getMoveOptions(moveType_input),
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item:{value:$(this).val()}});
		},
		change : function(event, ui) {
			var inputStr = this.value;
			var move_idx = pred(inputStr);
			if (move_idx >= 0){
				this.setAttribute('style', 'background-image: url(' + moveDatabase[move_idx].pokeTypeIcon + ')');
				document.getElementById('moveEditForm-name').value = toTitleCase(moveDatabase[move_idx].name);
				document.getElementById('moveEditForm-pokeType').value = moveDatabase[move_idx].pokeType;
				document.getElementById('moveEditForm-power').value = moveDatabase[move_idx].power;
				document.getElementById('moveEditForm-energyDelta').value = moveDatabase[move_idx].energyDelta;
				document.getElementById('moveEditForm-duration').value = moveDatabase[move_idx].duration / 1000;
				document.getElementById('moveEditForm-dws').value = moveDatabase[move_idx].dws / 1000;
			}
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_move_item;
	
	document.getElementById('moveEditForm-name' ).onfocus = function(){$(this).autocomplete("search", "");}
	
	document.getElementById('moveEditForm-pokeType').onchange = function(){
		document.getElementById('moveEditForm-name').setAttribute(
			'style', 'background-image: url(https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_'+this.value+'.png)');
	}
}


function pokemonEditFormSubmit(){
	var pokemonName = document.getElementById('pokemonEditForm-name').value.toLowerCase();
	
	var fmoves = [], fmoves_legacy = [], fmoves_exclusive = [], cmoves = [], cmoves_legacy = [], cmoves_exclusive = [];
	document.getElementById('pokemonEditForm-fmoves').value.split(',').forEach(function(moveName){
		moveName = moveName.trim().toLowerCase();
		if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
			if (get_fmove_index_by_name(moveName.substring(0,moveName.length - 2)) >= 0)
				fmoves_exclusive.push(moveName.substring(0,moveName.length - 2));
		}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
			if (get_fmove_index_by_name(moveName.substring(0,moveName.length - 1)) >= 0)
				fmoves_legacy.push(moveName.substring(0,moveName.length - 1));
		}else{
			if (get_fmove_index_by_name(moveName) >= 0)
				fmoves.push(moveName);
		}
	});
	document.getElementById('pokemonEditForm-cmoves').value.split(',').forEach(function(moveName){
		moveName = moveName.trim().toLowerCase();
		if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
			if (get_cmove_index_by_name(moveName.substring(0,moveName.length - 2)) >= 0)
				cmoves_exclusive.push(moveName.substring(0,moveName.length - 2));
		}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
			if (get_cmove_index_by_name(moveName.substring(0,moveName.length - 1)) >= 0)
				cmoves_legacy.push(moveName.substring(0,moveName.length - 1));
		}else{
			if (get_cmove_index_by_name(moveName) >= 0)
				cmoves.push(moveName);
		}
	});
	
	var pkm = {
		name: pokemonName,
		baseAtk: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseAtk').value)),
		baseDef: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseDef').value)),
		baseStm: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseStm').value)),
		pokeType1: document.getElementById('pokemonEditForm-pokeType1').value.toLowerCase(),
		pokeType2: document.getElementById('pokemonEditForm-pokeType2').value.toLowerCase(),
		fastMoves : fmoves,
		fastMoves_legacy : fmoves_legacy,
		fastMoves_exclusive : fmoves_exclusive,
		chargedMoves : cmoves,
		chargedMoves_legacy : cmoves_legacy,
		chargedMoves_exclusive : cmoves_exclusive
	};
	
	var idx = get_species_index_by_name(pokemonName);
	if (idx >= 0){
		for (var attr in pkm){
			POKEMON_SPECIES_DATA[idx][attr] = pkm[attr];
		}
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been updated.', false, 'pokemonEditForm-feedback');
	}else{
		pkm.dex = 0;
		pkm.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pkm.rating = 0;
		POKEMON_SPECIES_DATA.push(pkm);
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been added.', false, 'pokemonEditForm-feedback');
	}
	autocompletePokemonEditForm();
}

function autocompletePokemonEditForm(){	
	$( '#pokemonEditForm-name' ).autocomplete({
		appendTo : '#pokemonEditForm',
		minLength : 0,
		delay : 0,
		source: getPokemonSpeciesOptions(-1),
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item:{value:$(this).val()}});
		},
		change : function(event, ui) {
			var pkm_idx = get_species_index_by_name(this.value);			
			if (pkm_idx >= 0){
				var pkmInfo = POKEMON_SPECIES_DATA[pkm_idx];
				
				var fmoves_exp = pkmInfo.fastMoves.join(', ');
				if (pkmInfo.fastMoves_legacy.length > 0){
					if (fmoves_exp.length > 0) fmoves_exp += ', ';
					fmoves_exp += pkmInfo.fastMoves_legacy.join('*, ') + '*';
				}
				if (pkmInfo.fastMoves_exclusive.length > 0){
					if (fmoves_exp.length > 0) fmoves_exp += ', ';
					fmoves_exp += pkmInfo.fastMoves_exclusive.join('**, ') + '**';
				}
				
				var cmoves_exp = pkmInfo.chargedMoves.join(', ');
				if (pkmInfo.chargedMoves_legacy.length > 0){
					if (cmoves_exp.length > 0) cmoves_exp += ', ';
					cmoves_exp += pkmInfo.chargedMoves_legacy.join('*, ') + '*';
				}
				if (pkmInfo.chargedMoves_exclusive.length > 0){
					if (cmoves_exp.length > 0) cmoves_exp += ', ';
					cmoves_exp += pkmInfo.chargedMoves_exclusive.join('**, ') + '**';
				}
				
				this.setAttribute('style', 'background-image: url(' + POKEMON_SPECIES_DATA[pkm_idx].icon + ')');
				document.getElementById('pokemonEditForm-name').value = toTitleCase(POKEMON_SPECIES_DATA[pkm_idx].name);
				document.getElementById('pokemonEditForm-pokeType1').value = POKEMON_SPECIES_DATA[pkm_idx].pokeType1;
				document.getElementById('pokemonEditForm-pokeType2').value = POKEMON_SPECIES_DATA[pkm_idx].pokeType2;
				document.getElementById('pokemonEditForm-baseAtk').value = POKEMON_SPECIES_DATA[pkm_idx].baseAtk;
				document.getElementById('pokemonEditForm-baseDef').value = POKEMON_SPECIES_DATA[pkm_idx].baseDef;
				document.getElementById('pokemonEditForm-baseStm').value = POKEMON_SPECIES_DATA[pkm_idx].baseStm;
				document.getElementById('pokemonEditForm-fmoves').value = toTitleCase(fmoves_exp);
				document.getElementById('pokemonEditForm-cmoves').value = toTitleCase(cmoves_exp);
			}
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_pokemon_item;
	
	document.getElementById('pokemonEditForm-name' ).onfocus = function(){$(this).autocomplete("search", "");}
}


function userEditFormAddUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	send_feedback("Connecting to server...", false, 'userEditForm-feedback');
	
	$.ajax({ 
		url: '/user-pokemon-json-list?new&uid_raw=' + userID,
		dataType: 'json',
		success: function(data){
			var importedBox = processUserPokeboxRawData(data);
			USERS_INFO.push({id: userID, box: importedBox});
			relabelAll();
			udpateUserTable();
			send_feedback("Successfully imported user " + userID + " with " + importedBox.length + " Pokemon", false, 'userEditForm-feedback');
		},
		error: function(){
			send_feedback("Failed to import user " + userID, false, 'userEditForm-feedback');
		}
	});
}

function userEditFormRemoveUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	var userIdxToRemove = -1;
	for (var i = 0; i < USERS_INFO.length; i++){
		if (USERS_INFO[i].id == userID)
			userIdxToRemove = i;
	}
	if (userIdxToRemove >= 0){
		USERS_INFO.splice(userIdxToRemove, 1);
		relabelAll();
		udpateUserTable();
		send_feedback("Successfully removed user " + userID, false, 'userEditForm-feedback');
	}else{
		send_feedback("No user with ID " + userID + " was found", false, 'userEditForm-feedback');
	}
}


function udpateUserTable(){
	var table = document.getElementById('userEditForm-userTable');
	table.children[1].innerHTML = '';
	for (var i = 0; i < USERS_INFO.length; i++){
		table.children[1].appendChild(createRow([i+1, USERS_INFO[i].id, USERS_INFO[i].box.length],'td'));
	}
}