/* GBS_UI_4_dom2.js */

/**
	@file Define extension tools.
	@author BIOWP
*/

function welcomeDialogInit(){
	$( "#WelcomeDialog" ).attr("style", "visibility: show;");
	$( "#WelcomeDialog" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#WelcomeDialogOpener" ).click(function() {
		$( "#WelcomeDialog" ).dialog( "open" );
	});
}


function welcomeDialogSubmit(configIndex, advanced){
	var masterInputNode = document.getElementById("input");
	write(masterInputNode, sampleConfigurations[configIndex] || {});
	formatting(masterInputNode);
	relabel();
	$( "#WelcomeDialog" ).dialog( "close" );
	if (!advanced){
		document.getElementById('GoButton').scrollIntoView({block: "center", inline: "center"});
		sendFeedbackDialog('Nice choice! Now, click "GO" to start the simulation.');
	}
}


function welcomeDialogRespond(resp){
	if (resp == 1){
		LocalData.WelcomeDialogNoShow = 1;
		saveLocalData();
	}
	$( "#WelcomeDialog" ).dialog( "close" );
}


function dropdownMenuInit(){
	var SubMenuContainers = document.getElementsByClassName('sub-menu-container');
	for (var i = 0; i < SubMenuContainers.length; i++){
		var container = SubMenuContainers[i];
		container.children[0].onclick = function(){
			$(this.parentNode.children[1]).slideToggle('fast');
			var subMenus = document.getElementsByClassName('sub-menu');
			for (var j = 0; j < subMenus.length; j++){
				if (subMenus[j].id != this.parentNode.children[1].id){
					$(subMenus[j]).hide();
				}
			}
		}
		for (let child of container.children[1].children){
			$( child ).click(function(){
				$(this.parentNode).hide();
			});
		}
		$(container.children[1]).menu();
		$(container.children[1]).hide();
	}
}


function moveEditFormInit(){
	$( "#moveEditForm" ).attr("style", "visibility: show;");
	$( "#moveEditForm" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#moveEditFormOpener" ).click(function() {
		$( "#moveEditForm" ).dialog( "open" );
	});
	
	var moveInput = document.getElementById("moveEditForm-table");
	
	var movePokeTypeInput = $$$(moveInput).child("move-pokeType").node;
	movePokeTypeInput.innerHTML = "";
	for (var type in Data.TypeEffectiveness){
		movePokeTypeInput.appendChild(createElement("option", toTitleCase(type), {value: type}));
	}
	
	$( $$$(moveInput).child("move-name").node ).autocomplete({
		appendTo: '#moveEditForm',
		minLength: 0,
		delay: 0,
		source: function(request, response){
			var matches = Data[toTitleCase($$$(moveInput).child("move-moveType").val()) + "Moves"].filter(Predicate(request.term));
			response(matches);
		},
		select: function(event, ui){
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: ui.item});
		},
		change: function(event, ui){
			var moveDatabase = Data[toTitleCase($$$(moveInput).child("move-moveType").val()) + "Moves"];
			var move = ui.item || getEntry(this.value.trim().toLowerCase(), moveDatabase);
			if (move){
				assignMoveParameterSet("load", [move], $$$(moveInput).child("move-scope").val());
				this.setAttribute('style', 'background-image: url(' + move.icon + ')');
				write(moveInput, move);
				this.value = toTitleCase(this.value);
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	$$$(moveInput).child("move-pokeType").node.onchange = function(){
		$$$(moveInput).child("move-name").node.setAttribute("style", "background-image: url(" + getTypeIcon({pokeType: this.value}) + ")");
	}
	
	$$$(moveInput).child("move-scope").node.onchange = function(){
		$($$$(moveInput).child("move-name").node).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: null});
	}
}


function moveEditFormSubmit(){
	var moveInput = document.getElementById("moveEditForm-table");
	var move = read(moveInput);
	move.name = move.name.trim().toLowerCase();
	move.icon = getTypeIcon({pokeType: move.pokeType});
	assignMoveParameterSet("save", [move], move.scope);
	delete move.scope;

	var move2 = getEntry(move.name, Data[toTitleCase(move.moveType) + "Moves"]);
	if (move2){
		leftMerge(move2, move);
		move = move2;
		sendFeedbackDialog('Move: ' + move.label + ' has been updated.');
	}else{
		move.label = toTitleCase(move.name);
		insertEntry(move, Data[toTitleCase(move.moveType) + "Moves"]);
		sendFeedbackDialog('Move: ' + move.label + ' has been added.');
	}
	
	insertEntry(move, LocalData[toTitleCase(move.moveType) + "Moves"]);
	saveLocalData();
}


function moveEditFormReset(){
	Data.FastMoves = [];
	Data.ChargedMoves = [];
	fetchMoveData(function(){
		sendFeedbackDialog("Latest Move Data have been fetched");
		['FastMoves', 'ChargedMoves'].forEach(function(moveDatabaseName){
			for (var i = 0; i < LocalData[moveDatabaseName].length; i++){
				if (getEntry(LocalData[moveDatabaseName][i].name, Data[moveDatabaseName])){
					LocalData[moveDatabaseName].splice(i--, 1);
				}
			}
		});
		saveLocalData();
	});
}


function moveEditFormDelete(){
	var moveInput = document.getElementById("moveEditForm-table");
	var moveDatabaseName = toTitleCase($$$(moveInput).child("move-moveType").val()) + "Moves";
	var moveName = $$$(moveInput).child("move-name").val().trim().toLowerCase();
	
	if (removeEntry(moveName, Data[moveDatabaseName]) && removeEntry(moveName, LocalData[moveDatabaseName])){
		saveLocalData();
		sendFeedbackDialog("Move: " + moveName + " has been removed");
	}
}


