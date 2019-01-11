/* GBS_UI_2_dom.js */

/**
	@file Define major UI Widgets.
	@author BIOWP
*/

function createMinimizeButton(parentName){
	const pName = parentName;
	var button = createElement("button", '<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: "button-icon", title: "Minimize"
	});
	button.onclick = function(){
		$($$$(this).parent(pName).node.children[1]).slideToggle('fast');
	}
	return button;
}


function createCopyPokemonButton(){
	var copyPokemonButton = createElement('button','<i class="fa fa-files-o" aria-hidden="true"></i>', {
		class: "button-icon", title: "Copy"
	});
	copyPokemonButton.onclick = function(){
		LocalData.PokemonClipboard = read($$$(this).parent("pokemon").node);
		saveLocalData();
	}
	return copyPokemonButton;
}


function createPastePokemonButton(){
	var pastePokemonButton = createElement('button','<i class="fa fa-clipboard" aria-hidden="true"></i>', {
		class: "button-icon", title: "Paste"
	});
	pastePokemonButton.onclick = function(){
		var pokemonNode = $$$(this).parent("pokemon").node;
		write(pokemonNode, LocalData.PokemonClipboard || {});
		formatting(pokemonNode);
	}
	return pastePokemonButton;
}


function createRemovePokemonButton(){
	var removePokemonButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: "button-icon", title: "Remove"
	});
	removePokemonButton.onclick = function(){
		var pokemonNode = $$$(this).parent("pokemon").node;
		if (pokemonNode.parentNode.children.length > 1){
			pokemonNode.parentNode.removeChild(pokemonNode);
		}else{
			sendFeedbackDialog("Cannot remove the only Pokemon of the party.");
		}
		relabel();
	}
	return removePokemonButton;
}


function createPokemonRoleInput(){
	var roleInput = createElement("select", "", {name: "pokemon-role"});
	roleInput.appendChild(createElement('option', 'Attacker', {value: "a"}));
	roleInput.appendChild(createElement('option', 'Attacker Basic', {value: "a_basic"}));
	roleInput.appendChild(createElement('option', 'Gym Defender', {value: "gd"}));
	roleInput.appendChild(createElement('option', 'Gym Defender Basic', {value: "gd_basic"}));
	roleInput.appendChild(createElement('option', 'Raid Boss', {value: "rb"}));
	roleInput.appendChild(createElement('option', 'Raid Boss Immortal', {value: "RB"}));
	roleInput.onchange = function(){
		var pokemonNode = $$$(this).parent("pokemon").node;
		for (var i = 0; i < pokemonNode.children[1].children.length; i++){
			var child = pokemonNode.children[1].children[i];
			if (child.hasAttribute("for_roles")){
				let roles = child.getAttribute("for_roles").split(";");
				if (roles.includes(this.value)){
					child.removeAttribute("hidden");
				}else{
					child.setAttribute("hidden", true);
				}
			}
		}
		var strategyNode = $$$(pokemonNode).child("pokemon-strategy").node;
		if ((this.value == "a" || this.value == "a_basic")){
			if (strategyNode.value == "strat0")
				strategyNode.value = "strat1";
		}else{
			strategyNode.value = "strat0";
		}
	}
	roleInput.comply = function(kwargs){
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				if (kwargs.battleMode == "raid"){
					if (this.value.toLowerCase() != "rb"){
						this.value = "rb";
					}
				}else{
					this.value = "gd";
				}
				this.onchange();
				//this.disabled = true;
			}
		}else if (kwargs.battleMode == "pvp"){
			this.value = "a";
			this.onchange();
		}
	}
	return roleInput;
}


function createPokemonCopiesInput(){
	var copiesInput = createElement('input', '', {
		type: 'number', placeholder: 'Copies', title: "Number of copies",
		min: 1, max: 6, value: 1, name: "pokemon-copies"
	});
	copiesInput.onchange = function(){
		var pokemonCount = countPokemonFromParty($$$(this).parent("party").node);
		if (pokemonCount > MAX_NUM_POKEMON_PER_PARTY){
			this.value -= pokemonCount - MAX_NUM_POKEMON_PER_PARTY;
		}
		if (this.value < 1)
			this.value = 1;
	}
	copiesInput.comply = function(kwargs){
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				this.value = 1;
				this.disabled = true;
			}
		}
	}
	return copiesInput;
}


