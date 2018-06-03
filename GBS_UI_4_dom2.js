/* GBS_UI_4_dom2.js */

const editableParameters = [
	'BATTLE_SETTINGS.maximumEnergy','BATTLE_SETTINGS.sameTypeAttackBonusMultiplier','BATTLE_SETTINGS.weatherAttackBonusMultiplier','BATTLE_SETTINGS.dodgeDurationMs','BATTLE_SETTINGS.dodgeWindowMs','BATTLE_SETTINGS.dodgeSwipeMs',
	'BATTLE_SETTINGS.dodgeDamageReductionPercent','BATTLE_SETTINGS.arenaEntryLagMs','BATTLE_SETTINGS.arenaEarlyTerminationMs','BATTLE_SETTINGS.fastMoveLagMs',
	'BATTLE_SETTINGS.chargedMoveLagMs','BATTLE_SETTINGS.swapDurationMs','BATTLE_SETTINGS.rejoinDurationMs','BATTLE_SETTINGS.itemMenuAnimationTimeMs','BATTLE_SETTINGS.maxReviveTimePerPokemonMs'
];



function moveEditFormSubmit(){
	var moveType_input = document.getElementById('moveEditForm-moveType').value;
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (moveName == '')
		return;
	
	var move = {
		name: moveName,
		moveType: moveType_input,
		power: parseInt(document.getElementById('moveEditForm-power').value),
		pokeType: document.getElementById('moveEditForm-pokeType').value.toLowerCase(),
		energyDelta: (moveType_input == 'f' ? 1 : -1) * Math.abs(parseInt(document.getElementById('moveEditForm-energyDelta').value)),
		dws: Math.abs(parseFloat(document.getElementById('moveEditForm-dws').value)) * 1000,
		duration: Math.abs(parseFloat(document.getElementById('moveEditForm-duration').value)) * 1000
	};
	
	var moveDatabase = (moveType_input == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	var moveDatabase_local = (moveType_input == 'f' ? FAST_MOVE_DATA_LOCAL : CHARGED_MOVE_DATA_LOCAL);
	var idx = getIndexByName(moveName, moveDatabase);
	
	if (idx >= 0){
		copyAllInfo(moveDatabase[idx], move);
		move = moveDatabase[idx];
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been updated.', false, 'moveEditForm-feedback');
	}else{
		move.label = toTitleCase(moveName);
		move.icon = "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + move.pokeType + ".png";
		move.index = moveDatabase.length;
		moveDatabase.push(move);
		send_feedback('Move: ' + toTitleCase(moveName) + ' has been added.', false, 'moveEditForm-feedback');
	}
	
	if (getIndexByName(moveName, moveDatabase_local) < 0){
		moveDatabase_local.push(move);
	}
	if (localStorage){
		localStorage.FAST_MOVE_DATA_LOCAL = JSON.stringify(FAST_MOVE_DATA_LOCAL);
		localStorage.CHARGED_MOVE_DATA_LOCAL = JSON.stringify(CHARGED_MOVE_DATA_LOCAL);
	}
}

function moveEditFormReset(){
	FAST_MOVE_DATA = [];
	CHARGED_MOVE_DATA = [];
	send_feedback("Connecting to server...", true, 'moveEditForm-feedback');
	fetchMoveData(function(){
		send_feedback("Latest Move Data have been fetched", true, 'moveEditForm-feedback');
		for (var i = 0; i < FAST_MOVE_DATA_LOCAL.length; i++){
			if (getIndexByName(FAST_MOVE_DATA_LOCAL[i].name, FAST_MOVE_DATA) >= 0){
				FAST_MOVE_DATA_LOCAL.splice(i--, 1);
			}else{
				FAST_MOVE_DATA_LOCAL[i].index = FAST_MOVE_DATA.length;
				FAST_MOVE_DATA.push(FAST_MOVE_DATA_LOCAL[i]);
			}
		}
		for (var i = 0; i < CHARGED_MOVE_DATA_LOCAL.length; i++){
			if (getIndexByName(CHARGED_MOVE_DATA_LOCAL[i].name, CHARGED_MOVE_DATA) >= 0){
				CHARGED_MOVE_DATA_LOCAL.splice(i--, 1);
			}else{
				CHARGED_MOVE_DATA_LOCAL[i].index = CHARGED_MOVE_DATA.length;
				CHARGED_MOVE_DATA.push(CHARGED_MOVE_DATA_LOCAL[i]);
			}
		}
		if (localStorage){
			localStorage.FAST_MOVE_DATA_LOCAL = JSON.stringify(FAST_MOVE_DATA_LOCAL);
			localStorage.CHARGED_MOVE_DATA_LOCAL = JSON.stringify(CHARGED_MOVE_DATA_LOCAL);
		}
	});
}

function moveEditFormDelete(){
	var moveType_input = document.getElementById('moveEditForm-moveType').value;
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	var moveDatabase = (moveType_input == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	var moveDatabaseLocal = (moveType_input == 'f' ? FAST_MOVE_DATA_LOCAL : CHARGED_MOVE_DATA_LOCAL);
	var idx = getIndexByName(moveName, moveDatabase);
	
	if (idx >= 0){
		moveDatabase.splice(idx, 1);
		for (var i = idx; i < moveDatabase.length; i++){
			moveDatabase[i].index = i;
		}
		for (var i = 0; i < moveDatabaseLocal.length; i++){
			if (moveDatabaseLocal[i].name == moveName)
				moveDatabaseLocal.splice(i--, 1);
		}
		if (localStorage){
			localStorage.FAST_MOVE_DATA_LOCAL = JSON.stringify(FAST_MOVE_DATA_LOCAL);
			localStorage.CHARGED_MOVE_DATA_LOCAL = JSON.stringify(CHARGED_MOVE_DATA_LOCAL);
		}
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
				matches = universalGetter(request.term, ($('#moveEditForm-moveType').val() == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA));
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
	
	var fmoves = [], fmoves_legacy = [], fmoves_exclusive = [], cmoves = [], cmoves_legacy = [], cmoves_exclusive = [];
	document.getElementById('pokemonEditForm-fmoves').value.split(',').forEach(function(moveName){
		moveName = moveName.trim().toLowerCase();
		if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
			if (getIndexByName(moveName.substring(0, moveName.length - 2), FAST_MOVE_DATA) >= 0)
				fmoves_exclusive.push(moveName.substring(0,moveName.length - 2));
		}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
			if (getIndexByName(moveName.substring(0, moveName.length - 1), FAST_MOVE_DATA) >= 0)
				fmoves_legacy.push(moveName.substring(0,moveName.length - 1));
		}else{
			if (getIndexByName(moveName, FAST_MOVE_DATA) >= 0)
				fmoves.push(moveName);
		}
	});
	document.getElementById('pokemonEditForm-cmoves').value.split(',').forEach(function(moveName){
		moveName = moveName.trim().toLowerCase();
		if (moveName.substring(moveName.length - 2, moveName.length) == '**'){
			if (getIndexByName(moveName.substring(0, moveName.length - 2), CHARGED_MOVE_DATA) >= 0)
				cmoves_exclusive.push(moveName.substring(0,moveName.length - 2));
		}else if (moveName.substring(moveName.length - 1, moveName.length) == '*'){
			if (getIndexByName(moveName.substring(0, moveName.length - 1), CHARGED_MOVE_DATA) >= 0)
				cmoves_legacy.push(moveName.substring(0,moveName.length - 1));
		}else{
			if (getIndexByName(moveName, CHARGED_MOVE_DATA) >= 0)
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
	
	var idx = getIndexByName(pokemonName, POKEMON_SPECIES_DATA);
	if (idx >= 0){
		copyAllInfo(POKEMON_SPECIES_DATA[idx], pkm);
		pkm = POKEMON_SPECIES_DATA[idx];
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been updated.', false, 'pokemonEditForm-feedback');
	}else{
		pkm.dex = 0;
		pkm.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pkm.label = toTitleCase(pokemonName);
		pkm.rating = 0;
		pkm.index = POKEMON_SPECIES_DATA.length;
		POKEMON_SPECIES_DATA.push(pkm);
		send_feedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been added.', false, 'pokemonEditForm-feedback');
	}
	
	if (getIndexByName(pokemonName, POKEMON_SPECIES_DATA_LOCAL) < 0){
		POKEMON_SPECIES_DATA_LOCAL.push(pkm);
	}
	if (localStorage){
		localStorage.POKEMON_SPECIES_DATA_LOCAL = JSON.stringify(POKEMON_SPECIES_DATA_LOCAL);
	}
}

function pokemonEditFormReset(){
	POKEMON_SPECIES_DATA = [];
	if (localStorage){
		localStorage.removeItem('POKEMON_SPECIES_DATA_LOCAL');
	}
	send_feedback("Local Pokemon Species have been erased.", false, 'pokemonEditForm-feedback');
	send_feedback("Connecting to server...", true, 'pokemonEditForm-feedback');
	fetchSpeciesData(function(){
		handleSpeciesDatabase(POKEMON_SPECIES_DATA);
		manuallyModifyData();
		for (var i = 0; i < POKEMON_SPECIES_DATA_LOCAL.length; i++){
			if (getIndexByName(POKEMON_SPECIES_DATA_LOCAL[i].name, POKEMON_SPECIES_DATA) >= 0){
				POKEMON_SPECIES_DATA_LOCAL.splice(i--, 1);
			}else{
				POKEMON_SPECIES_DATA_LOCAL[i].index = POKEMON_SPECIES_DATA.length;
				POKEMON_SPECIES_DATA.push(POKEMON_SPECIES_DATA_LOCAL[i]);
			}
		}
		if (localStorage){
			localStorage.POKEMON_SPECIES_DATA_LOCAL = JSON.stringify(POKEMON_SPECIES_DATA_LOCAL);
		}
		send_feedback("Latest Pokemon Data have been fetched", true, 'pokemonEditForm-feedback');
	});
}

function pokemonEditFormDelete(){
	var pokemonName = document.getElementById('pokemonEditForm-name').value.trim().toLowerCase();
	var idx = getIndexByName(pokemonName, POKEMON_SPECIES_DATA);
	
	if (idx >= 0){
		POKEMON_SPECIES_DATA.splice(idx, 1);
		for (var i = idx; i < POKEMON_SPECIES_DATA.length; i++){
			POKEMON_SPECIES_DATA[i].index = i;
		}
		for (var i = 0; i < POKEMON_SPECIES_DATA_LOCAL.length; i++){
			if (POKEMON_SPECIES_DATA_LOCAL[i].name == pokemonName)
				POKEMON_SPECIES_DATA_LOCAL.splice(i--, 1);
		}
		if (localStorage){
			localStorage.POKEMON_SPECIES_DATA_LOCAL = JSON.stringify(POKEMON_SPECIES_DATA_LOCAL);
		}
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
		table.children[1].appendChild(createRow([
			i+1,
			USERS_INFO[i].id,
			USERS_INFO[i].box.length,
			'<button onclick="udpateBoxTable('+i+')">Manage Box</button>'
		],'td'));
	}
}

function udpateBoxTable(userIndex){
	document.getElementById('boxEditForm-title').innerHTML = 'User ' + USERS_INFO[userIndex].id;
	var boxEditFormTable = $('#boxEditForm-pokemonTable').DataTable(), box = USERS_INFO[userIndex].box;
	
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
			createIconLabelDiv2(FAST_MOVE_DATA[box[i].fmove_index].icon, toTitleCase(box[i].fmove), 'move-input-with-icon'),
			createIconLabelDiv2(CHARGED_MOVE_DATA[box[i].cmove_index].icon, toTitleCase(box[i].cmove), 'move-input-with-icon')
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
		newBox[i] = USERS_INFO[userIndex].box[parseInt(data[i][0]) - 1];
	}
	USERS_INFO[userIndex].box = newBox;
	relabelAll();
	send_feedback("Box order has been saved", false, 'boxEditForm-feedback');
}


function parameterEditFormSubmit(){
	var EDITABLE_PARAMETERS = {};
	for (var attr in BATTLE_SETTINGS){
		BATTLE_SETTINGS[attr] = parseFloat(document.getElementById('parameterEditForm-'+attr).value) || 0;
	};
	send_feedback("Battle settings have been updated", false, 'parameterEditForm-feedback');
	if (localStorage){
		localStorage.BATTLE_SETTINGS_LOCAL = JSON.stringify(BATTLE_SETTINGS);
	}
}

function parameterEditFormReset(){
	if (localStorage){
		localStorage.removeItem('BATTLE_SETTINGS_LOCAL');
	}
	send_feedback("Local battle settings have been erased. Refresh the page to get the default back", false, 'parameterEditForm-feedback');
}


function modEditFormSubmit(){
	fetchAll(function(){
		for (var i = 0; i < MOD_LIST.length; i++){
			var mod_checkbox = document.getElementById('mod_checkbox_' + i);
			if (mod_checkbox && mod_checkbox.checked){
				MOD_LIST[i].effect();
			}
		}
		send_feedback_dialog("Mods have been applied", 'Feedback');
	});
}


function populateQuickStartWizardBossList(tag){
	var bosses = universalGetter('%' + tag, POKEMON_SPECIES_DATA);
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
				var e = createElement('li', '<div>' + boss.label + '</div>', {index: boss.index});
				const tier = t;
				e.onclick = function(){
					var imgObj = document.getElementById('ui-species_QSW-boss'), idx = this.getAttribute('index');
					imgObj.setAttribute('name', POKEMON_SPECIES_DATA[idx].name);
					imgObj.setAttribute('index', idx);
					imgObj.setAttribute('raid_tier', tier);
					imgObj.setAttribute('src', POKEMON_SPECIES_DATA[idx].image);
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
	qsw_config.dfdrSettings.index = parseInt(document.getElementById('ui-species_QSW-boss').getAttribute('index'));
	qsw_config.dfdrSettings.raid_tier = parseInt(document.getElementById('ui-species_QSW-boss').getAttribute('raid_tier'));
	qsw_config.dfdrSettings.fmove = document.getElementById('fmove_QSW-boss').value || '*current';
	qsw_config.dfdrSettings.cmove = document.getElementById('cmove_QSW-boss').value || '*current';
	
	writeUserInput(qsw_config);
	$( "#quickStartWizard" ).dialog( "close" );
	main({sortBy: qsW_sort});
}

function quickStartWizard_dontshowup(){
	localStorage.setItem('QUICK_START_WIZARD_NO_SHOW', '1');
	$( "#quickStartWizard" ).dialog( "close" );
}