function pokemonEditFormInit(){
	$( "#pokemonEditForm" ).attr("style", "visibility: show;");
	$( "#pokemonEditForm" ).dialog({
		autoOpen: false,
		width: 600
	});
	$( "#pokemonEditFormOpener" ).click(function() {
		$( "#pokemonEditForm" ).dialog( "open" );
	});
	
	var pokemonInput = document.getElementById("pokemonEditForm-table");
	
	var pokeType1Input = $$$(pokemonInput).child("pokemon-pokeType1").node;
	var pokeType2Input = $$$(pokemonInput).child("pokemon-pokeType2").node;
	pokeType1Input.innerHTML = "";
	pokeType2Input.innerHTML = "";
	pokeType1Input.appendChild(createElement("option", "None", {value: "none"}));
	pokeType2Input.appendChild(createElement("option", "None", {value: "none"}));
	for (var type in Data.TypeEffectiveness){
		pokeType1Input.appendChild(createElement("option", toTitleCase(type), {value: type}));
		pokeType2Input.appendChild(createElement("option", toTitleCase(type), {value: type}));
	}
	
	$( $$$(pokemonInput).child("pokemon-name").node ).autocomplete({
		appendTo: '#pokemonEditForm',
		minLength: 0,
		delay: 0,
		source: function(request, response){
			response(getPokemonOptions(false).filter(Predicate(request.term)));
		},
		select: function(event, ui){
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: ui.item});
		},
		change: function(event, ui){
			var pkmInfo = ui.item || getEntry(this.value.trim().toLowerCase(), Data.Pokemon);
			if (pkmInfo){
				pkmInfo = JSON.parse(JSON.stringify(pkmInfo));
				this.setAttribute('style', 'background-image: url(' + pkmInfo.icon + ')');
				
				var fmoves = JSON.parse(JSON.stringify(pkmInfo.fastMoves));
				for (let move of pkmInfo.fastMoves_legacy){	fmoves.push(move + "*"); }
				for (let move of pkmInfo.fastMoves_exclusive){ fmoves.push(move + "**"); }
				var cmoves = JSON.parse(JSON.stringify(pkmInfo.chargedMoves));
				for (let move of pkmInfo.chargedMoves_legacy){	cmoves.push(move + "*"); }
				for (let move of pkmInfo.chargedMoves_exclusive){ cmoves.push(move + "**"); }
				pkmInfo.fmoves = toTitleCase(fmoves.join(", "));
				pkmInfo.cmoves = toTitleCase(cmoves.join(", "));

				write(pokemonInput, pkmInfo);
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompletePokemonItem;
}


function pokemonEditFormSubmit(){
	var pokemonInput = document.getElementById("pokemonEditForm-table");
	
	var pokemon = read(pokemonInput);
	var orginalLabel = pokemon.name;
	pokemon.name = pokemon.name.toLowerCase();
	
	pokemon.fastMoves = [];
	pokemon.fastMoves_legacy = [];
	pokemon.fastMoves_exclusive = [];
	pokemon.chargedMoves= [];
	pokemon.chargedMoves_legacy = [];
	pokemon.chargedMoves_exclusive = [];
	
	for (let mType of ['fast', 'charged']){
		var Database = Data[toTitleCase(mType) + "Moves"];
		for (let moveName of pokemon[mType[0] + "moves"].split(',')){
			moveName = moveName.trim().toLowerCase();
			var poolPostFix = '';
			if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
				moveName = moveName.substring(0, moveName.length - 2);
				poolPostFix = '_exclusive';
			}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
				moveName = moveName.substring(0, moveName.length - 1);
				poolPostFix = '_legacy';
			}
			if (getEntry(moveName, Database)){
				pokemon[mType + "Moves" + poolPostFix].push(moveName);
			}
		}
		delete pokemon[mType[0] + "moves"];
	}
	
	var pokemon2 = getEntry(pokemon.name, Data.Pokemon);
	if (pokemon2){
		leftMerge(pokemon2, pokemon);
		pokemon = pokemon2;
		sendFeedbackDialog('Pokemon: ' + pokemon.label + ' has been updated.');
	}else{
		pokemon.dex = 0;
		pokemon.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pokemon.label = orginalLabel;
		pokemon.rating = 0;
		insertEntry(pokemon, Data.Pokemon);
		sendFeedbackDialog('Pokemon: ' + pokemon.label + ' has been added.');
	}

	insertEntry(pokemon, LocalData.Pokemon);
	saveLocalData();
}


function pokemonEditFormReset(){
	Data.Pokemon = [];
	fetchSpeciesData(function(){
		handleSpeciesDatabase(Data.Pokemon);
		manuallyModifyData(Data);
		for (var i = 0; i < LocalData.Pokemon.length; i++){
			if (getEntry(LocalData.Pokemon[i].name, Data.Pokemon)){
				LocalData.Pokemon.splice(i--, 1);
			}
		}
		saveLocalData();
		sendFeedbackDialog("Latest Pokemon Data have been fetched");
	});
}


function pokemonEditFormDelete(){
	var pokemonInput = document.getElementById("pokemonEditForm-table");
	var pokemonName = $$$(pokemonInput).child("pokemon-name").val();
	if (removeEntry(pokemonName, Data.Pokemon) && removeEntry(pokemonName, LocalData.Pokemon)){
		saveLocalData();
		sendFeedbackDialog("Pokemon: " + pokemonName + " has been removed");
	}
}


