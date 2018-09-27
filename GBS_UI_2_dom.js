/* GBS_UI_2_dom.js */

// This class is to save some lines of codes
function GoBattleSimNode(el){
	this.node = el;
}

GoBattleSimNode.prototype.parent = function(name){
	return new GoBattleSimNode(searchParent(this.node, x => x.getAttribute("name") == name));
}

GoBattleSimNode.prototype.child = function(name){
	return new GoBattleSimNode(searchChild(this.node, x => x.getAttribute("name") == name));
}

GoBattleSimNode.prototype.val = function(){
	return $(this.node).val();
}

// A wrapper function for creating GoBattleSimNode
function $$$(el){
	return new GoBattleSimNode(el);
}



// A generic function to read structured input from HTML elements
function read(node){
	node = node || document.getElementById("input");
	let output = {};
	let nameSegments = (node.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2){
		let attrName = nameSegments[1];
		let tagName = node.tagName.toLowerCase();
		if (tagName == "input" || tagName == "select"){
			output[attrName] = (node.type == "checkbox" ? node.checked : node.value);
			if (node.type == "number"){
				output[attrName] = parseFloat(output[attrName]);
			}
		}else{
			let childOutputs = [];
			for (let child of node.children){
				childOutputs.push(read(child));
			}
			output[attrName] = childOutputs;
		}
	}else{
		for (let child of node.children){
			let childOutput = read(child);
			for (var attr in childOutput){
				output[attr] = childOutput[attr];
			}
		}
	}
	return output;
}

// A generic function to write structured input to HTML elements
// When [forced] is true, this function will update elements with empty value if [config] doesn't contain the attribute
function write(node, config, forced){
	let nameSegments = (node.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2){
		let attrName = nameSegments[1];
		if (config.hasOwnProperty(attrName) || forced){
			let tagName = node.tagName.toLowerCase();
			if (tagName == "input" || tagName == "select"){
				if (node.type == "checkbox"){
					node.checked = config[attrName] || false;
				}else{
					node.value = config[attrName] || "";
				}
				if (node.onchange){
					node.onchange();
				}
			}else{
				let nodeConstructor = getConstructor(attrName);
				if (nodeConstructor){
					node.innerHTML = "";
					for (let childConfig of config[attrName]){
						let childNode = new nodeConstructor();
						node.appendChild(childNode);
						write(childNode, childConfig, forced);
					}
				}
			}
		}
	}else{
		for (let child of node.children){
			write(child, config, forced);
		}
	}
}

// Helper function for write()
function getConstructor(attrName){
	if (attrName == "players"){
		return createPlayerNode;
	}else if (attrName == "parties"){
		return createPartyNode;
	}else if (attrName == "pokemon"){
		return createPokemonNode;
	}
}

// A generic function for formatting select HTML elements input
function formatting(node){
	let name = node.getAttribute("name");
	if (name == "pokemon-name" || name == "pokemon-fmove" || name == "pokemon-cmove"){
		node.value = toTitleCase(node.value);
	}
	if ($(node).data("ui-autocomplete")){
		$(node).data("ui-autocomplete")._trigger("change");
	}else if ($(node).data("ui-checkboxradio")){
		$(node).button("refresh");
	}
	for (let child of node.children){
		formatting(child);
	}
}


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
		write($$$(this).parent("pokemon").node, LocalData.PokemonClipboard || {});
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
	roleInput.appendChild(createElement('option', 'User Pokemon', {value: "a"}));
	roleInput.appendChild(createElement('option', 'Raid Boss', {value: "rb"}));
	roleInput.appendChild(createElement('option', 'Gym Defender', {value: "gd"}));
	roleInput.onchange = function(){
		var pokemonNode = $$$(this).parent("pokemon").node;
		if (this.value == "rb"){
			pokemonNode.children[1].children[1].setAttribute("hidden", true);
			pokemonNode.children[1].children[2].removeAttribute("hidden");
		}else{
			pokemonNode.children[1].children[2].setAttribute("hidden", true);
			pokemonNode.children[1].children[1].removeAttribute("hidden");
		}
		var strategyNode = $$$(pokemonNode).child("pokemon-strategy").node;
		if (this.value == "a"){
			strategyNode.value = "strat1";
		}else{
			strategyNode.value = "strat0";
		}
	}
	return roleInput;
}

