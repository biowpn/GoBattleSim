/* GBS_UI_2_dom.js */

function createAttackerNode(){
	var pokemonNode = createElement('div', '', {class: 'section-body section-pokemon-node'});
	pokemonNode.appendChild(document.createElement('div'));
	pokemonNode.appendChild(document.createElement('div'));
	pokemonNode.appendChild(document.createElement('div'));
	
	// 1. Head
	pokemonNode.children[0].setAttribute('class', 'section-node-head');
	pokemonNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Pokemon</span>";
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePokemonButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePokemonButton.onclick = function(){
		$('#ui-pokemonbody_' + this.id.split('_')[1]).slideToggle('fast');
	}
	controlButtonDiv.appendChild(minimizePokemonButton);
	
	var copyPokemonButton = createElement('button','<i class="fa fa-files-o" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Copy'
	});
	copyPokemonButton.onclick = function(){
		var pokemonNodeToCopyFrom = document.getElementById('ui-pokemon_' + this.id.split('_')[1]);
		LocalData.PokemonClipboard = parseAttackerNode(pokemonNodeToCopyFrom);
		saveLocalData();
	}
	controlButtonDiv.appendChild(copyPokemonButton);
	
	var pastePokemonButton = createElement('button','<i class="fa fa-clipboard" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Paste'
	});
	pastePokemonButton.onclick = function(){
		var pokemonNodeToPasteTo = document.getElementById('ui-pokemon_' + this.id.split('_')[1]);
		if (LocalData.PokemonClipboard)
			writeAttackerNode(pokemonNodeToPasteTo, LocalData.PokemonClipboard);
	}
	controlButtonDiv.appendChild(pastePokemonButton);
	
	var removePokemonButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Remove'
	});
	removePokemonButton.onclick = function(){
		var pokemonNodeToRemove = document.getElementById('ui-pokemon_' + this.id.split('_')[1]);
		if (pokemonNodeToRemove.parentNode.children.length > 1){
			pokemonNodeToRemove.parentNode.removeChild(pokemonNodeToRemove);
			relabelAll();
		}else{
			send_feedback_dialog("Cannot remove the only Pokemon of the party.");
		}
	}
	controlButtonDiv.appendChild(removePokemonButton);
	
	pokemonNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=75%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['',''],'td'));
	
	var speciesInput = createElement('input','',{
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', 
		style: 'background-image: url(' + getPokemonIcon({dex: 0}) + ')', index: -1, box_index: -1
	});
	autocompletePokemonNodeSpecies(speciesInput);
	tb1.children[1].children[0].appendChild(speciesInput);
	
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
	
	var fmoveInput = createElement('input','',{
		type: 'text', placeholder: 'Fast Move', index: -1,
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(fmoveInput);
	tb3.children[1].children[0].appendChild(fmoveInput);
	var cmoveInput = createElement('input','',{
		type: 'text', placeholder: 'Charged Move', index: -1,
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(cmoveInput);
	tb3.children[1].children[1].appendChild(cmoveInput);

	stratSelect = createElement('select', '');
	stratSelect.appendChild(createElement('option', 'No Dodge', {value: 0}));
	stratSelect.appendChild(createElement('option', 'Dodge Charged', {value: 1}));
	stratSelect.appendChild(createElement('option', 'Dodge All', {value: 2}));
	tb3.children[1].children[2].appendChild(stratSelect);
	
	pokemonNode.children[1].appendChild(tb1);
	pokemonNode.children[1].appendChild(tb2);
	pokemonNode.children[1].appendChild(tb3);
	
	// 3. Tail
	
	return pokemonNode;
}

function createPartyNode(){
	var partyNode = createElement('div', '', {class: 'section-body section-party-node'});
	partyNode.appendChild(document.createElement('div'));
	partyNode.appendChild(document.createElement('div'));
	partyNode.appendChild(document.createElement('div'));
	
	// 1. Head
	partyNode.children[0].setAttribute('class', 'section-node-head');
	partyNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Party</span>";
	
	var partyNameInput = createElement('input','', {
		type: 'text', style: 'width: 30%; display: inline-block; text-align: center;'
	});
	$(partyNameInput).autocomplete({
		minLength : 0,
		delay : 0,
		source : function(request, response){
			var matches = [];
			var playerIdx = -1;
			for (var i = 0; i < this.bindings.length; i++){
				if (this.bindings[i].id && this.bindings[i].id.includes('party-name_')){
					playerIdx = parseInt(this.bindings[i].id.split('_')[1].split('-')[0]);
					break;
				}
			}
			if (playerIdx >= 0 && playerIdx < Data.Users.length){
				for (var i = 0; i < Data.Users[playerIdx].parties.length; i++){
					var party = Data.Users[playerIdx].parties[i];
					if (party.name.includes(request.term)){
						matches.push({
							label: party.name, partyConfig: party, isLocal: false
						});
					}
				}
			}
			for (var i = 0; i < LocalData.BattleParties.length; i++){
				var party = LocalData.BattleParties[i];
				if (party.name.includes(request.term)){
					matches.push({
						label: '[Local] ' + party.name, partyConfig: party, isLocal: true
					});
				}
			}
			response(matches);
		},
		select : function(event, ui) {
			writePartyNode($('#ui-party_' + this.id.split('_')[1])[0], ui.item.partyConfig);
			relabelAll();
		}
	});
	partyNameInput.onfocus = function(){$(this).autocomplete("search", "");}
	partyNode.children[0].appendChild(partyNameInput);
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePartyButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePartyButton.onclick = function(){
		$('#ui-partybody_' + this.id.split('_')[1]).slideToggle('fast');
	}
	controlButtonDiv.appendChild(minimizePartyButton);
	
	var savePartyButton = createElement('button','<i class="fa fa-floppy-o" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Save'
	});
	savePartyButton.onclick = function(){
		var partyAddress = this.id.split('_')[1], partyName = $('#party-name_' + partyAddress)[0].value;
		if (partyName.substring(0,7) == '[Local]')
			partyName = partyName.substring(8);
		if (partyName.length > 0){
			var party = parsePartyNode($('#ui-party_' + partyAddress)[0]);
			party.name = partyName;
			insertEntry(party, LocalData.BattleParties);
			send_feedback_dialog('Party "' + partyName + '" has been saved!');
		}
	}
	controlButtonDiv.appendChild(savePartyButton);
	
	var removePartyButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePartyButton.onclick = function(){
		var partyAddress = this.id.split('_')[1];
		var partyNodeToRemove = document.getElementById('ui-party_' + partyAddress);
		var partyName = document.getElementById('party-name_' + partyAddress).value;
		if (partyName.substring(0,7) == '[Local]')
			partyName = partyName.substring(8);
		var askForConfirm = getEntryIndex(partyName, LocalData.BattleParties) >= 0;
		if (partyNodeToRemove.parentNode.children.length > 1){
			partyNodeToRemove.parentNode.removeChild(partyNodeToRemove);
			relabelAll();
		}else if (!askForConfirm){
			send_feedback_dialog("Cannot remove the only party of the player.");
		}
		if (askForConfirm){
			var removePartyDialog = createElement('div', 'Do you want to remove party "' + partyName + '" from saved parties?');
			$(removePartyDialog).dialog({
				buttons: [{
					text: "Yes",
					style: 'width: 40%; float: left;',
					click: function() {
						removeEntry(partyName, LocalData.BattleParties);
						saveLocalData();
						$(this).dialog("close");
					}
				},{
					text: "No",
					style: 'width: 40%; float: right;',
					click: function(){
						$(this).dialog("close");
					}
				}]
			}).dialog('open');
		}
	}
	controlButtonDiv.appendChild(removePartyButton);
	
	partyNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	partyNode.children[1].appendChild(createAttackerNode());
	$( partyNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	partyNode.children[2].style = "width:100%";
	partyNode.children[2].innerHTML = "<label style='width:50%'>Max Revive<input type='checkbox'></label>";
	
	var addPokemonButton = createElement("button", "Add Pokemon");
	addPokemonButton.style = "width:50%";
	addPokemonButton.onclick = function(){
		if (countPokemonFromParty(this.id.split('_')[1]) < MAX_NUM_POKEMON_PER_PARTY){
			var partyNodeToAddPokemon = document.getElementById('ui-party_' + this.id.split('_')[1]);
			partyNodeToAddPokemon.children[1].appendChild(createAttackerNode());
			relabelAll();
		}else{
			send_feedback_dialog("Exceeding Maximum number of Pokemon per party.");
		}
	}
	partyNode.children[2].appendChild(addPokemonButton);
	$( partyNode.children[2] ).controlgroup();
	
	return partyNode;
}

function createPlayerNode(){
	var playerNode = createElement('div', '', {class: 'section-body section-player-node'});
	playerNode.appendChild(document.createElement('div'));
	playerNode.appendChild(document.createElement('div'));
	playerNode.appendChild(document.createElement('div'));
	
	// 1. Head
	playerNode.children[0].setAttribute('class', 'section-node-head');
	playerNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Player</span>";
	
	var playerFriendLevelInput = createElement('select','', {
		style: 'width: 30%; display: inline-block; text-align: center;'
	});
	Data.FriendSettings.forEach(function(friendSetting){
		playerFriendLevelInput.appendChild(createElement('option', friendSetting.label, {value: friendSetting.name}));
	});
	
	playerNode.children[0].appendChild(playerFriendLevelInput);
	
	var controlButtonDiv = document.createElement('div');
	controlButtonDiv.setAttribute('class', 'section-buttons-panel');
	
	var minimizePlayerButton = createElement('button','<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Minimize'
	});
	minimizePlayerButton.onclick = function(){
		$('#ui-playerbody_' + this.id.split('_')[1]).slideToggle('fast');
	}
	controlButtonDiv.appendChild(minimizePlayerButton);
	
	var removePlayerButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePlayerButton.onclick = function(){
		if (document.getElementById('ui-attackerinputbody').children.length > 1){
			var playerNodeToRemove = document.getElementById('ui-player_' + this.id.split('_')[1]);
			playerNodeToRemove.parentNode.removeChild(playerNodeToRemove);
			relabelAll();
			document.getElementById('ui-addplayerbutton').disabled = false;
		}else{
			send_feedback_dialog("Cannot remove the only player");
		}
	}
	controlButtonDiv.appendChild(removePlayerButton);
	
	playerNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	$( playerNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	playerNode.children[2].style = "width:100%";
	var addPartyButton = createElement("button", "Add Party", {class: 'player_button'});
	addPartyButton.onclick = function(){
		var playerNodeToAddPartyTo = document.getElementById('ui-player_' + this.id.split('_')[1]);
		if(playerNodeToAddPartyTo.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER){
				playerNodeToAddPartyTo.children[1].appendChild(createPartyNode());
				relabelAll();
		}else{
			send_feedback_dialog("Exceeding Maximum number of Parties per player.");
		}
	}
	playerNode.children[2].appendChild(addPartyButton);
	$( playerNode.children[2] ).controlgroup();
	
	return playerNode;
}

function addPlayerNode(){
var attackerFieldBody = document.getElementById("AttackerInput").children[1];
	if (attackerFieldBody.children.length < MAX_NUM_OF_PLAYERS){
		attackerFieldBody.appendChild(createPlayerNode());
		relabelAll();
	}else{
		document.getElementById('ui-addplayerbutton').setAttribute('disabled', true);
		send_feedback_dialog('Exceeding maximum number of players.');
	}
}

function relabelAll(){
	var playerNodes = document.getElementById("ui-attackerinputbody").children;
	for (var i = 0; i < playerNodes.length; i++){
		var playerNode = playerNodes[i];
		playerNode.id = 'ui-player_' + i;
		playerNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][0]);
		
		playerNode.children[0].children[0].innerHTML = "Player " + (i+1);
		playerNode.children[0].children[1].children[0].id = 'minimize-player_' + i;
		playerNode.children[0].children[1].children[1].id = "remove-player_" + i;
		
		playerNode.children[1].id = 'ui-playerbody_' + i;
		var partyNodes = playerNode.children[1].children;
		for (var j = 0; j < partyNodes.length; j++){
			var partyNode = partyNodes[j];
			partyNode.id = 'ui-party_' + i + '-' + j;
			partyNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][1]);
			
			partyNode.children[0].children[0].innerHTML = "Party " + (j+1);
			partyNode.children[0].children[1].id = 'party-name_' + i + '-' + j;
			partyNode.children[0].children[2].children[0].id = 'minimize-party_' + i + '-' + j;
			partyNode.children[0].children[2].children[1].id = 'save-party_' + i + '-' + j;
			partyNode.children[0].children[2].children[2].id = 'remove-party_' + i + '-' + j;
			
			partyNode.children[1].id = 'ui-partybody_' + i + '-' + j;
			var pokemonNodes = partyNode.children[1].children;
			for (var k = 0; k < pokemonNodes.length; k++){
				var pokemonNode = pokemonNodes[k];
				pokemonNode.id = 'ui-pokemon_' + i + '-' + j + '-' + k;
				pokemonNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][2]);
				
				pokemonNode.children[0].id = 'ui-pokemonhead_' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[0].innerHTML = 'Pokemon ' + (k+1);
				pokemonNode.children[0].children[1].children[0].id = 'minimize-pokemon_' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[1].id = 'copy-pokemon_' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[2].id = 'paste-pokemon_' + i + '-' + j + '-' + k;
				pokemonNode.children[0].children[1].children[3].id = 'remove-pokemon_' + i + '-' + j + '-' + k;
				
				pokemonNode.children[1].id = 'ui-pokemonbody_' + i + '-' + j + '-' + k;
				var tables = pokemonNode.children[1].children;
				tables[0].children[1].children[0].children[0].id = 'ui-species_' + i + '-' + j + '-' + k;
				tables[0].children[1].children[1].children[0].id = 'ui-copies_' + i + '-' + j + '-' + k;
				tables[2].children[1].children[0].children[0].id = 'fmove_' + i + '-' + j + '-' + k;
				tables[2].children[1].children[1].children[0].id = 'cmove_' + i + '-' + j + '-' + k;
			}
			partyNode.children[2].id = 'ui-partytail_' + i + '-' + j;
			partyNode.children[2].children[0]['id'] = 'revive-strategy-label_' + i + '-' + j;
			partyNode.children[2].children[0].id = 'revive-strategy_' + i + '-' + j;
			partyNode.children[2].children[1].id = 'add-pokemon_' + i + '-' + j;
		}
		playerNode.children[2].id = "ui-playertail_" + i;
		playerNode.children[2].children[0].id = "add-party_" + i;
	}
	$( '#ui-attackerinputbody' ).sortable({axis: 'y'});
}