function parameterEditFormInit(){
	$( "#parameterEditForm" ).attr("style", "visibility: show;");
	$( "#parameterEditForm" ).dialog({ 
		autoOpen: false,
		width: 600,
		maxHeight: 700
	});
	$( "#parameterEditFormOpener" ).click(function() {
		$( "#parameterEditForm" ).dialog( "open" );
	});

	var parameterTable = document.getElementById('parameterEditForm-Table');
	for (var attr in Data.BattleSettings){
		var row = createRow([attr, "<input type='number' id='parameterEditForm-" + attr + "'></input>"],'td');
		row.children[1].children[0].value = Data.BattleSettings[attr];
		parameterTable.children[1].appendChild(row);
	};
}


function parameterEditFormSubmit(){
	var EDITABLE_PARAMETERS = {};
	for (var attr in Data.BattleSettings){
		Data.BattleSettings[attr] = parseFloat(document.getElementById('parameterEditForm-'+attr).value) || 0;
	};
	saveLocalData();
	sendFeedbackDialog("Battle settings have been updated");
}


function parameterEditFormReset(){
	LocalData.BattleSettings = {};
	Data.BattleSettings = JSON.parse(JSON.stringify(DefaultData.BattleSettings));
	saveLocalData();
	sendFeedbackDialog("Battle settings have been reset");
}


function userEditFormInit(){
	$( "#userEditForm" ).attr("style", "visibility: show;");
	$( "#boxEditForm" ).attr("style", "visibility: show;");
	$( "#userEditForm" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#userEditFormOpener" ).click(function() {
		updateUserTable();
		$( "#userEditForm" ).dialog( "open" );
	});

	$( "#boxEditForm" ).dialog({
		autoOpen: false,
		width: 600
	});
	$( '#boxEditForm-pokemonTable' ).DataTable({
		scrollX: true,
		scrollY: '50vh',
		scroller: true,
		searching: false
	});
}


function userEditFormAddUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	fetchUserData(userID, function(){
		fetchUserTeamData(userID);
		sendFeedbackDialog("Imported user " + userID);
		updateUserTable();
	});
}


function userEditFormRemoveUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	var userIndex = getEntryIndex(userID, Data.Users);
	if (userIndex >= 0){
		Data.Users.splice(userIndex, 1);
		updateUserTable();
		sendFeedbackDialog("Successfully removed user " + userID);
	}else{
		sendFeedbackDialog("No user with ID " + userID + " was found");
	}
}


function updateUserTable(){
	var table = document.getElementById('userEditForm-userTable');
	table.children[1].innerHTML = '';
	for (var i = 0; i < Data.Users.length; i++){
		table.children[1].appendChild(createRow([
			Data.Users[i].uid,
			Data.Users[i].box.length,
			'<button onclick="updateBoxTable(' + Data.Users[i].uid + ')">View Box</button>'
		], 'td'));
	}
}


function updateBoxTable(uid){
	document.getElementById('boxEditForm-title').innerHTML = "User ID: " + uid;
	var boxEditFormTable = $('#boxEditForm-pokemonTable').DataTable();
	let user = getEntry(uid, Data.Users);
	var box = user.box;
	
	$( "#boxEditForm" ).dialog( "open" );
	boxEditFormTable.clear();
	for (var i = 0; i < box.length; i++){
		var fmove = getEntry(box[i].fmove, Data.FastMoves), cmove = getEntry(box[i].cmove, Data.ChargedMoves);
		boxEditFormTable.row.add([
			i+1,
			createIconLabelSpan(box[i].icon, box[i].label, 'species-input-with-icon'),
			createIconLabelSpan(getTypeIcon({pokeType: box[i].pokeType1}), toTitleCase(box[i].pokeType1), 'move-input-with-icon'),
			createIconLabelSpan(getTypeIcon({pokeType: box[i].pokeType2}), toTitleCase(box[i].pokeType2), 'move-input-with-icon'),
			box[i].cp,
			box[i].level,
			box[i].stmiv,
			box[i].atkiv,
			box[i].defiv,
			createIconLabelSpan(fmove.icon, fmove.label, 'move-input-with-icon'),
			createIconLabelSpan(cmove.icon, cmove.label, 'move-input-with-icon')
		]);
	}
	boxEditFormTable.columns.adjust().draw();
}


function modEditFormInit(){
	var tbody = document.getElementById('modEditForm-table-body');
	if (tbody){
		tbody.innerHTML = '';
		for (var i = 0; i < Mods.length; i++){
			tbody.appendChild(createRow([
				Mods[i].name,
				"<input type='checkbox' id='mod_checkbox_" + i + "'>"
			]));
		}
	}
	$( "#modEditForm" ).attr("style", "visibility: show;");
	$( "#modEditForm" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#modEditFormOpener" ).click(function() {
		$( "#modEditForm" ).dialog( "open" );
	});
}


function modEditFormSubmit(){
	fetchAll(function(){
		for (var i = 0; i < Mods.length; i++){
			var mod_checkbox = document.getElementById('mod_checkbox_' + i);
			if (mod_checkbox && mod_checkbox.checked){
				Mods[i].effect(Data);
			}
		}
		sendFeedbackDialog("Mods have been applied");
	}, false);
}


function MVLTableInit(){
	$( "#MVLTable" ).attr("style", "visibility: show;");
	$( "#MVLTable" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#MVLTableOpener" ).click(function() {
		$( "#MVLTable" ).dialog( "open" );
	});
	var friendStartEl = document.getElementById("MVLTable-friendStart"), friendEndEl = document.getElementById("MVLTable-friendEnd");
	for (var i = 0; i < Data.FriendSettings.length; i++){
		friendStartEl.appendChild(createElement("option", Data.FriendSettings[i].name, {"value": i}));
		friendEndEl.appendChild(createElement("option", Data.FriendSettings[i].name, {"value": i}));
	}
	friendStartEl.value = 0;
	friendEndEl.value = Data.FriendSettings.length - 1;
	
}

