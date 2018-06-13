/* GBS_UI_4_dom2.js */


function moveEditFormSubmit(){
	var moveDatabaseName = document.getElementById('moveEditForm-moveType').value;
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (moveName == '')
		return;
	
	var move = {
		name: moveName,
		moveType: moveDatabaseName[0].toLowerCase(),
		power: parseInt(document.getElementById('moveEditForm-power').value),
		pokeType: document.getElementById('moveEditForm-pokeType').value.toLowerCase(),
		energyDelta: (moveDatabaseName[0].toLowerCase() == 'f' ? 1 : -1) * Math.abs(parseInt(document.getElementById('moveEditForm-energyDelta').value)),
		dws: Math.abs(parseFloat(document.getElementById('moveEditForm-dws').value)) * 1000,
		duration: Math.abs(parseFloat(document.getElementById('moveEditForm-duration').value)) * 1000
	};

	var move2 = getEntry(moveName, Data[moveDatabaseName]);
	
	if (move2){
		copyAllInfo(move2, move);
		move = move2;
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been updated.', false, 'moveEditForm-feedback');
	}else{
		move.label = toTitleCase(moveName);
		move.icon = "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + move.pokeType + ".png";
		insertEntry(move, Data[moveDatabaseName]);
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been added.', false, 'moveEditForm-feedback');
	}
	
	if (getEntryIndex(moveName, LocalData[moveDatabaseName]) < 0){
		insertEntry(move, LocalData[moveDatabaseName]);
	}
	saveLocalData();
}

function moveEditFormReset(){
	Data.FastMoves = [];
	Data.ChargedMoves = [];
	send_feedback("Connecting to server...", true, 'moveEditForm-feedback');
	fetchMoveData(function(){
		send_feedback("Latest Move Data have been fetched", true, 'moveEditForm-feedback');
		['FastMoves', 'ChargedMoves'].forEach(function(moveDatabaseName){
			for (var i = 0; i < LocalData[moveDatabaseName].length; i++){
				if (getEntry(LocalData[moveDatabaseName].name, Data[moveDatabaseName])){
					LocalData[moveDatabaseName].splice(i--, 1);
				}
			}
		});
		saveLocalData();
	});
}

function moveEditFormDelete(){
	var moveDatabaseName = $('#moveEditForm-moveType').val();
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (removeEntry(moveName, Data[moveDatabaseName]) || removeEntry(moveName, LocalData[moveDatabaseName])){
		send_feedback("Move: " + moveName + " has been removed", false, 'moveEditForm-feedback');
	}
}