function createPokemonCopiesInput(){
	var copiesInput = createElement('input','',{
		type: 'number', placeholder: 'Copies', min: 1, max: 6, value: 1, name: "pokemon-copies"
	});
	copiesInput.onchange = function(){
		var pokemonCount = countPokemonFromParty($$$(this).parent("party").node);
		if (pokemonCount > MAX_NUM_POKEMON_PER_PARTY){
			this.value -= pokemonCount - MAX_NUM_POKEMON_PER_PARTY;
		}
		if (this.value < 1)
			this.value = 1;
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
	return raidTierInput;
}

function createPokemonStrategyInput(){
	var strategyInput = createElement('select', '', {name: "pokemon-strategy"});
	strategyInput.appendChild(createElement('option', 'No Dodge', {value: "strat1"}));
	strategyInput.appendChild(createElement('option', 'Dodge Charged', {value: "strat2"}));
	strategyInput.appendChild(createElement('option', 'Dodge All', {value: "strat3"}));
	strategyInput.appendChild(createElement('option', 'Defender AI', {value: "strat0"}));
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
			formatting(partyNode);
			relabel();
		}
	});
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
			relabel();
		}else{
			sendFeedbackDialog("Exceeding Maximum number of Pokemon per party.");
		}
	}
	return addPokemonButton;
}

function createPlayerTeamInput(){
	var playerTeamInput = createElement('select', '', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-team"
	});
	playerTeamInput.appendChild(createElement('option', "Primary", {value: "0"}));
	playerTeamInput.appendChild(createElement('option', "Secondary", {value: "1"}));
	playerTeamInput.onchange = function(){
		// Verification needed
	}
	return playerTeamInput;
}

function createPlayerFriendInput(){
	var playerFriendInput = createElement('select','', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-friend"
	});
	for (let friendSetting of Data.FriendSettings){
		playerFriendInput.appendChild(createElement('option', friendSetting.label, {value: friendSetting.name}));
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
	return addPartyButton;
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
	
	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>");
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
	
	var tb3 = createElement("table", "<colgroup><col width=100%></colgroup>", {hidden: "true"});
	tb3.appendChild(createRow(['']));
	tb3.children[1].children[0].appendChild(createPokemonRaidTierInput());

	var tb4 = createElement("table", "<colgroup><col width=37.5%><col width=37.5%><col width=25%></colgroup>");
	tb4.appendChild(createRow(['', '', ''], 'td'));
	tb4.children[1].children[0].appendChild(createPokemonMoveInput("fast"));
	tb4.children[1].children[1].appendChild(createPokemonMoveInput("charged"));	
	tb4.children[1].children[2].appendChild(createPokemonStrategyInput());
	
	pokemonNode.children[1].appendChild(tb1);
	pokemonNode.children[1].appendChild(tb2);
	pokemonNode.children[1].appendChild(tb3);
	pokemonNode.children[1].appendChild(tb4);
	
	// 3. Tail
	
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
	partyNode.children[2].innerHTML = "<label style='width:50%'>Max Revive<input type='checkbox' name='party-revive'></label>";
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
	var playersNode = $$$(document.getElementById("input")).child("input-players").node;
	if (playersNode.children.length < MAX_NUM_OF_PLAYERS){
		playersNode.appendChild(createPlayerNode());
		relabel();
	}else{
		document.getElementById('input.addPlayer').setAttribute('disabled', true);
		sendFeedbackDialog('Exceeding maximum number of players.');
	}
}