function MVLTableSubmit(){
	sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Simulating...");
	setTimeout(function(){
		try{
			MVLTableCalculate();
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
		}catch(err){
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
			sendFeedbackDialog("Oops, something went wrong!");
		}
	}, 100);
}


function MVLTableCalculate(){
	var baseConfig = read();
	baseConfig.aggregation = 'avrg';
	baseConfig.simPerConfig = 100;
	
	var configurations = batchSim(baseConfig); // Each configuration will take a row
	
	var friends = [], frendStart = parseInt($("#MVLTable-friendStart").val()), friendEnd = parseInt($("#MVLTable-friendEnd").val());
	for (var i = frendStart; i <= friendEnd; i++){
		friends.push(Data.FriendSettings[i].name);
	}
	
	var data = [];
	for (let config of configurations){
		let defendingPlayer = null;
		for (let player of config.players){
			if (player.team == "1"){
				defendingPlayer = player;
				break;
			}
		}
		var rowDict = {
			"Weather": baseConfig.weather,
			"Fast": defendingPlayer.parties[0].pokemon[0].fmove,
			"Charged": defendingPlayer.parties[0].pokemon[0].cmove
		};
		for (let friendLevel of friends){
			for (let player of config.players){
				if (player.team == "0"){
					player.friend = friendLevel;
				}
			}
			var winRates = new Array(Data.LevelSettings.length), lower = 0, upper = Data.LevelSettings.length - 1;
			while (upper >= lower){
				var mid = Math.floor((lower + upper)/2);
				winRates[mid] = getWinRate(Data.LevelSettings[mid].name, baseConfig);
				if (winRates[mid] >= 0.6){	
					upper = mid - 1;
				}else{
					lower = mid + 1;
				}
			}
			rowDict[friendLevel] = Data.LevelSettings[Data.LevelSettings.length - 1].name + "*";
			for (var k = 0; k < winRates.length; k++){
				if (winRates[k] >= 0.6){
					rowDict[friendLevel] = Data.LevelSettings[k].name;
					break;
				}
			}
		}
		data.push(rowDict);
	}
	
	var columns = ["Weather", "Fast", "Charged"].concat(friends);
	var tb = document.getElementById("MVLTable-table");
	tb.children[0].innerHTML = "";
	tb.children[0].appendChild(createRow(columns, "th"));
	tb.children[1].innerHTML = "";
	for (var i = 0; i < data.length; i++){
		var rowArr = [];
		for (var j = 0; j < columns.length; j++){
			rowArr.push(data[i][columns[j]]);
		}
		tb.children[1].appendChild(createRow(rowArr));
	}
	
}


function getWinRate(level, cfg){
	for (let player of cfg.players){
		if (player.team == "0"){
			for (let party of player.parties){
				for (let pokemon of party.pokemon){
					pokemon.level = level;
				}
			}
		}
	}
	return parseFloat(runSimulation(cfg)[0].output.generalStat.battle_result);
}


var teamBuilderPartyPermutationStats = {};

function getPokemonByNID(nid){
	for (let user of Data.Users){
		for (let pokemon of user.box){
			if (pokemon.nid == nid){
				return pokemon;
			}
		}
	}
	return null;
}


function teamBuilderInit(){
	$( "#teamBuilder" ).attr("style", "visibility: show;");
	$( "#teamBuilder" ).dialog({ 
		autoOpen: false,
		width: 800
	});
	$( "#teamBuilderOpener" ).click(function() {
		$( "#teamBuilder" ).dialog( "open" );
	});
	
	var pokemonDT = $( "#teamBuilder-pokemonTable" ).DataTable({
		data: [],
		columns: [
			{ data: 'iconLabel', title: "Pokemon"},
			{ data: 'dps', title: "DPS", "orderSequence": [ "desc", "asc"]},
			{ data: 'tdo', title: "TDO", "orderSequence": [ "desc", "asc"]}
		],
		order: [],
		scrollY: "50vh",
		scroller: true,
		searching: false,
		info: false
	});
	
	var partyDT = $( "#teamBuilder-partyTable" ).DataTable({
		data: [],
		columns: [
			{ data: 'iconLabel', title: "Pokemon"}
		],
		scrollY: "50vh",
		scroller: true,
		searching: false,
		ordering: false,
		info: false
	});
	
	$( partyDT.table().body() ).sortable({
		stop: function(event, ui){
			var partySize = partyDT.table().body().children.length;
			if ((ui.position.left < -100 || ui.position.left > 100) & partySize > 1){
				var data = partyDT.rows().data();
				for (var i = 0; i < data.length; i++){
					if (data[i].nid == ui.item[0].getAttribute("nid")){
						partyDT.row(i).remove();
					}
				}
				partyDT.draw();
			}
			teamBuilderUpdatePartyStats();
		}
	});
	
	$( "#teamBuilder-partyTable-dropArea" ).droppable({
		drop: function(event, ui){
			if (ui.draggable){
				var partySize = partyDT.table().body().children.length;
				if (partySize < 6){
					var pokemon = getPokemonByNID(ui.draggable[0].getAttribute("nid"));
					var pokemonCopy = JSON.parse(JSON.stringify(pokemon));
					pokemonCopy.iconLabel = createIconLabelSpan(pokemon.icon, pokemon.label, "species-input-with-icon");
					partyDT.row.add(pokemonCopy);
					partyDT.draw();
					partyDT.row(partySize).node().setAttribute("nid", pokemonCopy.nid);
					teamBuilderUpdatePartyStats();
				}
			}
		}
	});

}