function createPokemonRaidTierInput(){
	var raidTierInput = createElement("select", "", {
		name: "pokemon-raidTier"
	});
	for (let raidTier of Data.RaidTierSettings){
		raidTierInput.appendChild(createElement('option', raidTier.label, {value: raidTier.name}));
	}
	raidTierInput.onchange = function(){
		this.comply({battleMode: $("#battleMode").val()});
	}
	raidTierInput.comply = function(kwargs){
		if (kwargs.battleMode == "raid"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				var timelimitInput = document.getElementById("timelimit");
				if (parseInt(this.value) <= 4){
					timelimitInput.value = Data.BattleSettings.timelimitRaidMs;
				}else{
					timelimitInput.value = Data.BattleSettings.timelimitLegendaryRaidMs;
				}
			}
		}
	}
	return raidTierInput;
}


function createPokemonStrategyInput(){
	var strategyInput = createElement('select', '', {name: "pokemon-strategy"});
	strategyInput.appendChild(createElement('option', 'No Dodge', {value: "strat1"}));
	strategyInput.appendChild(createElement('option', 'No Dodge Burst', {value: "strat4"}));
	strategyInput.appendChild(createElement('option', 'Dodge Charged', {value: "strat2"}));
	strategyInput.appendChild(createElement('option', 'Dodge All', {value: "strat3"}));
	strategyInput.appendChild(createElement('option', 'Defender AI', {value: "strat0"}));
	strategyInput.comply = function(kwargs){
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				this.value = "strat0";
				this.disabled = true;
			}
		}else if (kwargs.battleMode == "pvp"){
			this.value = "strat1";
			var strat2 = $$$(this).parent("pokemon").child("pokemon-strategy2").node;
			this.setAttribute("hidden", true);
			strat2.removeAttribute("hidden");
		}
	}
	return strategyInput;
}


function createPokemonProtectStrategyInput(){
	var strategyInput = createElement('input', '0,0', {name: "pokemon-strategy2", placeholder: "Protect Shield Strategy", 
		title: "{n_1,n_2}: tank n_i attacks then use the i-th Shield. * = infinity, ? = random"
	});
	strategyInput.comply = function(kwargs){
		if (kwargs.battleMode != "pvp"){
			var strat1 = $$$(this).parent("pokemon").child("pokemon-strategy").node;
			this.setAttribute("hidden", true);
			strat1.removeAttribute("hidden");
		}
	}
	return strategyInput;
}

function createPartyNameInput(){
	var partyNameInput = createElement('input', '', {
		type: "text", style: "width: 30%; display: inline-block; text-align: center;", name: "party-name"
	});
	$( partyNameInput ).autocomplete({
		minLength: 0,
		delay: 0,
		source: function(request, response){
			var matches = [];
			for (let player of Data.Users){
				for (let party of player.parties){
					if (party.name.includes(request.term)){
						matches.push(party);
					}
				}
			}
			for (let party of LocalData.BattleParties){
				if (party.name.includes(request.term)){
					matches.push(party);
				}
			}
			response(matches);
		},
		select: function(event, ui){
			var partyNode = $$$(this).parent("party").node;
			write(partyNode, ui.item);
			comply(partyNode, {battleMode: $("#battleMode").val()});
			formatting(partyNode);
			relabel();
		}
	});
	partyNameInput.comply = function(kwargs){
		if (kwargs.battleMode == "raid"){
			var playerNode = $$$(this).parent("player");
			if (playerNode.child("player-team").val() == "1"){
				let pokemonNodes = $$$(this).parent("party").child("party-pokemon").node;
				while (pokemonNodes.children.length > 1){
					pokemonNodes.removeChild(pokemonNodes.lastChild);
				}
			}
		}
	}
	partyNameInput.onfocus = function(){
		$(this).autocomplete("search", "");
	}
	return partyNameInput;
}


function createSavePartyButton(){
	var savePartyButton = createElement('button','<i class="fa fa-floppy-o" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Save'
	});
	savePartyButton.onclick = function(){
		var partyNode = $$$(this).parent("party").node;
		var partyName = $$$(partyNode).child("party-name").val();
		if (partyName.length > 0){
			let partyConfig = read(partyNode);
			party.label = partyName;
			insertEntry(party, LocalData.BattleParties);
			saveLocalData();
			sendFeedbackDialog('Local party "' + partyName + '" has been saved!');
		}
	}
	return savePartyButton;
}


