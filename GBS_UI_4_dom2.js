/* GBS_UI_4_dom2.js */

var Mods = [
	{
		name: 'Ultimate Future Pokemon Expansion',
		effect: function(_data){
			_data.Pokemon = mergeDatabase(_data.Pokemon, _data.PokemonForms, function(a, b){
				if (a.dex <= 386){
					a.icon = b.icon;
					return a;
				}else
					return b;
			});
		}
	},
	{
		name: 'Nerf cp4354+ Future Pokemon by 9%',
		effect: function(_data){
			_data.Pokemon.forEach(function(pkm){
				if (pkm.dex != 289){ // Not Slaking
					var pkm2 = new Pokemon({
						name: pkm.name,
						atkiv: 15,
						defiv: 15,
						stmiv: 15,
						level: 40
					});
					if (calculateCP(pkm2) >= 4354){
						pkm.baseAtk = round(pkm.baseAtk * 0.91);
						pkm.baseDef = round(pkm.baseDef * 0.91);
						pkm.baseStm = round(pkm.baseStm * 0.91);
					}
				}
			});
		}
	},
	{
		name: 'Exclude Low-rating and Low-stat Species',
		effect: function(_data){
			var Pokemon_new = [];
			for (var i = 0; i < _data.Pokemon.length; i++){
				pkm = _data.Pokemon[i];
				if (pkm.rating && pkm.rating < 2 || pkm.baseAtk < 160){
					continue;
				}
				Pokemon_new.push(pkm);
			}
			_data.Pokemon = Pokemon_new;
		}
	},
	{
		name: 'Move Effects Expansion 1.1',
		effect: function(_data){
			var fmove_transform = getEntry('transform', _data.FastMoves);
			if (fmove_transform){
				fmove_transform.effect_name = 'transform';
			}
			var cmove_mega_drain = getEntry('mega drain', _data.ChargedMoves);
			if (cmove_mega_drain){
				cmove_mega_drain.effect_name = 'hp draining';
			}
			var cmove_giga_drain = getEntry('giga drain', _data.ChargedMoves);
			if (cmove_giga_drain){
				cmove_giga_drain.effect_name = 'hp draining';
			}
		}
	}
];


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
				this.setAttribute('style', 'background-image: url(' + move.icon + ')');
				write(moveInput, move);
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	$$$(moveInput).child("move-pokeType").node.onchange = function(){
		$$$(moveInput).child("move-name").node.setAttribute("style", "background-image: url(" + getTypeIcon({pokeType: this.value}) + ")");
	}
}


function moveEditFormSubmit(){
	var moveInput = document.getElementById("moveEditForm-table");
	var move = read(moveInput);
	move.name = move.name.trim().toLowerCase();
	move.icon = getTypeIcon({pokeType: move.pokeType});

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
		pkm.dex = 0;
		pkm.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pkm.label = toTitleCase(pokemon.name);
		pkm.rating = 0;
		insertEntry(pkm, Data.Pokemon);
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
		udpateUserTable();
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
		sendFeedbackDialog("Imported user " + userID);
		udpateUserTable();
	});
}


function userEditFormRemoveUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	var userIndex = getEntryIndex(userID, Data.Users);
	if (userIndex >= 0){
		Data.Users.splice(userIndex, 1);
		udpateUserTable();
		sendFeedbackDialog("Successfully removed user " + userID);
	}else{
		sendFeedbackDialog("No user with ID " + userID + " was found");
	}
}


function udpateUserTable(){
	var table = document.getElementById('userEditForm-userTable');
	table.children[1].innerHTML = '';
	for (var i = 0; i < Data.Users.length; i++){
		table.children[1].appendChild(createRow([
			Data.Users[i].uid,
			Data.Users[i].box.length,
			'<button onclick="udpateBoxTable(' + Data.Users[i].uid + ')">View Box</button>'
		], 'td'));
	}
}


function udpateBoxTable(uid){
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
				if (winRates[mid] >= 60){	
					upper = mid - 1;
				}else{
					lower = mid + 1;
				}
			}
			rowDict[friendLevel] = Data.LevelSettings[Data.LevelSettings.length - 1].name + "*";
			for (var k = 0; k < winRates.length; k++){
				if (winRates[k] >= 60){
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
	runSimulation(cfg);
	return parseFloat(runSimulation(cfg)[0].output.generalStat.battle_result);
}