function teamBuilderSubmit(type){
	if (type == 0){
		teamBuilderPartyPermutationStats = {};
		calculationMethod = teamBuilderCalculatePokemon;
		sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Evaluating Pokemon...");
	}else if (type == 1){
		calculationMethod = teamBuilderCalculateParty;
		sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Calculating optimal permuation...");
	}
	setTimeout(function(){
		try{
			calculationMethod();
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
		}catch(err){
			while (DialogStack.length){
				DialogStack.pop().dialog('close');
			}
			sendFeedbackDialog("Oops, something went wrong!");
		}
	}, 100);
}


function teamBuilderReadConfig(numAttacker){
	var baseConfig = read();
	
	var baseAttackingPlayer = null;
	var defendingPlayer = null;
	for (let player of baseConfig.players){
		if (player.team == "1"){
			defendingPlayer = player;
		}else{
			baseAttackingPlayer = player;
		}
	}
	baseAttackingPlayer.parties = baseAttackingPlayer.parties.slice(0, 1);
	
	var raidTier = defendingPlayer.parties[0].pokemon[0].raidTier;
	baseConfig.players = [baseAttackingPlayer];
	if (raidTier > 3 || numAttacker){
		numAttacker = numAttacker || 4;
		for (var r = 0; r < numAttacker - 1; r++){ // 3 clone players for Tier 4+ raids
			baseConfig.players.push(baseAttackingPlayer);
		}
	}
	baseConfig.players.push(defendingPlayer);
	baseConfig.aggregation = "avrg";
	
	return baseConfig;
}