function createRemovePartyButton(){
	var removePartyButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Remove'
	});
	removePartyButton.onclick = function(){
		var partyNode = $$$(this).parent("party").node;
		var partyName = $$$(partyNode).child("party-name").val();
		var askForConfirm = getEntryIndex(partyName, LocalData.BattleParties) >= 0;
		if (partyNode.parentNode.children.length > 1){
			partyNode.parentNode.removeChild(partyNode);
		}else if (!askForConfirm){
			sendFeedbackDialog("Cannot remove the only party of the player.");
		}
		if (askForConfirm){
			var removePartyDialog = createElement('div', 'Do you want to remove local party "' + partyName + '"?');
			$(removePartyDialog).dialog({
				buttons: [{
					text: "Yes",
					style: 'width: 40%; float: left;',
					click: function() {
						removeEntry(partyName, LocalData.BattleParties);
						saveLocalData();
						$(this).dialog("close");
						sendFeedbackDialog('Local party "' + partyName + '" has been removed.');
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
		relabel();
	}
	return removePartyButton;
}


function createPartyReviveCheckbox(){
	var reviveCheckboxContainer = createElement("label", "Max Revive", {style: "width: 50%"});
	var reviveCheckbox = createElement("input", "", {type: "checkbox", name: "party-revive"});
	reviveCheckbox.onclick = function(){
		$(this).button("refresh");
	}
	reviveCheckbox.comply = function(kwargs){
		$(this).button("enable");
		if (kwargs.battleMode == "raid"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				this.checked = false;
				$(this).button("refresh");
				$(this).button("disable");
			}
		}else if (kwargs.battleMode == "gym" || kwargs.battleMode == "pvp"){
			this.checked = false;
			$(this).button("refresh");
			$(this).button("disable");
		}
	}
	reviveCheckboxContainer.appendChild(reviveCheckbox);
	return reviveCheckboxContainer;
}


function createAddPokemonButton(){
	var addPokemonButton = createElement("button", "Add Pokemon", {style: "width: 50%"});
	addPokemonButton.onclick = function(){
		let partyNode = $$$(this).parent("party").node;
		let pokemonCount = countPokemonFromParty(partyNode);
		if (pokemonCount < MAX_NUM_POKEMON_PER_PARTY){
			let newPokemonNode = createPokemonNode();
			let prevPokemonConfig = read(partyNode.children[1].lastChild);
			prevPokemonConfig.copies = 1;
			partyNode.children[1].appendChild(newPokemonNode);
			write(newPokemonNode, prevPokemonConfig);
			formatting(newPokemonNode);
			comply(newPokemonNode, {battleMode: $("#battleMode").val()});
			relabel();
		}else{
			sendFeedbackDialog("Exceeding Maximum number of Pokemon per party.");
		}
	}
	addPokemonButton.comply = function(kwargs){
		$(this).button("enable");
		if (kwargs.battleMode == "raid"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				$(this).button("disable");
			}
		}
	}
	return addPokemonButton;
}


function createPlayerTeamInput(){
	var playerTeamInput = createElement('select', '', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-team"
	});
	playerTeamInput.appendChild(createElement('option', "Primary Team", {value: "0"}));
	playerTeamInput.appendChild(createElement('option', "Opposite Team", {value: "1"}));
	playerTeamInput.onchange = function(){
		/* TODO: Validation - different team
		var different = false;
		for (let player of read().players){
			if (player.team != this.value){
				different = true;
				break;
			}
		}
		if (!different){
			this.value = this.value == "0" ? "1": "0";
			sendFeedbackDialog("There must be two different teams");
		}
		*/
	}
	playerTeamInput.comply = function(kwargs){
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym"){
			this.disabled = true;
			var playerNode = $$$(this).parent("player");
			if (playerNode.child("player-team").val() == "1" || kwargs.battleMode == "gym"){
				let partyNodes = playerNode.child("player-parties").node;
				while (partyNodes.children.length > 1){
					partyNodes.removeChild(partyNodes.lastChild);
				}
			}
		}
	}
	return playerTeamInput;
}


function createPlayerFriendInput(){
	var playerFriendInput = createElement('select', '', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-friend"
	});
	for (let friendSetting of Data.FriendSettings){
		playerFriendInput.appendChild(createElement('option', friendSetting.label, {value: friendSetting.name}));
	}
	playerFriendInput.comply = function(kwargs){
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				this.value = "none";
				this.disabled = true;
			}
		}
	}
	return playerFriendInput;
}


function createRemovePlayerButton(){
	var removePlayerButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePlayerButton.onclick = function(){
		var playersNode = $$$(document.getElementById("input")).child("input-players").node;
		if (playersNode.children.length > 2){
			var playerNode = $$$(this).parent("player").node;
			playerNode.parentNode.removeChild(playerNode);
			document.getElementById('input.addPlayer').disabled = false;
			relabel();
		}else{
			sendFeedbackDialog("Need at least two players to fight");
		}
	}
	return removePlayerButton;
}