function autocompleteMoveEditForm(){
	$( '#moveEditForm-name' ).autocomplete({
		appendTo : '#moveEditForm',
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var matches = [];
			try{
				matches = universalGetter(request.term, Data[$('#moveEditForm-moveType').val()]);
			}catch(err){matches = [];}
			response(matches);
		},
		select : function(event, ui) {
			this.setAttribute('style', 'background-image: url(' + ui.item.icon + ')');
			document.getElementById('moveEditForm-name').value = toTitleCase(ui.item.name);
			document.getElementById('moveEditForm-pokeType').value = ui.item.pokeType;
			document.getElementById('moveEditForm-power').value = ui.item.power;
			document.getElementById('moveEditForm-energyDelta').value = ui.item.energyDelta;
			document.getElementById('moveEditForm-duration').value = ui.item.duration / 1000;
			document.getElementById('moveEditForm-dws').value = ui.item.dws / 1000;
		},
		change : function(event, ui) {
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_move_item;
	
	// document.getElementById('moveEditForm-name' ).onfocus = function(){$(this).autocomplete("search", "");}
	
	document.getElementById('moveEditForm-pokeType').onchange = function(){
		document.getElementById('moveEditForm-name').setAttribute(
			'style', 'background-image: url(https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_'+this.value+'.png)');
	}
}


function pokemonEditFormSubmit(){
	var pokemonName = document.getElementById('pokemonEditForm-name').value.trim().toLowerCase();
	if (pokemonName == '')
		return;
	
	var movepools = {
		'fmoves': [], 'fmoves_legacy': [], 'fmoves_exclusive': [], 
		'cmoves': [], 'cmoves_legacy': [], 'cmoves_exclusive': []
	};
	
	['fmoves', 'cmoves'].forEach(function(mtype){
		var Database = (mtype == 'fmoves' ? Data.FastMoves : Data.ChargedMoves);
		document.getElementById('pokemonEditForm-' + mtype).value.split(',').forEach(function(moveName){
			moveName = moveName.trim().toLowerCase();
			var poolPostFix = '';
			if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
				moveName = moveName.substring(0, moveName.length - 2);
				poolPostFix = '_exclusive';
			}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
				moveName = moveName.substring(0, moveName.length - 1);
				poolPostFix = '_legacy';
			}
			if (moveName[0] == '$'){
				universalGetter(moveName.substring(1, moveName.length), Database).forEach(function(move){
					movepools[mtype + poolPostFix].push(move.name);
				});
			}else if (getEntryIndex(moveName, Database) >= 0){
				movepools[mtype + poolPostFix].push(moveName);
			}
		});
	});
	
	var pkm = {
		name: pokemonName,
		baseAtk: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseAtk').value)),
		baseDef: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseDef').value)),
		baseStm: Math.max(1, parseInt(document.getElementById('pokemonEditForm-baseStm').value)),
		pokeType1: document.getElementById('pokemonEditForm-pokeType1').value.toLowerCase(),
		pokeType2: document.getElementById('pokemonEditForm-pokeType2').value.toLowerCase(),
		fastMoves : movepools.fmoves,
		fastMoves_legacy : movepools.fmoves_legacy,
		fastMoves_exclusive : movepools.fmoves_exclusive,
		chargedMoves : movepools.cmoves,
		chargedMoves_legacy : movepools.cmoves_legacy,
		chargedMoves_exclusive : movepools.cmoves_exclusive
	};
	
	var pkm2 = getEntry(pokemonName, Data.Pokemon);
	if (pkm2){
		copyAllInfo(pkm2, pkm);
		pkm = pkm2;
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been updated.', false, 'pokemonEditForm-feedback');
	}else{
		pkm.dex = 0;
		pkm.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pkm.label = toTitleCase(pokemonName);
		pkm.rating = 0;
		insertEntry(pkm, Data.Pokemon);
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been added.', false, 'pokemonEditForm-feedback');
	}

	insertEntry(pkm, LocalData.Pokemon);
	saveLocalData();
}

function pokemonEditFormReset(){
	Data.Pokemon = [];
	send_feedback("Connecting to server...", true, 'pokemonEditForm-feedback');
	fetchSpeciesData(function(){
		handleSpeciesDatabase(Data.Pokemon);
		manuallyModifyData(Data);
		for (var i = 0; i < LocalData.Pokemon.length; i++){
			if (getEntry(LocalData.Pokemon[i].name, Data.Pokemon)){
				LocalData.Pokemon.splice(i--, 1);
			}
		}
		saveLocalData();
		send_feedback("Latest Pokemon Data have been fetched", true, 'pokemonEditForm-feedback');
	});
}

function pokemonEditFormDelete(){
	var pokemonName = document.getElementById('pokemonEditForm-name').value.trim().toLowerCase();
	
	if (removeEntry(pokemonName, Data.Pokemon) || removeEntry(pokemonName, LocalData.Pokemon)){
		send_feedback("Pokemon: " + pokemonName + " has been removed", false, 'pokemonEditForm-feedback');
	}
}