function teamBuilderCalculatePokemon(){		
	var baseConfig = teamBuilderReadConfig();
	var baseAttackingPlayer = baseConfig.players[0];
	var defendingPlayer = baseConfig.players[baseConfig.players.length - 1];
	var bestParty = baseAttackingPlayer.parties[0];
	bestParty.revive = false;
	bestParty.pokemon = [];
	
	defendingPlayer.parties[0].pokemon[0].immortal = true;
	var numAttacker = baseConfig.players.length - 1;
	
	// 1. Find out individual Pokemon's performance
	var allPokemon = [];
	for (let user of Data.Users){
		for (let pokemon of user.box){
			var pokemonCopy = JSON.parse(JSON.stringify(pokemon));
			pokemonCopy.iconLabel = createIconLabelSpan(pokemon.icon, pokemon.label, "species-input-with-icon");
			allPokemon.push(pokemonCopy);
		}
	}
	if (allPokemon.length == 0){
		sendFeedbackDialog("No Pokemon in your box! Please log in and enter some Pokemon.");
		return;
	}
	baseConfig.timelimit = -1;
	baseConfig.simPerConfig = 100;
	
	var pokemonDT = $( "#teamBuilder-pokemonTable" ).DataTable();
	pokemonDT.clear();
	for (let pokemon of allPokemon){
		pokemon.copies = 6;
		pokemon.role = "a";
		pokemon.strategy = "strat1";
		bestParty.pokemon = [pokemon];
		let intermediateSimResults = [];
		for (let config of batchSim(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		var avrgSim = averageSimulations(intermediateSimResults);
		pokemon.dps = round(avrgSim.output.generalStat.dps / numAttacker, 3);
		pokemon.tdo = round(avrgSim.output.generalStat.tdo / numAttacker / 6, 1);
		pokemonDT.row.add(pokemon);
	}
	pokemonDT.draw();
	var pokemonDTData = pokemonDT.rows().data();
	var pokemonDTRows = pokemonDT.rows().nodes();
	for (var i = 0; i < pokemonDTData.length; i++){
		var tr = pokemonDTRows[i];
		tr.setAttribute("nid", pokemonDTData[i].nid);
		$(tr).draggable({
			appendTo: "#teamBuilder",
			scroll: false,
			helper: "clone",
			zIndex: 100
		});
	}
	
	// 2. Output the naive best party - top six Pareto Pokemon
	var paretoPokemon = [], inferiorPokemon = [];
	allPokemon.sort(function(x, y){
		return y.dps - x.dps;
	});
	let bestTDO = 0;
	for (let pokemon of allPokemon){
		pokemon.copies = 1;
		if (paretoPokemon.length == 0 || pokemon.tdo >= bestTDO){
			paretoPokemon.push(pokemon);
			bestTDO = pokemon.tdo;
		}else{
			inferiorPokemon.push(pokemon);
		}
	}
	// If less than 6, fill with "interior" options
	while (paretoPokemon.length < 6 && inferiorPokemon.length > 0){
		paretoPokemon.push(inferiorPokemon.shift());
	}
	// If more than 6, just pick the first 6
	paretoPokemon = paretoPokemon.slice(0, 6);
	
	teamBuilderWritePartyTable(paretoPokemon);
	teamBuilderUpdatePartyStats();
}


function teamBuilderWritePartyTable(pokemonArr){
	var partyDT = $( "#teamBuilder-partyTable" ).DataTable();
	partyDT.clear();
	for (let pokemon of pokemonArr){
		partyDT.row.add(pokemon);
	}
	partyDT.draw();
	var partyDTData = partyDT.rows().data();
	var partyDTRows = partyDT.rows().nodes();
	for (var i = 0; i < partyDTData.length; i++){
		var tr = partyDTRows[i];
		tr.setAttribute("nid", partyDTData[i].nid);
	}
}


function teamBuilderReadPartyTable(){
	var partyDT = $( "#teamBuilder-partyTable" ).DataTable();
	var party = [];
	for (let tr of partyDT.table().body().children){
		var pokemon = getPokemonByNID(tr.getAttribute("nid"));
		pokemon = JSON.parse(JSON.stringify(pokemon));
		pokemon.copies = 1;
		pokemon.role = "a";
		pokemon.strategy = "strat1";
		pokemon.iconLabel = createIconLabelSpan(pokemon.icon, pokemon.label, "species-input-with-icon");
		party.push(pokemon);
	}
	return party;
}


function teamBuilderCalculateParty(){
	var baseConfig = teamBuilderReadConfig();
	var baseAttackingPlayer = baseConfig.players[0];
	var defendingPlayer = baseConfig.players[baseConfig.players.length - 1];
	var bestParty = baseAttackingPlayer.parties[0];
	bestParty.revive = false;
	bestParty.pokemon = [];
	baseConfig.simPerConfig = 100;
	var numAttacker = baseConfig.players.length - 1;
	
	var party = teamBuilderReadPartyTable();
	if (party.length == 0){
		while (DialogStack.length){
			DialogStack.pop().dialog('close');
		}
		sendFeedbackDialog("Party is empty. Analzye Pokemon first.");
		return;
	}
	
	// Test all permuations of parties
	var bestStats = null;
	var bestPermuation = null;
	for (let permutation of Permutation(party, party.length)){ // Did you know that 36 = 6!?
		bestParty.pokemon = permutation;
		let intermediateSimResults = [];
		for (let config of batchSim(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		let curStats = averageSimulations(intermediateSimResults).output.generalStat;
		curStats.dps = curStats.dps / numAttacker;
		curStats.tdo_percent = curStats.tdo_percent / numAttacker;
		if (!bestStats || curStats.dps > bestStats.dps){
			bestPermuation = permutation;
			bestStats = curStats;
		}
		let nids = [];
		for (let pokemon of permutation){
			nids.push(pokemon.nid);
		}
		teamBuilderPartyPermutationStats[nids.join("->")] = curStats;
	}
	
	// 3. Output the party
	teamBuilderWritePartyTable(bestPermuation);
	teamBuilderUpdatePartyStats();
}


function teamBuilderUpdatePartyStats(){
	var partyDT = $( "#teamBuilder-partyTable" ).DataTable();
	var nids = [];
	for (let row of partyDT.table().body().children){
		nids.push(row.getAttribute("nid"));
	}
	var key = nids.join("->");
	var curStats = teamBuilderPartyPermutationStats[key];
	if (!curStats){ // Calculate the party on-the-fly
		var baseConfig = teamBuilderReadConfig();
		var baseAttackingPlayer = baseConfig.players[0];
		var bestParty = baseAttackingPlayer.parties[0];
		bestParty.revive = false;
		baseConfig.simPerConfig = 100;
		var numAttacker = baseConfig.players.length - 1;
		bestParty.pokemon = teamBuilderReadPartyTable();
		let intermediateSimResults = [];
		for (let config of batchSim(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		curStats = averageSimulations(intermediateSimResults).output.generalStat;
		curStats.dps = curStats.dps / numAttacker;
		curStats.tdo_percent = curStats.tdo_percent / numAttacker;
		teamBuilderPartyPermutationStats[key] = curStats;
	}
	document.getElementById("teamBuilder-optimalPartyDPS").innerHTML = round(curStats.dps, 2);
	document.getElementById("teamBuilder-optimalPartyTDO").innerHTML = round(curStats.tdo_percent, 2) + "%";
}


function teamBuilderSaveParty(){
	var namePostFix = 0;
	while (getEntry("Best_Party_" + namePostFix, LocalData.BattleParties)){
		namePostFix++;
	}
	var partyName = "Best_Party_" + namePostFix;
	var bestParty = {
		name: partyName,
		label: partyName,
		pokemon: []
	};
	var partyDT = $( "#teamBuilder-partyTable" ).DataTable();
	var pokemonData = partyDT.rows().data();
	for (var i = 0; i < pokemonData.length; i++){
		bestParty.pokemon.push(pokemonData[i]);
	}
	insertEntry(bestParty, LocalData.BattleParties);
	saveLocalData();
	sendFeedbackDialog('This party has been saved with the name "' + partyName + '"');
}


function typeCheckerInit(){
	$( "#typeChecker" ).attr("style", "visibility: show;");
	$( "#typeChecker" ).dialog({ 
		autoOpen: false,
		width: 800
	});
	$( "#typeCheckerOpener" ).click(function() {
		$( "#typeChecker" ).dialog( "open" );
	});
	
	var partyTR = document.getElementById("typeChecker-party");
	for (var i = 0; i < partyTR.children.length; i++){
		var partyTD = partyTR.children[i];
		partyTD.setAttribute("name", "pokemon");
		partyTD.appendChild(createPokemonNameInput());
		partyTD.appendChild(createPokemonMoveInput("fast", "fmove"));
		partyTD.appendChild(createPokemonMoveInput("charged", "cmove"));
		partyTD.appendChild(createPokemonMoveInput("charged", "cmove2"));
		for (var j = 0; j < partyTD.children.length; j++){
			$( partyTD.children[j] ).autocomplete( "option", "appendTo", "#typeChecker" );
			$( partyTD.children[j] ).on( "autocompleteselect", function( event, ui ) {
				this.value = ui.item.value;
				typeCheckerSubmit();
			} );
		}
	}
	var numColumns = 6;
	if (window.innerWidth <= 800){
		numColumns = 3;
	}
	var offensiveTable = document.getElementById("typeChecker-offensive");
	var defensiveTable = document.getElementById("typeChecker-defensive");
	var count = 0;
	var tr = [];
	for (var t1 in Data.TypeEffectiveness){
		tr.push(toTitleCase(t1));
		count++;
		if (count % numColumns == 0){
			offensiveTable.appendChild(createRow(tr));
			defensiveTable.appendChild(createRow(tr));
			tr = [];
		}
	}
	if (tr.length > 0){
		offensiveTable.appendChild(createRow(tr));
		defensiveTable.appendChild(createRow(tr));
	}
}


function typeCheckerSubmit(){
	var maxMultiplier = 0, minMultiplier = 0;
	for (var t1 in Data.TypeEffectiveness){
		for (var t2 in Data.TypeEffectiveness[t1]){
			let m = Data.TypeEffectiveness[t1][t2];
			if (typeof m == typeof 0){
				maxMultiplier = Math.max(maxMultiplier, Math.log(m));
				minMultiplier = Math.min(minMultiplier, Math.log(m));
			}
		}
	}
	
	var partyConfig = read(document.getElementById("typeChecker-party"));
	var pokemonReps = [];
	for (let pokemonConfig of partyConfig.pokemon){
		var pokemonRep = {
			pokeType1: "none", pokeType2: "none", attackingTypes: []
		};
		if (getEntry(pokemonConfig.name.toLowerCase(), Data.Pokemon)){
			let p = new Pokemon(pokemonConfig);
			pokemonRep.pokeType1 = p.pokeType1;
			pokemonRep.pokeType2 = p.pokeType2;
			pokemonRep.attackingTypes.push(p.fmove.pokeType || "none");
			for (let move of p.cmoves){
				pokemonRep.attackingTypes.push(move.pokeType || "none");
			}
		}else{
			return;
		}
		pokemonReps.push(pokemonRep);
	}
	
	// Helper functions
	function getAggregatedMultiplier(multipliers, aggregation){
		var summary = {
			max: multipliers[0],
			min: multipliers[0],
			sum: 0
		};
		for (let m of multipliers){
			summary.max = Math.max(m, summary.max);
			summary.min = Math.min(m, summary.min);
			summary.sum += m;
		}
		summary.avrg = summary.sum / multipliers.length;
		return summary[aggregation];
	}
	function RGBString(r, g, b){
		return "background: rgb(" + r + "," + g + "," + b + ")";
	}
	
	// Offensive
	var aggregation = $("#typeChecker-offensive-aggregation").val();
	var offensiveTable = document.getElementById("typeChecker-offensive");
	for (var i = 0; i < offensiveTable.children.length; i++){
		for (var j = 0; j < offensiveTable.children[i].children.length; j++){
			var td = offensiveTable.children[i].children[j];
			var multipliers = [];
			for (let pokemonRep of pokemonReps){
				for (let attackingType of pokemonRep.attackingTypes){
					if (Data.TypeEffectiveness[attackingType]){
						let m = Data.TypeEffectiveness[attackingType][td.innerHTML.toLowerCase()];
						multipliers.push(Math.log(m));
					}
				}
			}
			var aggregatedMultiplier = getAggregatedMultiplier(multipliers, aggregation);
			if (aggregatedMultiplier >= 0){
				let delta = Math.round(aggregatedMultiplier / maxMultiplier * 255);
				td.setAttribute("style", RGBString(255 - delta, 255, 255 - delta));
			}else{
				let delta = Math.round(aggregatedMultiplier / minMultiplier * 255);
				td.setAttribute("style", RGBString(255, 255 - delta, 255 - delta));
			}
		}
	}
	
	// Defensive
	var aggregation = $("#typeChecker-defensive-aggregation").val();
	var defensiveTable = document.getElementById("typeChecker-defensive");
	for (var i = 0; i < defensiveTable.children.length; i++){
		for (var j = 0; j < defensiveTable.children[i].children.length; j++){
			var td = defensiveTable.children[i].children[j];
			let attackingType = td.innerHTML.toLowerCase();
			var multipliers = [];
			for (let pokemonRep of pokemonReps){
				let m1 = Data.TypeEffectiveness[attackingType][pokemonRep.pokeType1] || 1;
				let m2 = Data.TypeEffectiveness[attackingType][pokemonRep.pokeType2] || 1;
				multipliers.push(Math.log(m1 * m2));
			}
			var aggregatedMultiplier = getAggregatedMultiplier(multipliers, aggregation);
			if (aggregatedMultiplier >= 0){
				let delta = Math.round(aggregatedMultiplier / (2*maxMultiplier) * 255);
				td.setAttribute("style", RGBString(255, 255 - delta, 255 - delta));
			}else{
				let delta = Math.round(aggregatedMultiplier / (minMultiplier - maxMultiplier) * 255);
				td.setAttribute("style", RGBString(255 - delta, 255, 255 - delta));
			}
		}
	}
	
}


function battleMatrixInit(){
	$( "#battleMatrix" ).attr("style", "visibility: show;");
	$( "#battleMatrix" ).dialog({ 
		autoOpen: false,
		width: 800
	});
	$( "#battleMatrixOpener" ).click(function() {
		$( "#battleMatrix" ).dialog( "open" );
	});	
}

function parseCSVRow(str, deli, echar){
	var data = [];
	var word = "";
	var escaped = false;
	for (var i = 0; i < str.length; i++){
		if (str[i] == echar){
			if (escaped){
				data.push(word);
				word = "";
				escaped = false;
			}else{
				escaped = true;
			}
		}else if (str[i] == deli){
			if (escaped){
				word += deli;
			}else{
				data.push(word);
				word = "";
			}
		}else{
			word += str[i];
		}
	}
	if (word){
		data.push(word);
	}	
	return data;
}


function battleScore(x, y){
	var config = {
	  "players": [
		{
		  "team": "0",
		  "friend": "none",
		  "parties": [
			{
			  "name": "",
			  "pokemon": [x],
			  "revive": false
			}
		  ]
		},
		{
		  "team": "1",
		  "friend": "none",
		  "parties": [
			{
			  "name": "",
			  "pokemon": [y],
			  "revive": false
			}
		  ]
		}
	  ],
	  "battleMode": "pvp",
	  "timelimit": -1,
	  "weather": "EXTREME",
	  "aggregation": "enum"
	};

	w = new World(config);
	w.init();
	w.battle();
	
	let battleResult = w.getStatistics();
	let x_hp_left = Math.max(0, battleResult.pokemonStats[0][0][0].hp), y_hp_left = Math.max(0, battleResult.pokemonStats[1][0][0].hp);
	let x_hp_max = w.players[0].parties[0].pokemon[0].maxHP, y_hp_max = w.players[1].parties[0].pokemon[0].maxHP;
	
	var score = Math.log( ((y_hp_max - y_hp_left)/y_hp_max) / ((x_hp_max - x_hp_left)/x_hp_max) );
	return score;
}

function generateBattleMatrix(pokemonVector){
	var matrix = [];
	var n = pokemonVector.length;
	for (var i = 0; i < n; i++){
		matrix.push(new Array(n));
	}
	for (var i = 0; i < n; i++){
		matrix[i][i] = 0;
		for (var j = i + 1; j < n; j++){
			let score = battleScore(pokemonVector[i], pokemonVector[j]);
			matrix[i][j] = score;
			matrix[j][i] = -score;
		}
	}
	return matrix;
}

function battleMatrixReadFromMain(){
	var deli = $("#battleMatrix-delimieter").val();
	var rawInput = $("#battleMatrix-input").val().split("\n");
	var attributes = parseCSVRow(rawInput[0], deli, '"');
	
	var config = read();
	for (let player of config.players){
		for (let party of player.parties){
			for (let pokemon of party.pokemon){
				var pokemonRow = [];
				for (let a of attributes){
					var attr = pokemon[a] || "";
					if (attr.includes(deli)){
						attr = '"' + attr + '"';
					}
					pokemonRow.push(attr);
				}
				rawInput.push(pokemonRow.join(deli));
			}
		}
	}
	$("#battleMatrix-input").val(rawInput.join("\n"));
}

function battleMatrixSubmit(){
	assignMoveParameterSet("load", Data.FastMoves, "combat");
	assignMoveParameterSet("load", Data.ChargedMoves, "combat");
	
	var deli = $("#battleMatrix-delimieter").val();
	var rawInput = $("#battleMatrix-input").val().split("\n");
	var attributes = parseCSVRow(rawInput[0], deli, '"');
	
	var namedRowCol = parseInt($("#battleMatrix-named").val());
	var subMatrixSpecs = $("#battleMatrix-submatrix").val().split(',');
	for (var i = 0; i < 4; i++){
		subMatrixSpecs[i] = parseInt(subMatrixSpecs[i]);
	}
	
	var pokemonVector = [];
	for (var i = 1; i < rawInput.length; i++){
		var rowData = parseCSVRow(rawInput[i], deli, '"');
		var pokemon = {};
		for (var j = 0; j < attributes.length; j++){
			pokemon[attributes[j]] = (rowData[j] || "").trim();
		}
		pokemon.copies = 1;
		if (pokemon.hasOwnProperty("cp")){
			pokemon.role = "a_basic";
		}
		
		// Validation
		if (!pokemon.name || !getEntry(pokemon.name.toLowerCase(), Data.Pokemon)){
			return sendFeedbackDialog("At row " + i + ": Unknown Pokemon: " + pokemon.name);
		}
		if (!pokemon.fmove || !getEntry(pokemon.fmove.toLowerCase(), Data.FastMoves)){
			return sendFeedbackDialog("At row " + i + ": Unknown Move: " + pokemon.fmove);
		}
		if (!pokemon.cmove || !getEntry(pokemon.cmove.toLowerCase(), Data.ChargedMoves)){
			return sendFeedbackDialog("At row " + i + ": Unknown Move: " + pokemon.cmove);
		}
		pokemonVector.push(pokemon);
	}
	
	var matrix = generateBattleMatrix(pokemonVector);
	
	let startRow = Math.max(1, subMatrixSpecs[0] || 1) - 1;
	let endRow = Math.min(matrix.length, subMatrixSpecs[1] || matrix.length);
	let startCol = Math.max(1, subMatrixSpecs[2] || 1) - 1;
	let endCol = Math.min(matrix.length, subMatrixSpecs[3] || matrix.length);
	matrix = matrix.slice(startRow, endRow);
	for (var i = 0; i < matrix.length; i++){
		matrix[i] = matrix[i].slice(startCol, endCol);
	}
	
	if (namedRowCol){
		for (var i = 0; i < matrix.length; i++){
			matrix[i].unshift(pokemonVector[i + startRow].name);
		}
		var headerRow = [""];
		for (var i = 0; i < endCol - startCol; i++){
			headerRow.push(pokemonVector[i + startCol].name);
		}
		matrix.unshift(headerRow);
	}
	
	var rawOutput = "";
	for (var i = 0; i < matrix.length; i++){
		rawOutput += matrix[i].join("\t") + "\n";
	}
	document.getElementById("battleMatrix-output").value = rawOutput;
}