function createAddPartyButton(){
	var addPartyButton = createElement("button", "Add Party", {
		class: 'player_button'
	});
	addPartyButton.onclick = function(){
		var playerNode = $$$(this).parent("player").node;
		if (playerNode.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER){
			playerNode.children[1].appendChild(createPartyNode());
			relabel();
		}else{
			sendFeedbackDialog("Exceeding Maximum number of Parties per player.");
		}
	}
	addPartyButton.comply = function(kwargs){
		$(this).button("enable");
		if (kwargs.battleMode == "raid"){
			if ($$$(this).parent("player").child("player-team").val() == "1"){
				$(this).button("disable");
			}
		}else if (kwargs.battleMode == "gym"){
			$(this).button("disable");
		}
	}
	return addPartyButton;
}

// Recursive call to make a node and all its children to comply the system requirements
function comply(node, kwargs){
	node = node || document.getElementById("input");
	kwargs = kwargs || {battleMode: $("#battleMode").val()};
	if (node.comply){
		node.comply(kwargs);
	}
	for (let child of node.children){
		comply(child, kwargs);
	}
}

// Trigger when the battle mode input changed
function complyBattleMode(mode){
	let playerNodes = $$$(document.getElementById("input")).child("input-players").node;
	if (mode == "gym" || mode == "raid"){
		let hasProcessedDefender = false;
		for (let playerNode of playerNodes.children){
			if ($$$(playerNode).child("player-team").val() == "1"){
				if (hasProcessedDefender){
					playerNodes.removeChild(playerNode);
				}else{
					hasProcessedDefender = true;
				}
			}
		}
	}else if (mode == "pvp"){
		
	}
	comply(playerNodes, {battleMode: mode});
	var timelimitInput = document.getElementById("timelimit");
	if (mode == "gym"){
		timelimitInput.value = Data.BattleSettings.timelimitGymMs;
	}else if (mode == "pvp"){
		timelimitInput.value = Data.BattleSettings.timelimitPvPMs;
	}
}


function createPokemonNode(){
	var pokemonNode = createElement('div', '', {
		class: "section-body section-pokemon-node", name: "pokemon"
	});
	pokemonNode.appendChild(createElement('div', "", {class: "section-node-head"}));
	pokemonNode.appendChild(createElement('div', ""));
	pokemonNode.appendChild(createElement('div', ""));
	
	// 1. Head
	pokemonNode.children[0].appendChild(createElement('span', "Unlabeled Pokemon", {class: "section-node-title"}));
	
	var controlButtonDiv = createElement('div', "", {class: "section-buttons-panel"});
	controlButtonDiv.appendChild(createMinimizeButton("pokemon"));
	controlButtonDiv.appendChild(createCopyPokemonButton());
	controlButtonDiv.appendChild(createPastePokemonButton());
	controlButtonDiv.appendChild(createRemovePokemonButton());
	pokemonNode.children[0].appendChild(controlButtonDiv);
	
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=50%><col width=25%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['', '', ''], 'td'));
	tb1.children[1].children[0].appendChild(createPokemonNameInput());
	tb1.children[1].children[1].appendChild(createPokemonRoleInput());
	tb1.children[1].children[2].appendChild(createPokemonCopiesInput());
	pokemonNode.children[1].appendChild(tb1);
	
	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>", {for_roles: "a;gd"});
	tb2.appendChild(createRow(['', '', '', ''], 'td'));
	tb2.children[1].children[0].appendChild(createElement("input", "", {
		placeholder: "Level", name: "pokemon-level"
	}));
	tb2.children[1].children[1].appendChild(createElement("input", "", {
		placeholder: "HP IV", name: "pokemon-stmiv"
	}));
	tb2.children[1].children[2].appendChild(createElement("input", "", {
		placeholder: "Atk. IV", name: "pokemon-atkiv"
	}));
	tb2.children[1].children[3].appendChild(createElement("input", "", {
		placeholder: "Def. IV", name: "pokemon-defiv"
	}));
	pokemonNode.children[1].appendChild(tb2);
	
	var tb2b = createElement("table", "<colgroup><col width=100%></colgroup>", {hidden: "true", for_roles: "a_basic;gd_basic"});
	tb2b.appendChild(createRow(['']));
	tb2b.children[1].children[0].appendChild(createElement("input", "", {
		placeholder: "CP", name: "pokemon-cp"
	}));
	pokemonNode.children[1].appendChild(tb2b);
	
	var tb3 = createElement("table", "<colgroup><col width=100%></colgroup>", {hidden: "true", for_roles: "rb;RB"});
	tb3.appendChild(createRow(['']));
	tb3.children[1].children[0].appendChild(createPokemonRaidTierInput());
	pokemonNode.children[1].appendChild(tb3);

	var tb4 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb4.appendChild(createRow(['', ''], 'td'));
	tb4.children[1].children[0].appendChild(createPokemonMoveInput("fast", "fmove"));
	tb4.children[1].children[1].appendChild(createPokemonStrategyInput());
	var protectShieldStratInput = createPokemonProtectStrategyInput();
	protectShieldStratInput.setAttribute("hidden", true);
	tb4.children[1].children[1].appendChild(protectShieldStratInput);
	pokemonNode.children[1].appendChild(tb4);
	
	var tb5 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb5.appendChild(createRow(['', ''], 'td'));
	tb5.children[1].children[0].appendChild(createPokemonMoveInput("charged", "cmove"));
	tb5.children[1].children[1].appendChild(createPokemonMoveInput("charged", "cmove2"));
	pokemonNode.children[1].appendChild(tb5);
	
	return pokemonNode;
}