function autocompletePokemonEditForm(){	
	$( '#pokemonEditForm-name' ).autocomplete({
		appendTo : '#pokemonEditForm',
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var matches = [];
			try{
				matches = universalGetter(request.term, getPokemonSpeciesOptions(-1));
			}catch(err){matches = [];}
			response(matches);
		},
		select : function(event, ui) {
			this.value = ui.item.value;
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: ui.item});
		},
		change : function(event, ui) {
			var pkmInfo = ui.item;		
			if (pkmInfo){
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
				
				this.setAttribute('style', 'background-image: url(' + pkmInfo.icon + ')');
				document.getElementById('pokemonEditForm-name').value = toTitleCase(pkmInfo.name);
				document.getElementById('pokemonEditForm-pokeType1').value = pkmInfo.pokeType1;
				document.getElementById('pokemonEditForm-pokeType2').value = pkmInfo.pokeType2;
				document.getElementById('pokemonEditForm-baseAtk').value = pkmInfo.baseAtk;
				document.getElementById('pokemonEditForm-baseDef').value = pkmInfo.baseDef;
				document.getElementById('pokemonEditForm-baseStm').value = pkmInfo.baseStm;
				document.getElementById('pokemonEditForm-fmoves').value = toTitleCase(fmoves_exp);
				document.getElementById('pokemonEditForm-cmoves').value = toTitleCase(cmoves_exp);
			}
		}
	}).autocomplete( "instance" )._renderItem = manual_render_autocomplete_pokemon_item;
	
	// document.getElementById('pokemonEditForm-name' ).onfocus = function(){$(this).autocomplete("search", "");}
}


function userEditFormAddUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	send_feedback("Connecting to server...", false, 'userEditForm-feedback');
	fetchUserData(userID, function(){
		send_feedback("Imported user " + userID, false, 'userEditForm-feedback');
		udpateUserTable();
	});
}

function userEditFormRemoveUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	var userIdxToRemove = -1;
	for (var i = 0; i < Data.Users.length; i++){
		if (Data.Users[i].id == userID)
			userIdxToRemove = i;
	}
	if (userIdxToRemove >= 0){
		Data.Users.splice(userIdxToRemove, 1);
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
	for (var i = 0; i < Data.Users.length; i++){
		table.children[1].appendChild(createRow([
			i+1,
			Data.Users[i].id,
			Data.Users[i].box.length,
			'<button onclick="udpateBoxTable('+i+')">Manage Box</button>'
		],'td'));
	}
}

