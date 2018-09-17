/* GBS_UI_2_dom.js */

function read(node){
	node = node || document.getElementById("input");
	let output = {};
	let nameSegments = (node.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2){
		let attrName = nameSegments[1];
		let tagName = node.tagName.toLowerCase();
		if (tagName == "input" || tagName == "select"){
			output[attrName] = (node.type == "checkbox" ? node.checked : node.value);
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

function getConstructor(attrName){
	if (attrName == "players"){
		return createPlayerNode;
	}else if (attrName == "parties"){
		return createPartyNode;
	}else if (attrName == "pokemon"){
		return createPokemonNode;
	}
}

function write(node, config){
	let nameSegments = (node.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2){
		let attrName = nameSegments[1];
		if (config.hasOwnProperty(attrName)){
			let tagName = node.tagName.toLowerCase();
			if (tagName == "input" || tagName == "select"){
				node[(node.type == "checkbox" ? "checked" : "value")] = config[attrName];
				if ($(node).data("ui-autocomplete")){
					$(node).data("ui-autocomplete")._trigger("change");
				}else if (node.onchange){
					node.onchange();
				}
			}else{
				let nodeConstructor = getConstructor(attrName);
				if (nodeConstructor){
					node.innerHTML = "";
					for (let childConfig of config[attrName]){
						let childNode = new nodeConstructor();
						write(childNode, childConfig);
						node.appendChild(childNode);
					}
				}
			}
		}
	}else{
		for (let child of node.children){
			write(child, config);
		}
	}
}

function createMinimizeButton(parentName){
	const pName = parentName;
	var button = createElement("button", '<i class="fa fa-minus" aria-hidden="true"></i>',{
		class: "button-icon", title: "Minimize"
	});
	button.onclick = function(){
		$(searchParent(this, x => x.getAttribute("name") == pName).children[1]).slideToggle('fast');
	}
	return button;
}

function createPokemonNode(){
	var pokemonNode = createElement('div', '', {
		class: "section-body section-pokemon-node", name: "pokemon"
	});
	pokemonNode.appendChild(createElement('div', "", {class: "section-node-head"}));
	pokemonNode.appendChild(createElement('div', ""));
	pokemonNode.appendChild(createElement('div', ""));
	
	// 1. Head
	pokemonNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Pokemon</span>";
	
	var controlButtonDiv = createElement('div', "", {class: "section-buttons-panel"});
	controlButtonDiv.appendChild(createMinimizeButton("pokemon"));
	
	var copyPokemonButton = createElement('button','<i class="fa fa-files-o" aria-hidden="true"></i>', {
		class: "button-icon", title: "Copy"
	});
	copyPokemonButton.onclick = function(){
		var pokemonNode = searchParent(this, x => x.getAttribute("name") == "pokemon");
		LocalData.PokemonClipboard = read(pokemonNode);
		saveLocalData();
	}
	controlButtonDiv.appendChild(copyPokemonButton);
	
	var pastePokemonButton = createElement('button','<i class="fa fa-clipboard" aria-hidden="true"></i>', {
		class: "button-icon", title: "Paste"
	});
	pastePokemonButton.onclick = function(){
		var pokemonNode = searchParent(this, x => x.getAttribute("name") == "pokemon");
		if (LocalData.PokemonClipboard){
			write(pokemonNode, LocalData.PokemonClipboard);
		}
	}
	controlButtonDiv.appendChild(pastePokemonButton);
	
	var removePokemonButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: "button-icon", title: "Remove"
	});
	removePokemonButton.onclick = function(){
		var pokemonNode = searchParent(this, x => x.getAttribute("name") == "pokemon");
		if (pokemonNode.parentNode.children.length > 1){
			pokemonNode.parentNode.removeChild(pokemonNode);
		}else{
			sendFeedbackDialog("Cannot remove the only Pokemon of the party.");
		}
	}
	controlButtonDiv.appendChild(removePokemonButton);
	pokemonNode.children[0].appendChild(controlButtonDiv);
	
	
	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=50%><col width=25%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['','', ''],'td'));
	
	var speciesInput = createElement('input','',{
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon', 
		style: 'background-image: url(' + getPokemonIcon({dex: 0}) + ')', name: "pokemon-name"
	});
	autocompletePokemonNodeSpecies(speciesInput);
	tb1.children[1].children[0].appendChild(speciesInput);
	
	var roleInput = createElement("select", "", {name: "pokemon-role"});
	roleInput.appendChild(createElement('option', 'User Pokemon', {value: "a"}));
	roleInput.appendChild(createElement('option', 'Raid Boss', {value: "rb"}));
	roleInput.appendChild(createElement('option', 'Gym Defender', {value: "gd"}));
	roleInput.onchange = function(){
		var pokemonNode = searchParent(this, (x => x.getAttribute("name") == "pokemon"));
		if (this.value == "rb"){
			pokemonNode.children[1].children[1].setAttribute("hidden", true);
			pokemonNode.children[1].children[2].removeAttribute("hidden");
		}else{
			pokemonNode.children[1].children[2].setAttribute("hidden", true);
			pokemonNode.children[1].children[1].removeAttribute("hidden");
		}
		var strategyNode = searchChild(pokemonNode, (x => x.getAttribute("name") == "pokemon-strategy"));
		if (this.value == "a"){
			strategyNode.value = "attackerStrategy0";
		}else{
			strategyNode.value = "defenderStrategy";
		}
	}
	tb1.children[1].children[1].appendChild(roleInput);
	
	var copiesInput = createElement('input','',{
		type: 'number', placeholder: 'Copies', min: 1, max: 6, value: 1, name: "pokemon-copies"
	});
	copiesInput.onchange = function(){
		var pokemonCount = countPokemonFromParty(searchParent(this, x => x.getAttribute('name') == "party"));
		if (pokemonCount > MAX_NUM_POKEMON_PER_PARTY){
			this.value -= pokemonCount - MAX_NUM_POKEMON_PER_PARTY;
		}
		if (this.value < 1)
			this.value = 1;
	}
	tb1.children[1].children[2].appendChild(copiesInput);
	
	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>");
	tb2.appendChild(createRow(['','','',''],'td'));
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
	var raidSelection = createElement("select", "", {
		name: "pokemon-raidTier"
	});
	for (var i = 1; i <= 5; i++){
		raidSelection.appendChild(createElement('option', "Tier " + i, {value: i}));
	}
	tb3.children[1].children[0].appendChild(raidSelection);

	var tb4 = createElement("table", "<colgroup><col width=37.5%><col width=37.5%><col width=25%></colgroup>");
	tb4.appendChild(createRow(['', '', ''], 'td'));
	
	var fmoveInput = createElement('input', '', {
		type: 'text', placeholder: 'Fast Move', name: "pokemon-fmove",
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(fmoveInput);
	tb4.children[1].children[0].appendChild(fmoveInput);
	
	var cmoveInput = createElement('input', '', {
		type: 'text', placeholder: 'Charged Move', name: "pokemon-cmove",
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	autocompletePokemonNodeMoves(cmoveInput);
	tb4.children[1].children[1].appendChild(cmoveInput);

	stratSelect = createElement('select', '', {name: "pokemon-strategy"});
	stratSelect.appendChild(createElement('option', 'No Dodge', {value: "attackerStrategy0"}));
	stratSelect.appendChild(createElement('option', 'Dodge Charged', {value: "attackerStrategy1"}));
	stratSelect.appendChild(createElement('option', 'Dodge All', {value: "attackerStrategy2"}));
	stratSelect.appendChild(createElement('option', 'AI', {value: "defenderStrategy"}));
	tb4.children[1].children[2].appendChild(stratSelect);
	
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
	partyNode.appendChild(createElement('div', ""));
	
	// 1. Head
	partyNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Party</span>";
	
	var partyNameInput = createElement('input','', {
		type: "text", style: "width: 30%; display: inline-block; text-align: center;", name: "party-name"
	});
	$( partyNameInput ).autocomplete({
		minLength : 0,
		delay : 0,
		source : function(request, response){
			var matches = [];
			var playerIdx = 0; // TODO: Dynamically binding user ID to player node
			if (playerIdx >= 0 && playerIdx < Data.Users.length){
				for (let party of Data.Users[playerIdx].parties){
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
		select : function(event, ui) {
			write(searchParent(this, x => x.getAttribute("name") == "party"), ui.item);
			relabel();
		}
	});
	partyNameInput.onfocus = function(){$(this).autocomplete("search", "");}
	partyNode.children[0].appendChild(partyNameInput);
	
	var controlButtonDiv = createElement('div', "", {class: "section-buttons-panel"});
	controlButtonDiv.appendChild(createMinimizeButton("party"));
	
	var savePartyButton = createElement('button','<i class="fa fa-floppy-o" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Save', name: "party.save"
	});
	savePartyButton.onclick = function(){
		var partyNode = searchParent(this, x => x.getAttribute("name") == "party");
		var partyName = searchChild(partyNode, x => x.getAttribute("name") == "party-name").value;
		if (partyName.length > 0){
			let partyConfig = read(partyNode);
			party.label = partyName;
			insertEntry(party, LocalData.BattleParties);
			saveLocalData();
			sendFeedbackDialog('Local party "' + partyName + '" has been saved!');
		}
	}
	controlButtonDiv.appendChild(savePartyButton);
	
	var removePartyButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove', name: "party.remove"
	});
	removePartyButton.onclick = function(){
		var partyNode = searchParent(this, x => x.getAttribute("name") == "party");
		var partyName = searchChild(partyNode, x => x.getAttribute("name") == "party-name").value;
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
	}
	controlButtonDiv.appendChild(removePartyButton);
	
	partyNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	partyNode.children[1].appendChild(createPokemonNode());
	$( partyNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	partyNode.children[2].style = "width:100%";
	partyNode.children[2].innerHTML = "<label style='width:50%'>Max Revive<input type='checkbox' name='party-revive'></label>";
	
	var addPokemonButton = createElement("button", "Add Pokemon", {style: "width: 50%"});
	addPokemonButton.onclick = function(){
		let partyNode = searchParent(this, x => x.getAttribute('name') == "party");
		if (countPokemonFromParty(partyNode) < MAX_NUM_POKEMON_PER_PARTY){
			partyNode.children[1].appendChild(createPokemonNode());
			relabel();
		}else{
			sendFeedbackDialog("Exceeding Maximum number of Pokemon per party.");
		}
	}
	partyNode.children[2].appendChild(addPokemonButton);
	$( partyNode.children[2] ).controlgroup();
	
	return partyNode;
}

function createPlayerNode(){
	var playerNode = createElement('div', '', {
		class: 'section-body section-player-node', name: "player"
	});
	playerNode.appendChild(createElement('div', "", {class: "section-node-head"}));
	playerNode.appendChild(createElement('div', "", {name: "player-parties"}));
	playerNode.appendChild(createElement('div', ""));
	
	// 1. Head
	playerNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Player</span>";
	var playerSettingDiv = createElement('div','', {
		style: 'width: 50%; display: inline-block; text-align: center;'
	});
	
	var playerTeamInput = createElement('select','', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-team"
	});
	playerTeamInput.appendChild(createElement('option', "Primary", {value: "0"}));
	playerTeamInput.appendChild(createElement('option', "Secondary", {value: "1"}));
	playerTeamInput.onchange = function(){
		// Verification needed
	}
	playerSettingDiv.appendChild(playerTeamInput);
	
	var playerFriendLevelInput = createElement('select','', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-friend"
	});
	for (let friendSetting of Data.FriendSettings){
		playerFriendLevelInput.appendChild(createElement('option', friendSetting.label, {value: friendSetting.name}));
	}
	playerSettingDiv.appendChild(playerFriendLevelInput);
	
	playerNode.children[0].appendChild(playerSettingDiv);
	
	var controlButtonDiv = createElement('div', "", {class: 'section-buttons-panel'});
	controlButtonDiv.appendChild(createMinimizeButton("player"));
	
	var removePlayerButton = createElement('button','<i class="fa fa-times" aria-hidden="true"></i>',{
		class: 'button-icon', title: 'Remove'
	});
	removePlayerButton.onclick = function(){
		var playersNode = searchChild(document.getElementById("input"), x => x.getAttribute("name") == "input-players");
		if (playersNode.children.length > 2){
			var playerNode = searchParent(this, x => x.getAttribute("name") == "player");
			playerNode.parentNode.removeChild(playerNode);
			document.getElementById('input.addPlayer').disabled = false;
			relabel();
		}else{
			sendFeedbackDialog("Need at least two players to fight");
		}
	}
	controlButtonDiv.appendChild(removePlayerButton);
	
	playerNode.children[0].appendChild(controlButtonDiv);
	
	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	$( playerNode.children[1] ).sortable({axis: 'y'});
	
	// 3. Tail
	playerNode.children[2].style = "width:100%";
	var addPartyButton = createElement("button", "Add Party", {
		class: 'player_button', name: "player.addParty"
	});
	addPartyButton.onclick = function(){
		var playerNode = searchParent(this, x => x.getAttribute("name") == "player");
		if (playerNode.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER){
			playerNode.children[1].appendChild(createPartyNode());
			relabel();
		}else{
			sendFeedbackDialog("Exceeding Maximum number of Parties per player.");
		}
	}
	playerNode.children[2].appendChild(addPartyButton);
	$( playerNode.children[2] ).controlgroup();
	
	return playerNode;
}

function addPlayerNode(){
	var playersNode = searchChild(document.getElementById("input"), x => x.getAttribute("name") == "input-players");
	if (playersNode.children.length < MAX_NUM_OF_PLAYERS){
		playersNode.appendChild(createPlayerNode());
		relabel();
	}else{
		document.getElementById('input.addPlayer').setAttribute('disabled', true);
		sendFeedbackDialog('Exceeding maximum number of players.');
	}
}

function relabel(){
	var playersNode = searchChild(document.getElementById("input"), x => x.getAttribute("name") == "input-players");
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
		let copiesNode = searchChild(pokemonNode, x => x.getAttribute('name') == "pokemon-copies");
		count += parseInt(copiesNode.value) || 0;
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
				row.push(sim.input.general.weather);
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

function createPlayerStatisticsString(playerStat, duration){
	var pString = playerStat.name;
	pString += ", TDO: " + playerStat.tdo;
	pString += ", DPS: " + round(playerStat.tdo / duration, 2);
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
	write(document.getElementById("input"), simResults[i].input);

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
	for (var i = 0; i < output.pokemonStats.length; i++){
		fbSection.appendChild(createElement('h4',createPlayerStatisticsString(output.playerStats[i], output.generalStat.duration - Data.BattleSettings.arenaEntryLagMs/1000), 
			{style: 'background:' + HSL_COLORS[i%HSL_COLORS.length][0]}));
		var playerDiv = document.createElement('div');
		for (var j = 0; j < output.pokemonStats[i].length; j++){
			playerDiv.appendChild(createElement('h5','Party ' + (j+1)));
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
	fbSection.appendChild(createElement('h3','Battle Log'));
	var battleLogDiv = document.createElement('div');
	var battleLogTable = createBattleLogTable(output.battleLog);
	battleLogTable.id = 'ui-log-table';
	fbSection.appendChild(battleLogDiv);
	
	$( battleLogTable ).DataTable({
		scrollX: true,
		scrollY: '80vh',
		scroller: true,
		searching: false,
		ordering: false
	});
	battleLogDiv.appendChild(battleLogTable);
	
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
		width:'100%', class:'display nowrap'
	});

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
			row.children[k+1].setAttribute('style','background:' + HSL_COLORS[k%HSL_COLORS.length][0]);
		}
		table.children[1].appendChild(row, "td");
	}
	return table;
}

function exportConfigToUrl(cfg){
	const pkm_min_attributes = ['name','copies','level','atkiv','defiv','stmiv','fmove','cmove','strategy'];
	let cfg_min = {
		general: JSON.parse(JSON.stringify(cfg.general)),
		players: []
	};
	for (let player of cfg.players){
		let player_min = {
			team: player.team,
			parties: []
		};
		if (player.friend){
			player_min.friend = player.friend;
		}
		for (let party of player.parties){
			let party_min = {
				pokemon: []
			};
			if (party.revive){
				party_min.revive = party.revive;
			}
			for (let pokemon of party.pokemon){
				let pokemon_min = {};
				leftMerge(pokemon_min, pokemon, pkm_min_attributes);
				for (var attr in pokemon_min){
					if (pokemon_min[attr] == DEFAULT_ATTACKER_INPUT_MIN[attr])
						delete pokemon_min[attr];
				}
				party_min.pokemon.push(pokemon_min);
			}
			player_min.parties.push(party_min);
		}
		cfg_min.players.push(player_min);
	}
	
	delete cfg_min.general.hasLog;
	for (var attr in cfg_min.general){
		if (cfg_min.general[attr] == DEFAULT_GENERAL_SETTING_INPUT_MIN[attr])
			delete cfg_min.general[attr];
	}
	
	return jsonToURI(cfg_min);
}

function parseConfigFromUrl(url){
	var cfg = uriToJSON(url.split('?')[1]);
	// TODO: backward compatibility
	for (let player of cfg.players){
		for (let party of player.parties){
			for (let pokemon of party.pokemon){
				for (var attr in DEFAULT_ATTACKER_INPUT_MIN){
					if (!pokemon.hasOwnProperty(attr))
						pokemon[attr] = DEFAULT_ATTACKER_INPUT_MIN[attr];
				}
				if (pokemon.species){ // legacy issue
					pokemon.name = pokemon.species;
					delete pokemon.species;
				}
			}
		}
	}
	for (var attr in DEFAULT_GENERAL_SETTING_INPUT_MIN){
		if (!cfg.general.hasOwnProperty(attr))
			cfg.general[attr] = DEFAULT_GENERAL_SETTING_INPUT_MIN[attr];
	}
	return cfg;
}