function createDefenderNode(){
	var defenderNode = createElement('div', '', {id: 'ui-pokemon_d'});
	defenderNode.appendChild(document.createElement('div'));
	defenderNode.appendChild(document.createElement('div'));
	defenderNode.appendChild(document.createElement('div'));
	
	// 1. Head
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb1.appendChild(createRow(['']));
	var speciesInput = createElement('input','',{
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', id: 'ui-species_d',
		style: 'background-image: url(' + getPokemonIcon({dex: 0}) + ')', index: -1, box_index: -1
	});
	autocompletePokemonNodeSpecies(speciesInput);
	tb1.children[1].children[0].appendChild(speciesInput);

	// By default, set to Tier 5 raid
	var tb2 = createElement("table", "<colgroup><col width=100%></colgroup>");
	tb2.appendChild(createRow(['']));
	var raidSelection = document.createElement("select");
	raidSelection.id = "raidTier";
	for (var i = 1; i <= 5; i++)
		raidSelection.appendChild(createElement('option', 'Tier ' + i, {value: i}));
	raidSelection.children[4].setAttribute("selected", "selected");
	tb2.children[1].children[0].appendChild(raidSelection);
	
	var tb3 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb3.appendChild(createRow(['','']));
	
	var fmoveInput = createElement('input','',{
		type: 'text', placeholder: 'Fast Move', index: -1,
		class: 'input-with-icon move-input-with-icon', id: 'fmove_d', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(fmoveInput);
	tb3.children[1].children[0].appendChild(fmoveInput);
	var cmoveInput = createElement('input','',{
		type: 'text', placeholder: 'Charged Move', index: -1,
		class: 'input-with-icon move-input-with-icon', id: 'cmove_d', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(cmoveInput);
	tb3.children[1].children[1].appendChild(cmoveInput);
	
	defenderNode.children[1].appendChild(tb1);
	defenderNode.children[1].appendChild(tb2);
	defenderNode.children[1].appendChild(tb3);
	
	// 3. Tail
	
	return defenderNode;
}

function countPokemonFromParty(partyAddress){
	var partyNodeBody = document.getElementById('ui-partybody_' + partyAddress);
	var count = 0;
	for (var i = 0; i < partyNodeBody.children.length; i++){
		count += parseInt(document.getElementById('ui-copies_' + partyAddress + '-' + i).value) || 0;
	}
	return count;
}

function parseAttackerNode(node){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	var idx = parseInt(row1.children[0].children[0].getAttribute('index')), box_idx = parseInt(row1.children[0].children[0].getAttribute('box_index'));
	var nameInputValue = row1.children[0].children[0].value.trim();
	
	var pkm_cfg = {
		box_index : box_idx,
		index : idx >= 0 ? idx : getEntryIndex(nameInputValue.toLowerCase(), Data.Pokemon),
		fmove_index : parseInt(row3.children[0].children[0].getAttribute('index')),
		cmove_index : parseInt(row3.children[1].children[0].getAttribute('index')),
		species: idx >= 0 ? Data.Pokemon[idx].name : nameInputValue,
		copies: parseInt(row1.children[1].children[0].value) || 1,
		level: row2.children[0].children[0].value.trim(),
		stmiv: row2.children[1].children[0].value.trim(),
		atkiv: row2.children[2].children[0].value.trim(),
		defiv: row2.children[3].children[0].value.trim(),
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim(),
		dodge: row3.children[2].children[0].value,
		raid_tier: 0,
		stamp: ''
	};
	return pkm_cfg;
}

function parsePartyNode(node){
	var party_cfg = {
		name: node.children[0].children[1].value,
		revive_strategy: node.children[2].children[0].children[2].checked,
		pokemon_list: []
	};
	for (var k = 0; k < node.children[1].children.length; k++)
		party_cfg.pokemon_list.push(parseAttackerNode(node.children[1].children[k]));
	return party_cfg;
}

function parsePlayerNode(node){
	var player_cfg = {
		friend: node.children[0].children[1].value,
		party_list: []
	};
	for (var j = 0; j < node.children[1].children.length; j++)
		player_cfg.party_list.push(parsePartyNode(node.children[1].children[j]));
	return player_cfg;
}

function parseDefenderNode(node){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];
	
	var idx = parseInt(row1.children[0].children[0].getAttribute('index')), box_idx = parseInt(row1.children[0].children[0].getAttribute('box_index'));
	var nameInputValue = row1.children[0].children[0].value.trim();
	
	var pkm_cfg = {
		box_index : box_idx,
		index : idx >= 0 ? idx : getEntryIndex(nameInputValue.toLowerCase(), Data.Pokemon),
		fmove_index : parseInt(row3.children[0].children[0].getAttribute('index')),
		cmove_index : parseInt(row3.children[1].children[0].getAttribute('index')),
		atkiv: 15,
		defiv: 15,
		stmiv: 15,
		level: 40,
		species: idx >= 0 ? Data.Pokemon[idx].name : nameInputValue,
		fmove: row3.children[0].children[0].value.trim(),
		cmove: row3.children[1].children[0].value.trim(),
		stamp: ''
	};
	if (row2.children.length > 1){
		pkm_cfg['level'] = row2.children[0].children[0].value.trim();
		pkm_cfg['stmiv'] = row2.children[1].children[0].value.trim();
		pkm_cfg['atkiv'] = row2.children[2].children[0].value.trim();
		pkm_cfg['defiv'] = row2.children[3].children[0].value.trim();
		pkm_cfg['raid_tier'] = -1;
	}else{
		pkm_cfg['raid_tier'] = parseInt(document.getElementById("raidTier").value);
	}
	return pkm_cfg;
}

function readUserInput(){
	// 1. General Settings
	var gSettings = {};
	gSettings['battleMode'] = document.getElementById("battleMode").value;
	gSettings['immortalDefender'] = parseInt(document.getElementById("immortalDefender").value);
	gSettings['weather'] = document.getElementById("weather").value;
	gSettings['dodgeBug'] = parseInt(document.getElementById("dodgeBug").value);
	gSettings['simPerConfig'] = Math.max(1, parseInt(document.getElementById("simPerConfig").value));
	gSettings['reportType'] = document.getElementById("reportType").value;
	gSettings['logStyle'] = (gSettings['reportType'] == 'avrg' ? 0 : 1);

	
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
		dfdrSettings : dfdr_info
	};
}


function writeAttackerNode(node, pkmConfig){
	var row1 = node.children[1].children[0].children[1];
	var row2 = node.children[1].children[1].children[1];
	var row3 = node.children[1].children[2].children[1];

	var species_idx = pkmConfig.hasOwnProperty('index') ? pkmConfig.index : getEntryIndex((pkmConfig.name || pkmConfig.species).toLowerCase(), Data.Pokemon);
	row1.children[0].children[0].value = species_idx >= 0 ? Data.Pokemon[species_idx].label : toTitleCase(pkmConfig.name || pkmConfig.species);
	row1.children[0].children[0].setAttribute('index', species_idx);
	row1.children[0].children[0].setAttribute('box_index', pkmConfig.hasOwnProperty('box_index') ? pkmConfig.box_index : -1);
	row1.children[0].children[0].setAttribute('style', 'background-image: url(' + getPokemonIcon({index: species_idx}) + ')');
	if (pkmConfig.hasOwnProperty('copies'))
		row1.children[1].children[0].value = pkmConfig.copies;
	row2.children[0].children[0].value = pkmConfig.level;
	row2.children[1].children[0].value = pkmConfig.stmiv;
	row2.children[2].children[0].value = pkmConfig.atkiv;
	row2.children[3].children[0].value = pkmConfig.defiv;
	
	var fmove_idx = pkmConfig.hasOwnProperty('fmove_index') ? pkmConfig.fmove_index : getEntryIndex(pkmConfig.fmove.toLowerCase(), Data.FastMoves);
	row3.children[0].children[0].value = fmove_idx >= 0 ? Data.FastMoves[fmove_idx].label : toTitleCase(pkmConfig.fmove);
	row3.children[0].children[0].setAttribute('index', fmove_idx);
	row3.children[0].children[0].setAttribute('style', "background-image: url(" + getTypeIcon({mtype: 'f', index: fmove_idx}) + ')');
	var cmove_idx = pkmConfig.hasOwnProperty('cmove_index') ? pkmConfig.cmove_index : getEntryIndex(pkmConfig.cmove.toLowerCase(), Data.ChargedMoves);
	row3.children[1].children[0].value = cmove_idx >= 0 ? Data.ChargedMoves[cmove_idx].label : toTitleCase(pkmConfig.cmove);
	row3.children[1].children[0].setAttribute('index', cmove_idx);
	row3.children[1].children[0].setAttribute('style', "background-image: url(" + getTypeIcon({mtype: 'c', index: cmove_idx}) + ')');
	
	if (pkmConfig.hasOwnProperty('dodge'))
		row3.children[2].children[0].value = pkmConfig.dodge;
}

function writePartyNode(node, partyConfig){
	node.children[0].children[1].value = partyConfig.name || node.children[0].children[1].value;
	node.children[1].innerHTML = "";
	for (var k = 0; k < partyConfig.pokemon_list.length; k++){
		var pokemonNode = createAttackerNode();
		writeAttackerNode(pokemonNode, partyConfig.pokemon_list[k]);
		node.children[1].appendChild(pokemonNode);
	}
	node.children[2].children[0].children[2].checked = partyConfig.revive_strategy;
	$(node.children[2]).controlgroup('refresh');
}

function writePlayerNode(node, playerConfig){
	node.children[0].children[1].value = playerConfig.friend || 'stranger';
	node.children[1].innerHTML = "";
	for (var j = 0; j < playerConfig.party_list.length; j++){
		var partyNode = createPartyNode();
		writePartyNode(partyNode, playerConfig.party_list[j]);
		node.children[1].appendChild(partyNode);
	}
}

function writeDefenderNode(node, pkmConfig){
	var row1 = node.children[1].children[0].children[1];
	var row3 = node.children[1].children[2].children[1];

	var species_idx = pkmConfig.hasOwnProperty('index') ? pkmConfig.index : getEntryIndex((pkmConfig.name || pkmConfig.species).toLowerCase(), Data.Pokemon);
	row1.children[0].children[0].value = species_idx >= 0 ? Data.Pokemon[species_idx].label : toTitleCase(pkmConfig.name || pkmConfig.species);
	row1.children[0].children[0].setAttribute('index', species_idx);
	row1.children[0].children[0].setAttribute('box_index', pkmConfig.hasOwnProperty('box_index') ? pkmConfig.box_index : -1);
	row1.children[0].children[0].setAttribute('style', 'background-image: url(' + getPokemonIcon({index: species_idx}) + ')');
	if (pkmConfig.hasOwnProperty('copies'))
		row1.children[1].children[0].value = pkmConfig.copies;
	
	var fmove_idx = pkmConfig.hasOwnProperty('fmove_index') ? pkmConfig.fmove_index : getEntryIndex(pkmConfig.fmove.toLowerCase(), Data.FastMoves);
	row3.children[0].children[0].value = fmove_idx >= 0 ? Data.FastMoves[fmove_idx].label : toTitleCase(pkmConfig.fmove);
	row3.children[0].children[0].setAttribute('index', fmove_idx);
	row3.children[0].children[0].setAttribute('style', "background-image: url(" + getTypeIcon({mtype: 'f', index: fmove_idx}) + ')');
	var cmove_idx = pkmConfig.hasOwnProperty('cmove_index') ? pkmConfig.cmove_index : getEntryIndex(pkmConfig.cmove.toLowerCase(), Data.ChargedMoves);
	row3.children[1].children[0].value = cmove_idx >= 0 ? Data.ChargedMoves[cmove_idx].label : toTitleCase(pkmConfig.cmove);
	row3.children[1].children[0].setAttribute('index', cmove_idx);
	row3.children[1].children[0].setAttribute('style', "background-image: url(" + getTypeIcon({mtype: 'c', index: cmove_idx}) + ')');
	
	var tb2 = node.children[1].children[1];
	tb2.innerHTML = '';
	var mode = $("#battleMode").val();
	if (mode == 'gym'){
		tb2.innerHTML = "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>";
		tb2.appendChild(createRow(['','','','']));
		tb2.children[1].children[0].appendChild(createElement('input','',{placeholder: 'Level', value: pkmConfig['level'] || ""}));
		tb2.children[1].children[1].appendChild(createElement('input','',{placeholder: 'HP. IV', value: pkmConfig['stmiv'] || ""}));
		tb2.children[1].children[2].appendChild(createElement('input','',{placeholder: 'Atk. IV', value: pkmConfig['atkiv'] || ""}));
		tb2.children[1].children[3].appendChild(createElement('input','',{placeholder: 'Def. IV', value: pkmConfig['defiv'] || ""}));
	}else{ // raid
		tb2.innerHTML = "<colgroup><col width=100%></colgroup>";
		tb2.appendChild(createRow(['']));
		var raidSelection = createElement('select', '', {id: 'raidTier'});
		for (var i = 0; i < Data.RaidTierSettings.length; i++){
			raidSelection.appendChild(createElement('option', Data.RaidTierSettings[i].label, {value: Data.RaidTierSettings[i].name}));
		}
		tb2.children[1].children[0].appendChild(raidSelection);
		tb2.children[1].children[0].children[0].value = pkmConfig['raid_tier'] || 5;
	}
}

function updateDefenderNode(mode){
	var defenderNode = document.getElementById('ui-pokemon_d');
	var curDefenderConfig = parseDefenderNode(defenderNode);
	if (mode == 'raid'){
		var pkm = Data.Pokemon[curDefenderConfig.index];
		if (pkm && pkm.marker_1){
			curDefenderConfig.raid_tier = parseInt(pkm.marker_1.split(" ")[0]) || 5;
		}
	}else if (mode == 'gym'){
		curDefenderConfig.raid_tier = -1;
	}
	writeDefenderNode(defenderNode, curDefenderConfig);
}

function writeUserInput(cfg){
	for (var attr in cfg['generalSettings']){
		$("#" + attr).val(cfg['generalSettings'][attr]);
	}
	
	var attackerFieldBody = document.getElementById("AttackerInput").children[1];
	attackerFieldBody.innerHTML = "";
	for (var i = 0; i < cfg['atkrSettings'].length; i++){
		var playerNode = createPlayerNode();
		writePlayerNode(playerNode, cfg['atkrSettings'][i]);
		attackerFieldBody.appendChild(playerNode);
	}
	relabelAll();
	
	writeDefenderNode(document.getElementById('ui-pokemon_d'), cfg['dfdrSettings']);
}


function clearFeedbackTables(){
	document.getElementById("feedback_buttons").innerHTML = "";
	document.getElementById("feedback_table1").innerHTML = "";
	document.getElementById("feedback_table2").innerHTML = "";
}

function clearAllSims(){
	initMasterSummaryTableMetrics();
	MasterSummaryTableMetrics = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_METRICS));
	send_feedback("");
	simResults = [];
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0]);
	displayMasterSummaryTable();
}