function udpateBoxTable(userIndex){
	document.getElementById('boxEditForm-title').innerHTML = 'User ' + Data.Users[userIndex].id;
	var boxEditFormTable = $('#boxEditForm-pokemonTable').DataTable(), box = Data.Users[userIndex].box;
	
	$( "#boxEditForm" ).dialog( "open" );
	boxEditFormTable.clear();
	for (var i = 0; i < box.length; i++){
		boxEditFormTable.row.add([
			i+1,
			createIconLabelDiv2(box[i].icon, toTitleCase(box[i].species), 'species-input-with-icon'),
			createIconLabelDiv2(getTypeIcon({pokeType: box[i].pokeType1}), toTitleCase(box[i].pokeType1), 'move-input-with-icon'),
			createIconLabelDiv2(getTypeIcon({pokeType: box[i].pokeType2}), toTitleCase(box[i].pokeType2), 'move-input-with-icon'),
			box[i].nickname,
			box[i].cp,
			box[i].level,
			box[i].stmiv,
			box[i].atkiv,
			box[i].defiv,
			createIconLabelDiv2(Data.FastMoves[box[i].fmove_index].icon, toTitleCase(box[i].fmove), 'move-input-with-icon'),
			createIconLabelDiv2(Data.ChargedMoves[box[i].cmove_index].icon, toTitleCase(box[i].cmove), 'move-input-with-icon')
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
	relabelAll();
	send_feedback("Box order has been saved", false, 'boxEditForm-feedback');
}


function parameterEditFormSubmit(){
	var EDITABLE_PARAMETERS = {};
	for (var attr in Data.BattleSettings){
		Data.BattleSettings[attr] = parseFloat(document.getElementById('parameterEditForm-'+attr).value) || 0;
	};
	send_feedback("Battle settings have been updated", false, 'parameterEditForm-feedback');
	saveLocalData();
}

function parameterEditFormReset(){
	LocalData.BattleSettings = [];
	saveLocalData();
	send_feedback("Local battle settings have been erased. Refresh the page to get the default back", false, 'parameterEditForm-feedback');
}


function modEditFormSubmit(){
	fetchAll(function(){
		for (var i = 0; i < Data.Mods.length; i++){
			var mod_checkbox = document.getElementById('mod_checkbox_' + i);
			if (mod_checkbox && mod_checkbox.checked){
				Data.Mods[i].effect(Data);
			}
		}
		send_feedback_dialog("Mods have been applied", 'Feedback');
	});
}


function populateQuickStartWizardBossList(tag){
	var bosses = universalGetter('%' + tag, Data.Pokemon);
	var bosses_by_tier = {
		1: [], 2: [], 3:[], 4:[], 5:[]
	};
	bosses.forEach(function(boss){
		bosses_by_tier[parseInt(boss.marker_1.split(' ')[0])].push(boss);
	});

	var listObj = document.getElementById('quickStartWizard-raidbosslist');
	listObj.innerHTML = '';
	for (var t = 1; t <= 5; t++){
		if (bosses_by_tier[t].length){
			var listElement = createElement('li', '<div>Tier ' + t + '</div>');
			var subList = document.createElement('ul');
			bosses_by_tier[t].forEach(function(boss){
				var e = createElement('li', '<div>' + boss.label + '</div>', {index: getEntryIndex(boss.name, Data.Pokemon)});
				const tier = t;
				e.onclick = function(){
					var imgObj = document.getElementById('ui-species_QSW-boss'), idx = this.getAttribute('index');
					imgObj.setAttribute('name', Data.Pokemon[idx].name);
					imgObj.setAttribute('index', idx);
					imgObj.setAttribute('raid_tier', tier);
					imgObj.setAttribute('src', Data.Pokemon[idx].image);
					$( '#quickStartWizard-raidbosslist' ).menu( "collapseAll", null, true );
				};
				subList.appendChild(e);
			});
			listElement.appendChild(subList);
			listObj.appendChild(listElement);
		}
	}
	$( listObj ).menu('refresh');
}

function quickStartWizard_submit(){
	simResults = [];
	var qsw_config = JSON.parse(JSON.stringify(QUICK_START_WIZARD_CONFIG_1));
	var numPlayer = parseInt($('#quickStartWizard-numPlayer').val());
	while (numPlayer > 1){
		qsw_config.atkrSettings.push(JSON.parse(JSON.stringify(QUICK_START_WIZARD_CLONE_PLAYER)));
		numPlayer--;
	}
	var pkmSource = document.getElementById('quickStartWizard-pokemonSource').value;
	if (pkmSource == '$'){
		qsw_config.atkrSettings[0].party_list[0].pokemon_list[0].species = '*$';
	}else{
		qsw_config.atkrSettings[0].party_list[0].pokemon_list[0].species = '*rating3~ & !$';
		qsw_config.atkrSettings[0].party_list[0].pokemon_list[0].level = parseInt(pkmSource);
	}
	
	qsw_config.dfdrSettings.species = document.getElementById('ui-species_QSW-boss').getAttribute('name');
	// qsw_config.dfdrSettings.index = parseInt(document.getElementById('ui-species_QSW-boss').getAttribute('index'));
	qsw_config.dfdrSettings.raid_tier = parseInt(document.getElementById('ui-species_QSW-boss').getAttribute('raid_tier'));
	qsw_config.dfdrSettings.fmove = document.getElementById('fmove_QSW-boss').value || '*current';
	qsw_config.dfdrSettings.cmove = document.getElementById('cmove_QSW-boss').value || '*current';
	
	writeUserInput(qsw_config);
	$( "#quickStartWizard" ).dialog( "close" );
	main({sortBy: qsW_sort});
}

function quickStartWizard_dontshowup(){
	localStorage.setItem('QUICK_START_WIZARD_NO_SHOW', '1');
	LocalData.QuickStartWizardNoShow = 1;
	saveLocalData();
	$( "#quickStartWizard" ).dialog( "close" );
}