function createPartyNode(){
	var partyNode = createElement('div', '', {
		class: 'section-body section-party-node', name: "party"
	});
	partyNode.appendChild(createElement('div', "", {class: "section-node-head"}));
	partyNode.appendChild(createElement('div', "", {name: "party-pokemon"}));
	partyNode.appendChild(createElement('div', "", {style: "width:100%"}));
	
	// 1. Head
	partyNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Party</span>";
	partyNode.children[0].appendChild(createPartyNameInput());
	var controlButtonDiv = createElement('div', "", {class: "section-buttons-panel"});
	controlButtonDiv.appendChild(createMinimizeButton("party"));
	controlButtonDiv.appendChild(createSavePartyButton());
	controlButtonDiv.appendChild(createRemovePartyButton());
	partyNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	partyNode.children[1].appendChild(createPokemonNode());
	$( partyNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	partyNode.children[2].appendChild(createPartyReviveCheckbox());
	partyNode.children[2].appendChild(createAddPokemonButton());
	$( partyNode.children[2] ).controlgroup();
	
	return partyNode;
}


function createPlayerNode(){
	var playerNode = createElement('div', '', {
		class: 'section-body section-player-node', name: "player"
	});
	playerNode.appendChild(createElement('div', "", {class: "section-node-head"}));
	playerNode.appendChild(createElement('div', "", {name: "player-parties"}));
	playerNode.appendChild(createElement('div', "", {style: "width:100%"}));
	
	// 1. Head
	playerNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Player</span>";
	var playerSettingDiv = createElement('div','', {
		style: 'width: 50%; display: inline-block; text-align: center;'
	});
	playerSettingDiv.appendChild(createPlayerTeamInput());
	playerSettingDiv.appendChild(createPlayerFriendInput());
	playerNode.children[0].appendChild(playerSettingDiv);
	
	var controlButtonDiv = createElement('div', "", {class: 'section-buttons-panel'});
	controlButtonDiv.appendChild(createMinimizeButton("player"));
	controlButtonDiv.appendChild(createRemovePlayerButton());
	playerNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	$( playerNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	playerNode.children[2].appendChild(createAddPartyButton());
	$( playerNode.children[2] ).controlgroup();
	
	return playerNode;
}


function addPlayerNode(){
	var playerNodes = $$$(document.getElementById("input")).child("input-players").node;
	if (playerNodes.children.length < MAX_NUM_OF_PLAYERS){
		playerNodes.appendChild(createPlayerNode());
		relabel();
	}else{
		document.getElementById('input.addPlayer').setAttribute('disabled', true);
		sendFeedbackDialog('Exceeding maximum number of players.');
	}
}

// Update label and background color of player/party/pokemon nodes based on their position
function relabel(){
	var playerNodes = $$$(document.getElementById("input")).child("input-players").node;
	let i = 0;
	for (let playerNode of playerNodes.children){
		playerNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][0]);
		playerNode.children[0].children[0].innerHTML = "Player " + (i+1);
		let j = 0;
		for (let partyNode of playerNode.children[1].children){
			partyNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][1]);
			partyNode.children[0].children[0].innerHTML = "Party " + (++j);
			let k = 0;
			for (let pokemonNode of partyNode.children[1].children){
				pokemonNode.setAttribute('style', 'background:' + HSL_COLORS[i%HSL_COLORS.length][2]);
				pokemonNode.children[0].children[0].innerHTML = "Pokemon " + (++k);
			}
		}
		i++;
	}
}


function countPokemonFromParty(partyNode){
	var count = 0;
	for (let pokemonNode of partyNode.children[1].children){
		count += parseInt($$$(pokemonNode).child("pokemon-copies").val()) || 0;
	}
	return count;
}


function clearFeedbackTables(){
	document.getElementById("feedback_buttons").innerHTML = "";
	document.getElementById("feedback_table1").innerHTML = "";
	document.getElementById("feedback_table2").innerHTML = "";
}


function clearAllSims(){
	initMasterSummaryTableMetrics();
	MasterSummaryTableMetrics = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_TABLE_METRICS));
	sendFeedback("");
	simResults = [];
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0]);
	displayMasterSummaryTable();
}