function createMasterSummaryTable(){
	var table = createElement('table','<thead></thead><tfoot></tfoot><tbody></tbody>',{
		width:'100%', id :'ui-mastersummarytable', cellspacing:'0', class : 'display nowrap'
	});
	var headers = ['#'];
	for (var m in MasterSummaryTableMetrics){
		headers.push(MasterSummaryTableMetrics[m]);
	}
	headers.push('Detail');
	table.children[0].appendChild(createRow(headers,"th"));
	table.children[1].appendChild(createRow(headers,"th"));
	for (var i = 0; i < simResults.length; i++){
		var sim = simResults[i];
		var row = [i+1];
		for (var m in MasterSummaryTableMetrics){
			if (m[0] == '*'){
				m = m.slice(1);
				var pkmInfo = getPokemonInfoFromAddress(sim.input, m.split('.')[0]), attr = m.split('.')[1];
				if (attr == 'species'){
					pkmInfo.icon = pkmInfo.icon || Data.Pokemon[pkmInfo.index].icon;
					pkmInfo.label = pkmInfo.label || Data.Pokemon[pkmInfo.index].label;
					row.push(createIconLabelDiv2(pkmInfo.icon, pkmInfo.label, 'species-input-with-icon'));
				}else if (attr == 'fmove'){
					var moveData = Data.FastMoves[pkmInfo.fmove_index];
					row.push(createIconLabelDiv2(moveData.icon, moveData.label, 'move-input-with-icon'));
				}else if (attr == 'cmove'){
					var moveData = Data.ChargedMoves[pkmInfo.cmove_index];
					row.push(createIconLabelDiv2(moveData.icon, moveData.label, 'move-input-with-icon'));
				}else{
					row.push(pkmInfo[attr]);
				}
			}else if (m == 'weather'){
				row.push(sim.input.generalSettings.weather);
			}else
				row.push(sim.output.generalStat[m]);
		}
		row.push("<a onclick='displayDetail("+i+")' style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>");
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
	table.appendChild(createRow(["<img src='" + getPokemonIcon({dex: 0}) + "'></img>",
								"HP", "Energy", "TDO", "Duration", "DPS", "Detail"], 'th'));
	for (var i = 0; i < pokemonStats.length; i++){
		var ps = pokemonStats[i];
		var row = createRow(["<img src='" + getPokemonIcon({name: ps.name}) + "' class='apitem-pokemon-icon'></img>", 
			ps.hp, ps.energy, ps.tdo, ps.duration, ps.dps, "<a style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>"], 'td');
		
		const ps_const = JSON.parse(JSON.stringify(ps));
		row.children[row.children.length - 1].children[0].onclick = function(){
			var pokemonDialog = createElement('div', '', {title: 'Pokemon Detail'});
			var pokemonTable = createElement('table', '');
			for (var attr in ps_const){
				pokemonTable.appendChild(createElement('tr',"<th>" + attr + "</th><td>" + ps_const[attr] + "</td>"));
			}
			pokemonDialog.appendChild(pokemonTable);
			$(pokemonDialog).dialog().dialog('open');
		};
		table.appendChild(row);
	}
	return table;
}

function displayMasterSummaryTable(){
	clearFeedbackTables();
	document.getElementById("feedback_buttons").innerHTML = "<button onclick='clearAllSims()'>Clear All</button>";
	
	var table = createMasterSummaryTable();
	document.getElementById("feedback_table1").appendChild(table);
	
	table = $( '#ui-mastersummarytable' ).DataTable({
		scroller: true,
        scrollX: true,
		scrollY: '60vh'
	});
	
	addFilterToFooter(table);
}

function displayDetail(i){
	clearFeedbackTables();
	// pre-configured to the user's input
	writeUserInput(simResults[i].input);

	// Add option to go back to Master Summary
	var b = createElement("button","Back");
	b.onclick = function(){
		$( "#feedback_table1" ).accordion("destroy");
		$( "#feedback_table2" ).accordion("destroy");
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	
	// Prepare Player/Party/Pokemon summary
	var output = simResults[i].output;
	var fbSection = document.getElementById("feedback_table1");
	for (var i = 0; i < output.pokemonStats.length - 1; i++){
		fbSection.appendChild(createElement('h4',createPlayerStatisticsString(output.playerStats[i]), 
			{style: 'background:' + HSL_COLORS[i%HSL_COLORS.length][0]}));
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
	var table = createElement('table','<thead></thead><tbody></tbody>',{
		width:'100%', class:'display nowrap'
	});

	var attrs = ['t'], headers = ["Time"];
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
			var entry = rawEntry[attr];
			if (entry.type == 'pokemon'){
				var pkmInfo = getEntry(entry.name, Data.Pokemon);
				rawEntry[attr] = createIconLabelDiv(pkmInfo.icon, entry.nickname, 'apitem-pokemon-icon');
			}else if (entry.type == 'fmove'){
				var moveInfo = getEntry(entry.name, Data.FastMoves);
				rawEntry[attr] = createIconLabelDiv(moveInfo.icon, moveInfo.label, 'apitem-move-icon');
			}else if (entry.type == 'cmove'){
				var moveInfo = getEntry(entry.name, Data.ChargedMoves);
				rawEntry[attr] = createIconLabelDiv(moveInfo.icon, moveInfo.label, 'apitem-move-icon');
			}else{ // entry.type == 'text'
				rawEntry[attr] = entry.text;
			}
		}
		var rowData = [];
		attrs.forEach(function(a){
			rowData.push(rawEntry[a]);
		});
		var row = createRow(rowData);
		for (var k = 0; k < row.children.length - 2; k++){
			row.children[k+1].setAttribute('style','background:' + HSL_COLORS[k%HSL_COLORS.length][0]);
		}
		table.children[1].appendChild(row, "td");
	}
	return table;
}