// Update label and background color of player/party/pokemon nodes based on their position
function relabel(){
	var playersNode = $$$(document.getElementById("input")).child("input-players").node;
	let i = 0;
	for (let playerNode of playersNode.children){
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
				var pkmInfo = getPokemonConfig(sim.input, m.split('.')[0]), attr = m.split('.')[1];
				if (attr == 'name'){
					var pkmData = getEntry(pkmInfo.name, Data.Pokemon);
					row.push(createIconLabelSpan(pkmInfo.icon || pkmData.icon, pkmInfo.label || pkmData.label, 'species-input-with-icon'));
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
					row.push(round(cellData, 2));
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
	
	document.getElementById("copy-button-clipboard").setAttribute("onclick", "copyTableToClipboard('ui-mastersummarytable')");
	document.getElementById("copy-button-csv").setAttribute("onclick", "exportTableToCSV('ui-mastersummarytable', 'GoBattleSim_result.csv')");
}


function displayDetail(i){
	clearFeedbackTables();
	// Re-configured the input
	var inputEl = document.getElementById("input");
	write(inputEl, simResults[i].input);
	formatting(inputEl);
	relabel();
	window.history.pushState('', "GoBattleSim", window.location.href.split('?')[0] + '?' + exportConfig(simResults[i].input));

	// Add option to go back to Master Summary
	var b = createElement("button", "Back");
	b.onclick = function(){
		$( "#feedback_table1" ).accordion("destroy");
		$( "#feedback_table2" ).accordion("destroy");
		displayMasterSummaryTable();
	}
	document.getElementById("feedback_buttons").appendChild(b);
	
	// Prepare Player/Party/Pokemon summary
	var output = simResults[i].output;
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
	fbSection.appendChild(createElement('h3', 'Battle Log'));
	var battleLogDiv = document.createElement('div');
	var battleLogTable = createBattleLogTable(output.battleLog);
	fbSection.appendChild(battleLogDiv);
	battleLogDiv.appendChild(battleLogTable);
	
	$( battleLogTable ).DataTable({
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
	
	document.getElementById("copy-button-clipboard").setAttribute("onclick", "copyTableToClipboard('ui-log-table')");
	document.getElementById("copy-button-csv").setAttribute("onclick", "exportTableToCSV('ui-log-table', 'GoBattleSim_log.csv')");
}


function createBattleLogTable(log){
	var table = createElement('table','<thead></thead><tbody></tbody>',{
		width: '100%', class: 'display nowrap', id: "ui-log-table"
	});
	if (!log || log.length == 0){
		return table;
	}

	let headers = ["Time"];
	for (var i = 0; i < log[0].events.length; i++){
		headers.push("Player " + (i+1));
	}
	table.children[0].appendChild(createRow(headers, "th"));
	
	var sameTimeEvents = [];
	for (let rowEntry of log){
		let rowData = [rowEntry.t];
		for (let entry of rowEntry.events){
			entry = entry || {type: 'text', text: ''};
			if (entry.type == 'pokemon'){
				var pkmInfo = getEntry(entry.name, Data.Pokemon);
				rowData.push(createIconLabelSpan(pkmInfo.icon, entry.nickname, 'species-input-with-icon'));
			}else if (entry.type == 'fastMove'){
				var moveInfo = getEntry(entry.name, Data.FastMoves);
				rowData.push(createIconLabelSpan(moveInfo.icon, moveInfo.label, 'move-input-with-icon'));
			}else if (entry.type == 'chargedMove'){
				var moveInfo = getEntry(entry.name, Data.ChargedMoves);
				rowData.push(createIconLabelSpan(moveInfo.icon, moveInfo.label, 'move-input-with-icon'));
			}else{ // entry.type == 'text'
				rowData.push(entry.text);
			}
		}
		let row = createRow(rowData);
		for (var k = 0; k < row.children.length - 1; k++){
			row.children[k+1].setAttribute('style', 'background:' + HSL_COLORS[k%HSL_COLORS.length][0]);
		}
		table.children[1].appendChild(row, "td");
	}
	return table;
}

/* The following two functions are for link sharing */

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
					if (pokemon.role == "rb"){
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
	// TODO: backward compatibility
	return cfg;
}



