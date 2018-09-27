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
			i+1,
			Data.Users[i].uid,
			Data.Users[i].box.length,
			'<button onclick="udpateBoxTable('+i+')">Manage Box</button>'
		],'td'));
	}
}

function udpateBoxTable(userIndex){
	document.getElementById('boxEditForm-title').innerHTML = 'User ' + Data.Users[userIndex].uid;
	var boxEditFormTable = $('#boxEditForm-pokemonTable').DataTable(), box = Data.Users[userIndex].box;
	
	$( "#boxEditForm" ).dialog( "open" );
	boxEditFormTable.clear();
	for (var i = 0; i < box.length; i++){
		var fmove = getEntry(box[i].fmove, Data.FastMoves), cmove = getEntry(box[i].cmove, Data.ChargedMoves);
		boxEditFormTable.row.add([
			i+1,
			createIconLabelSpan(box[i].icon, box[i].label, 'species-input-with-icon'),
			createIconLabelSpan(getTypeIcon({pokeType: box[i].pokeType1}), toTitleCase(box[i].pokeType1), 'move-input-with-icon'),
			createIconLabelSpan(getTypeIcon({pokeType: box[i].pokeType2}), toTitleCase(box[i].pokeType2), 'move-input-with-icon'),
			box[i].nickname,
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
	
	const userIndex_const = userIndex;
	document.getElementById('boxEditForm-submit').onclick = function(){
		boxEditFormSubmit(userIndex_const);
	}
}

function boxEditFormSubmit(userIndex){
	var data = $( '#boxEditForm-pokemonTable' ).DataTable().rows().data(), newBox = [];
	for (var i = 0; i < data.length; i++){
		newBox[i] = Data.Users[userIndex].box[parseInt(data[i][0]) - 1];
	}
	Data.Users[userIndex].box = newBox;
	sendFeedback("Box order has been saved", false, 'boxEditForm-feedback');
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
	
	for (let pkmType of ["attacker", "defender"]){
		var nameInput = createPokemonNameInput();
		document.getElementById("MVLTable-" + pkmType + "-name-td").appendChild(nameInput);
		$( nameInput ).autocomplete( "option", "appendTo", "#MVLTable-" + pkmType + "-name-td" );
		for (let moveType of ["fast", "charged"]){
			let moveInput = createPokemonMoveInput(moveType);
			document.getElementById("MVLTable-" + pkmType + "-" + moveType[0] + "move-td").appendChild(moveInput);
			$( moveInput ).autocomplete( "option", "appendTo", "#MVLTable-" + pkmType + "-" + moveType[0] + "move-td" );
		}
	}
	
	var weatherInput = document.getElementById("MVLTable-weather");
	for (let weatherSetting of Data.WeatherSettings){
		weatherInput.appendChild(createElement('option', weatherSetting.label, {value: weatherSetting.name}));
	}
	
}

function MVLTableSubmit(){
	sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>Simulating...");
	setTimeout(function(){
		try{
			MVLTableCalculate();
		}catch(err){
			sendFeedbackDialog("Oops, something went wrong!");
		}
		while (DialogStack.length){
			DialogStack.pop().dialog('close');
		}
	}, 100);
}

function MVLTableCalculate(){
	// TODO: MVL calculation engine
	var attackerConfig = read(document.getElementById("MVLTable-attacker"));
	var defenderConfig = read(document.getElementById("MVLTable-defender"));

	var numOfPlayer = attackerConfig.numOfPlayers;

	let baseConfig = {
		players: "",
		aggregation: "avrg"
	};
	baseConfig.aggregation = 'avrg';
	
	/*
	var movesets = [];
	if (document.getElementById("MVLTable-enumMovesets").checked){
		var bossSpecies = getEntry(baseConfig.dfdrSettings.name, Data.Pokemon);
		for (var i = 0; i < bossSpecies.fastMoves.length; i++){
			for (var j = 0; j < bossSpecies.chargedMoves.length; j++){
				movesets.push([bossSpecies.fastMoves[i], bossSpecies.chargedMoves[j]]);
			}
		}
	}else{
		movesets.push([baseConfig.dfdrSettings.fmove, baseConfig.dfdrSettings.cmove]);
	}
	var friends = [], frendStart = parseInt($("#MVLTable-friendStart").val()), friendEnd = parseInt($("#MVLTable-friendEnd").val());
	for (var i = frendStart; i <= friendEnd; i++){
		friends.push(Data.FriendSettings[i].name);
	}
	
	var data = [];
	for (var i = 0; i < movesets.length; i++){
		baseConfig.dfdrSettings.fmove = movesets[i][0];
		baseConfig.dfdrSettings.cmove = movesets[i][1];
		var rowDict = {
			"weather": baseConfig.weather,
			"fmove": movesets[i][0],
			"cmove": movesets[i][1]
		};
		for (var j = 0; j < friends.length; j++){
			basePlayer.friend = friends[j];
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
			rowDict[basePlayer.friend] = Data.LevelSettings[Data.LevelSettings.length - 1].name + "*";
			for (var k = 0; k < winRates.length; k++){
				if (winRates[k] >= 60){
					rowDict[basePlayer.friend] = Data.LevelSettings[k].name;
					break;
				}
			}
		}
		data.push(rowDict);
	}
	
	var columns = ["weather", "fmove", "cmove"].concat(friends);
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
	*/
}

function MVLTableClear(){
	document.getElementById("MVLTable-table").children[1].innerHTML = "";
}

function getWinRate(level, cfg){
	for (var i = 0; i < cfg.atkrSettings.length; i++){
		for (var j = 0; j < cfg.atkrSettings[i].parties.length; j++){
			for (var k = 0; k < cfg.atkrSettings[i].parties[j].pokemon.length; k++){
				cfg.atkrSettings[i].parties[j].pokemon[k].level = level;
			}
		}
	}
	var resCol = [];
	runSim(cfg, resCol);
	return parseFloat(resCol[0].output.generalStat.battle_result);
}