function createMasterSummaryTable(){
	var table = createElement('table', '<thead></thead><tfoot></tfoot><tbody></tbody>', {
		width: '100%', id: 'ui-mastersummarytable', cellspacing: '0', class: 'display nowrap'
	});
	var headers = ['#'];
	for (var m in MasterSummaryTableMetrics){
		headers.push(MasterSummaryTableMetrics[m]);
	}
	headers.push('Detail');
	table.children[0].appendChild(createRow(headers, "th"));
	table.children[1].appendChild(createRow(headers, "th"));
	for (var i = 0; i < simResults.length; i++){
		var sim = simResults[i];
		var row = [i+1];
		for (var m in MasterSummaryTableMetrics){
			if (m[0] == '*'){
				m = m.slice(1);
				var pkmInfo = getPokemonConfig(sim.input, m.split('.')[0]);
				var attr = m.split('.')[1];
				if (attr == 'name' || attr == 'nickname'){
					var pkmData = getEntry(pkmInfo.name, Data.Pokemon);
					row.push(createIconLabelSpan(pkmData.icon, pkmInfo.nickname || pkmData.label, 'species-input-with-icon'));
				}else if (attr == 'fmove'){
					var moveData = getEntry(pkmInfo.fmove, Data.FastMoves);
					row.push(createIconLabelSpan(moveData.icon, moveData.label, 'move-input-with-icon'));
				}else if (attr == 'cmove'){
					var moveData = getEntry(pkmInfo.cmove, Data.ChargedMoves);
					row.push(createIconLabelSpan(moveData.icon, moveData.label, 'move-input-with-icon'));
				}else{
					row.push(pkmInfo[attr]);
				}
			}else if (m == 'weather'){
				row.push(sim.input.weather);
			}else{
				let cellData = sim.output.generalStat[m];
				if (typeof cellData == typeof 0){
					if (m == "battle_result"){
						if (sim.input.aggregation == "enum"){
							row.push(cellData == 1 ? "Win" : "Lose");
						}else{
							row.push(round(cellData * 100, 2) + "%");
						}
					}else{
						row.push(round(cellData, 2));
					}
				}else{
					row.push(cellData);
				}
			}
		}
		row.push("<a onclick='displayDetail("+i+")' style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>");
		table.children[2].appendChild(createRow(row, "td"));
	}
	return table;
}


function createPlayerStatisticsString(playerStat){
	var pString = playerStat.name;
	pString += ", TDO: " + playerStat.tdo;
	pString += ", DPS: " + round(playerStat.dps, 2);
	return pString;
}


function createPokemonStatisticsTable(pokemonStats){
	var table = document.createElement("table");
	table.appendChild(createRow(["<img src='" + getPokemonIcon({dex: 0}) + "'></img>",
								"HP", "Energy", "TDO", "Duration", "DPS", "Detail"], 'th'));
	for (var i = 0; i < pokemonStats.length; i++){
		var ps = pokemonStats[i];
		var row = createRow([
			"<img src='" + getPokemonIcon({name: ps.name}) + "' class='apitem-pokemon-icon'></img>", 
			ps.hp, 
			ps.energy, 
			ps.tdo, 
			round(ps.duration, 2), 
			round(ps.dps, 2), 
			"<a style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>"], 
		'td');
		
		const ps_const = JSON.parse(JSON.stringify(ps));
		row.children[row.children.length - 1].children[0].onclick = function(){
			var pokemonDialog = createElement('div', '', {title: 'Pokemon Detail'});
			var pokemonTable = createElement('table', '');
			for (var attr in ps_const){
				pokemonTable.appendChild(createElement('tr',"<th>" + attr + "</th><td>" + ps_const[attr] + "</td>"));
			}
			pokemonDialog.appendChild(pokemonTable);
			$(pokemonDialog).dialog({width: 400}).dialog('open');
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
	
	document.getElementById("copy-button-clipboard").setAttribute("onclick", "copyTableToClipboard('ui-mastersummarytable')");
	document.getElementById("copy-button-csv").setAttribute("onclick", "exportTableToCSV('ui-mastersummarytable', 'GoBattleSim_result.csv')");
}


function displayDetail(arg){
	var simResult = (typeof arg == typeof 0 ? simResults[arg] : arg);
	clearFeedbackTables();
	// Re-configured the input
	var inputEl = document.getElementById("input");
	write(inputEl, simResult.input);
	complyBattleMode(simResult.input.battleMode);
	formatting(inputEl);
	relabel();
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfig(simResult.input));

	// Add option to go back to Master Summary
	var b = createElement("button", "Back");
	b.onclick = function(){
		$( "#feedback_table1" ).accordion("destroy");
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	
	// Prepare Player/Party/Pokemon summary
	var output = simResult.output;
	var fbSection = document.getElementById("feedback_table1");
	for (var i = 0; i < output.pokemonStats.length; i++){
		fbSection.appendChild(createElement('h4', createPlayerStatisticsString(output.playerStats[i]), 
			{style: 'background:' + HSL_COLORS[i%HSL_COLORS.length][0]}));
		var playerDiv = document.createElement('div');
		for (var j = 0; j < output.pokemonStats[i].length; j++){
			playerDiv.appendChild(createElement('h5', 'Party ' + (j+1)));
			var partyDiv = document.createElement('div');
			partyDiv.appendChild(createPokemonStatisticsTable(output.pokemonStats[i][j]));
			playerDiv.appendChild(partyDiv);
		}
		fbSection.appendChild(playerDiv);
		$( playerDiv ).accordion({
			active: false,
			collapsible: true,
			heightStyle: 'content'
		});
	}
	
	$( "#feedback_table1" ).accordion({
		active: false,
		collapsible: true,
		heightStyle: 'content'
	});
	
	// Battle Log
	var fbSection = document.getElementById("feedback_table2");
	fbSection.appendChild(createElement('h3', 'Interactive Battle Log'));
	var battleLogDiv = document.createElement('div');
	fbSection.appendChild(battleLogDiv);
	if (output.battleLog.length > 0){
		var battleLogTable = createBattleLogTable(output.battleLog);
		battleLogDiv.appendChild(battleLogTable);
		/*
		$( battleLogTable ).DataTable({
			scrollX: true,
			scrollY: '80vh',
			scroller: true,
			searching: false,
			ordering: false
		});
		*/
	}
}


function createBattleLogTable(log){
	var table = createElement('table', '<thead></thead>', {
		width: '100%', class: 'display nowrap', id: "ui-log-table"
	});
	let headers = ["Time"];
	for (var i = 0; i < log[0].cells.length; i++){
		headers.push("Player " + (i+1));
	}
	table.children[0].appendChild(createRow(headers, "th"));
	var tbody = createElement("tbody");
	for (let entry of log){
		var tableRow = createElement("tr");
		tableRow.dataset.t = entry.t;
		tableRow.dataset.name = entry.name;
		tableRow.dataset.value = entry.value;
		tableRow.dataset.index = entry.index;
		tableRow.appendChild(createElement("td", round(entry.t/1000, 2)));
		for (var j = 0; j < entry.cells.length; j++){
			var tableCell = createElement("td");
			var cell = entry.cells[j] || {text: ""};
			if (cell.alternatives && cell.alternatives.length > 0){
				var selectElement = createElement("select");
				var options = [cell].concat(cell.alternatives);
				for (let opt of options){
					var optionEl = createElement("option", opt.text);
					optionEl.dataset.t = opt.t;
					optionEl.dataset.name = opt.name;
					optionEl.dataset.value = opt.value;
					if (opt.style == "pokemon"){
						optionEl.dataset.class = "input-with-icon species-input-with-icon";
						optionEl.dataset.style = "background-image: url(" + opt.icon + ");"
					}else if (opt.style == "move"){
						optionEl.dataset.class = "input-with-icon move-input-with-icon";
						optionEl.dataset.style = "background-image: url(" + opt.icon + ");"
					}
					selectElement.appendChild(optionEl);
				}
				tableCell.appendChild(selectElement);
				
				$(selectElement).iconselectmenu({
					change: function(event, ui){
						var optionSelected = $("option:selected", this)[0];
						var parentTableRow = this.parentNode.parentNode;
						parentTableRow.dataset.t = optionSelected.dataset.t;
						parentTableRow.dataset.name = optionSelected.dataset.name;
						parentTableRow.dataset.value = optionSelected.dataset.value;
						parentTableRow.dataset.breakpoint = true;
						updateFromBattleLog();
					}
				}).iconselectmenu("menuWidget").addClass("ui-menu-icons");
				
			}else{
				if (cell.style == "pokemon"){
					tableCell.innerHTML = createIconLabelSpan(cell.icon, cell.text, "species-input-with-icon");
				}else if (cell.style == "move"){
					tableCell.innerHTML = createIconLabelSpan(cell.icon, cell.text, "move-input-with-icon");
				}else{
					tableCell.innerHTML = cell.text;
				}
			}
			tableCell.setAttribute('style', 'background:' + HSL_COLORS[j % HSL_COLORS.length][0]);
			tableRow.appendChild(tableCell);
		}
		tbody.appendChild(tableRow);
	}
	table.appendChild(tbody);
	return table;
}

function updateFromBattleLog(){
	// Get the log data up to the breakpoint
	var logData = [];
	var table = document.getElementById("ui-log-table");
	var breakIndex = -1;
	for (var i = 1; i < table.children.length; i++){
		var tbody = table.children[i];
		for (var j = 0; j < tbody.children.length; j++){
			var tr = tbody.children[j];
			var e = {
				t: parseInt(tr.dataset.t),
				name: tr.dataset.name,
				value: tr.dataset.value,
				index: parseInt(tr.dataset.index)
			};
			if (tr.dataset.breakpoint){
				e.breakpoint = true;
				delete tr.dataset.breakpoint;
				breakIndex = logData.length;
			}
			logData.push(e);
		}
	}
	// Sort the log because the breakpoint event could have its time changed
	for (; breakIndex < logData.length - 1; breakIndex++){
		let cur = logData[breakIndex], next = logData[breakIndex + 1];
		if (cur.t > next.t){
			logData[breakIndex] = next;
			logData[breakIndex + 1] = cur;
		}else{
			break;
		}
	}
	for (; breakIndex > 0; breakIndex--){
		let cur = logData[breakIndex], prev = logData[breakIndex - 1];
		if (cur.t <= prev.t){
			logData[breakIndex] = prev;
			logData[breakIndex - 1] = cur;
		}else{
			break;
		}
	}
	logData = logData.slice(0, breakIndex + 1);
	
	// Load and resume simulation
	var cfg = read();
	var w = new World(cfg);
	w.timeline.list = [];
	for (let e of logData){
		w.readLog(e);
	}
	w.resume();
	$( "#feedback_table1" ).accordion("destroy");
	displayDetail({
		input: cfg,
		output: w.getStatistics()
	});
}


// Return the encoded URL based on simulation configuration
function exportConfig(cfg){
	// Delete redundant attributes to shorten the URL
	let cfg_min = JSON.parse(JSON.stringify(cfg));
	for (let player of cfg_min.players){
		for (var attr in player){
			if (!player[attr]){
				delete player[attr];
			}
		}
		for (let party of player.parties){
			for (var attr in party){
				if (!party[attr]){
					delete party[attr];
				}
			}
			for (let pokemon of party.pokemon){
				for (var attr in pokemon){
					if (!pokemon[attr]){
						delete pokemon[attr];
					}
					if ((pokemon.role || "").toLowerCase() == "rb"){
						delete pokemon.atkiv;
						delete pokemon.defiv;
						delete pokemon.stmiv;
						delete pokemon.level;
					}else{
						delete pokemon.raidTier;
					}
				}
			}
		}
	}
	return jsonToURI(cfg_min);
}

// Return simulation configuration parsed from URL
function importConfig(url){
	var cfg = uriToJSON(url.split('?')[1]);
	if (cfg.hasOwnProperty("atkrSettings")){ // Backward compatibility to v2
		cfg.players = [];
		for (let player of cfg.atkrSettings){
			player.team = "0";
			player.parties = player.party_list;
			delete player.party_list;
			for (let party of player.parties){
				party.revive = party.revive_strategy;
				party.pokemon = party.pokemon_list;
				delete party.revive_strategy;
				delete party.pokemon_list;
				for (let pokemon of party.pokemon){
					pokemon.role = "a";
					pokemon.strategy = (pokemon.dodge == "2" ? "strat3" : (pokemon.dodge == "1" ? "strat2" : "strat1"));
					delete pokemon.dodge;
				}
			}
			cfg.players.push(player);
		}
		delete cfg.atkrSettings;
		
		var defenderPokemon = cfg.dfdrSettings;
		defenderPokemon.copies = 1;
		defenderPokemon.strategy = "strat0";
		defenderPokemon.raidTier = parseInt(defenderPokemon.raid_tier);
		delete defenderPokemon.raid_tier;
		cfg.players.push({
			team: "1",
			friend: "none",
			parties: [
				{
					revive: false,
					pokemon: [defenderPokemon]
				}
			]
		});
		delete cfg.dfdrSettings;
		
		for (var attr in cfg.generalSettings){
			cfg[attr] = cfg.generalSettings[attr];
		}		
		if (cfg.battleMode == "raid" || defenderPokemon.raidTier > 0){
			cfg.battleMode = "raid";
			if (defenderPokemon.raidTier > 4){
				cfg.timelimit = Data.BattleSettings.timelimitLegendaryRaidMs;
			}else{
				cfg.timelimit = Data.BattleSettings.timelimitRaidMs;
			}
		}else{
			cfg.battleMode = "gym";
			cfg.timelimit = Data.BattleSettings.timelimitGymMs;
		}
		delete cfg.generalSettings;
	}
	return cfg;
}
