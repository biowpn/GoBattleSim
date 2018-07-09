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
						pkm.baseAtk = Math.round(pkm.baseAtk * 0.91);
						pkm.baseDef = Math.round(pkm.baseDef * 0.91);
						pkm.baseStm = Math.round(pkm.baseStm * 0.91);
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


function recalculateIndex(className){
	// When the database has changed in structure (insertion/deletion), call this method
	var elements = document.getElementsByClassName(className || "input-with-icon");
	for (var i = 0; i < elements.length; i++){
		var e = elements[i];
		if (!e.id || !e.getAttribute("index")){
			continue;
		}
		if (e.id.includes("species")){
			e.setAttribute("index", getEntryIndex(e.value.trim().toLowerCase(), Data.Pokemon));
			// TODO: More handling for Box Pokemon
		}else if (e.id.includes("fmove")){
			e.setAttribute("index", getEntryIndex(e.value.trim().toLowerCase(), Data.FastMoves));
		}else if (e.id.includes("cmove")){
			e.setAttribute("index", getEntryIndex(e.value.trim().toLowerCase(), Data.ChargedMoves));
		}
	}
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
		for (var j = 0; j < container.children[1].children.length; j++){
			$( container.children[1].children[j] ).click(function(){
				$(this.parentNode).hide();
			});
		}
		$(container.children[1]).menu();
		$(container.children[1]).hide();
	}
}


function moveEditFormInit(){
	$( "#moveEditForm" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#moveEditFormOpener" ).click(function() {
		$( "#moveEditForm" ).dialog( "open" );
	});
	
	$( '#moveEditForm-name' ).autocomplete({
		appendTo : '#moveEditForm',
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var matches = [];
			try{
				matches = Data[$('#moveEditForm-moveType').val()].filter(Predicate(request.term));
			}catch(err){}
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
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	document.getElementById('moveEditForm-pokeType').onchange = function(){
		document.getElementById('moveEditForm-name').setAttribute(
			'style', 'background-image: url(https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_'+this.value+'.png)');
	}
	
	$( "#moveEditForm" ).on('dialogclose', function(event) {
		sendFeedback('', false, 'moveEditForm-feedback');
	});
}

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
		leftMerge(move2, move);
		move = move2;
		sendFeedback('Move: ' + toTitleCase(moveName) + ' has been updated.', false, 'moveEditForm-feedback');
	}else{
		move.label = toTitleCase(moveName);
		move.icon = "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + move.pokeType + ".png";
		insertEntry(move, Data[moveDatabaseName]);
		recalculateIndex();
		sendFeedback('Move: ' + toTitleCase(moveName) + ' has been added.', false, 'moveEditForm-feedback');
	}
	
	if (getEntryIndex(moveName, LocalData[moveDatabaseName]) < 0){
		insertEntry(move, LocalData[moveDatabaseName]);
	}
	saveLocalData();
}

function moveEditFormReset(){
	Data.FastMoves = [];
	Data.ChargedMoves = [];
	sendFeedback("Connecting to server...", true, 'moveEditForm-feedback');
	fetchMoveData(function(){
		recalculateIndex();
		sendFeedback("Latest Move Data have been fetched", true, 'moveEditForm-feedback');
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
	var moveDatabaseName = $('#moveEditForm-moveType').val();
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (removeEntry(moveName, Data[moveDatabaseName]) && removeEntry(moveName, LocalData[moveDatabaseName])){
		recalculateIndex();
		saveLocalData();
		sendFeedback("Move: " + moveName + " has been removed", false, 'moveEditForm-feedback');
	}
}


function pokemonEditFormInit(){
	$( "#pokemonEditForm" ).dialog({
		autoOpen: false,
		width: 600
	});
	$( "#pokemonEditFormOpener" ).click(function() {
		$( "#pokemonEditForm" ).dialog( "open" );
	});
	
	$( '#pokemonEditForm-name' ).autocomplete({
		appendTo : '#pokemonEditForm',
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var matches = [];
			try{
				matches = getPokemonOptions(-1).filter(Predicate(request.term));
			}catch(err){}
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
	}).autocomplete( "instance" )._renderItem = _renderAutocompletePokemonItem;
	
	$( "#pokemonEditForm" ).on('dialogclose', function(event) {
		sendFeedback('', false, 'pokemonEditForm-feedback');
	});

	var moveEditFormPokeTypeSelect = document.getElementById('moveEditForm-pokeType');
	var pokemonEditFormPokeType1Select = document.getElementById('pokemonEditForm-pokeType1');
	var pokemonEditFormPokeType2Select = document.getElementById('pokemonEditForm-pokeType2');
	for (var type in Data.TypeEffectiveness){
		moveEditFormPokeTypeSelect.appendChild(createElement('option', toTitleCase(type), {value : type}));
		pokemonEditFormPokeType1Select.appendChild(createElement('option', toTitleCase(type), {value : type}));
		pokemonEditFormPokeType2Select.appendChild(createElement('option', toTitleCase(type), {value : type}));
	}
	pokemonEditFormPokeType1Select.appendChild(createElement('option', 'None', {value : 'none'}));
	pokemonEditFormPokeType2Select.appendChild(createElement('option', 'None', {value : 'none'}));
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
				Database.filter(Predicate(moveName.substring(1, moveName.length))).forEach(function(move){
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
		leftMerge(pkm2, pkm);
		pkm = pkm2;
		sendFeedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been updated.', false, 'pokemonEditForm-feedback');
	}else{
		pkm.dex = 0;
		pkm.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pkm.label = toTitleCase(pokemonName);
		pkm.rating = 0;
		insertEntry(pkm, Data.Pokemon);
		recalculateIndex();
		sendFeedback('Pokemon: ' + toTitleCase(pokemonName) + ' has been added.', false, 'pokemonEditForm-feedback');
	}

	insertEntry(pkm, LocalData.Pokemon);
	saveLocalData();
}

function pokemonEditFormReset(){
	Data.Pokemon = [];
	sendFeedback("Connecting to server...", true, 'pokemonEditForm-feedback');
	fetchSpeciesData(function(){
		handleSpeciesDatabase(Data.Pokemon);
		manuallyModifyData(Data);
		recalculateIndex();
		for (var i = 0; i < LocalData.Pokemon.length; i++){
			if (getEntry(LocalData.Pokemon[i].name, Data.Pokemon)){
				LocalData.Pokemon.splice(i--, 1);
			}
		}
		saveLocalData();
		sendFeedback("Latest Pokemon Data have been fetched", true, 'pokemonEditForm-feedback');
	});
}

function pokemonEditFormDelete(){
	var pokemonName = document.getElementById('pokemonEditForm-name').value.trim().toLowerCase();
	
	if (removeEntry(pokemonName, Data.Pokemon) && removeEntry(pokemonName, LocalData.Pokemon)){
		recalculateIndex();
		saveLocalData();
		sendFeedback("Pokemon: " + pokemonName + " has been removed", false, 'pokemonEditForm-feedback');
	}
}


function parameterEditFormInit(){
	$( "#parameterEditForm" ).dialog({ 
		autoOpen: false,
		width: 600,
		maxHeight: 700
	});
	$( "#parameterEditFormOpener" ).click(function() {
		$( "#parameterEditForm" ).dialog( "open" );
	});
	$( "#parameterEditForm" ).on('dialogclose', function(event) {
		sendFeedback('', false, 'parameterEditForm-feedback');
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
	sendFeedback("Battle settings have been updated", false, 'parameterEditForm-feedback');
	saveLocalData();
}

function parameterEditFormReset(){
	LocalData.BattleSettings = [];
	saveLocalData();
	sendFeedback("Local battle settings have been erased. Refresh the page to get the default back", false, 'parameterEditForm-feedback');
}



function userEditFormInit(){
	$( "#userEditForm" ).dialog({ 
		autoOpen: false,
		width: 600
	});
	$( "#userEditFormOpener" ).click(function() {
		udpateUserTable();
		$( "#userEditForm" ).dialog( "open" );
	});
	$( "#userEditForm" ).on('dialogclose', function(event) {
		sendFeedback('', false, 'userEditForm-feedback');
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
	sendFeedback("Connecting to server...", false, 'userEditForm-feedback');
	fetchUserData(userID, function(){
		sendFeedback("Imported user " + userID, false, 'userEditForm-feedback');
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
		sendFeedback("Successfully removed user " + userID, false, 'userEditForm-feedback');
	}else{
		sendFeedback("No user with ID " + userID + " was found", false, 'userEditForm-feedback');
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
		var fmove = getEntry(box[i].fmove, Data.FastMoves), cmove = getEntry(box[i].cmove, Data.ChargedMoves);
		boxEditFormTable.row.add([
			i+1,
			createIconLabelDiv2(box[i].icon, box[i].label, 'species-input-with-icon'),
			createIconLabelDiv2(getTypeIcon({pokeType: box[i].pokeType1}), toTitleCase(box[i].pokeType1), 'move-input-with-icon'),
			createIconLabelDiv2(getTypeIcon({pokeType: box[i].pokeType2}), toTitleCase(box[i].pokeType2), 'move-input-with-icon'),
			box[i].nickname,
			box[i].cp,
			box[i].level,
			box[i].stmiv,
			box[i].atkiv,
			box[i].defiv,
			createIconLabelDiv2(fmove.icon, fmove.label, 'move-input-with-icon'),
			createIconLabelDiv2(cmove.icon, cmove.label, 'move-input-with-icon')
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
	sendFeedback("Box order has been saved", false, 'boxEditForm-feedback');
}


function modEditFormInit(){
	var mod_tbody = document.getElementById('mod_tbody');
	if (mod_tbody){
		mod_tbody.innerHTML = '';
		for (var i = 0; i < Mods.length; i++){
			mod_tbody.appendChild(createRow([
				Mods[i].name,
				"<input type='checkbox' id='mod_checkbox_" + i + "'>"
			]));
		}
	}
			
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



function QuickStartWizardInit(){
	$('#quickStartWizardOpener').click(function() {
		$( "#quickStartWizard" ).dialog( "open" );
	});

	$("#quickStartWizard").dialog({ 
		autoOpen: false,
		width: 600,
		height: 700,
		buttons: [{
			text: 'GO',
			style: 'width: 40%; float: left;',
			click: quickStartWizard_submit
			
		},{
			text: "Don't show Up Again",
			style: 'width: 40%; float: right;',
			click: quickStartWizard_dontshowup
		}]
	});

	$( '#quickStartWizard-pokemonSource' ).selectmenu({appendTo: '#quickStartWizard'});
	$( '#quickStartWizard-raidbosstags' ).controlgroup();
	$( '#quickStartWizard-moves' ).controlgroup();
	$( '#quickStartWizard-sortBy' ).controlgroup();
	$('#quickStartWizard-movesTable').hide();
	$ ('#quickStartWizard-raidbosslist').menu();

	autocompletePokemonNodeMoves(document.getElementById('fmove_QSW-boss'));
	autocompletePokemonNodeMoves(document.getElementById('cmove_QSW-boss'));
	$('#fmove_QSW-boss').autocomplete( "option", "appendTo", "#quickStartWizard" );
	$('#cmove_QSW-boss').autocomplete( "option", "appendTo", "#quickStartWizard" );
}

function quickStartWizard_moves(value){
	if (value == 'spec'){
		document.getElementById('tabs-3').setAttribute('style', 'width: 100%; height: 200px');
		$('#quickStartWizard-movesTable').show();
	}else{
		document.getElementById('tabs-3').setAttribute('style', 'width: 100%; height: 100px');
		$('#quickStartWizard-movesTable').hide();
		if (value == 'avrg'){
			document.getElementById('fmove_QSW-boss').value = '?current';
			document.getElementById('cmove_QSW-boss').value = '?current';
		}else{
			document.getElementById('fmove_QSW-boss').value = '*current';
			document.getElementById('cmove_QSW-boss').value = '*current';
		}
	}
}

function populateQuickStartWizardBossList(tag){
	var bosses = Data.Pokemon.filter(Predicate('%' + tag));
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



function breakpointCalculatorInit(){
	$( "#breakpointCalculator" ).dialog({ 
		autoOpen: false,
		width: 800
	});
	$( "#breakpointCalculatorOpener" ).click(function() {
		$( "#breakpointCalculator" ).dialog( "open" );
	});
	var breakpointCalculatorTable = $( "#breakpointCalculator-output" ).DataTable({
		lengthChange: false
	});
	$("#breakpointCalculator-output_filter").hide();

	autocompletePokemonNodeSpecies(document.getElementById('ui-species_0'));
	autocompletePokemonNodeSpecies(document.getElementById('ui-species_boss'));

	var bpc_defaultAtkIv = document.getElementById('breakpointCalculator-atkiv');
	for (var i = 0; i < 16; i++){
		bpc_defaultAtkIv.appendChild(createElement('option', i, {value: i}));
	}
	bpc_defaultAtkIv.value = 15;

	var bpc_weather = document.getElementById('breakpointCalculator-weather');
	Data.WeatherSettings.forEach(function(weatherSetting){
		bpc_weather.appendChild(createElement('option', weatherSetting.label, {value: weatherSetting.name}));
	});
	var bpc_friend = document.getElementById('breakpointCalculator-friend');
	Data.FriendSettings.forEach(function(friendSetting){
		bpc_friend.appendChild(createElement('option', friendSetting.label, {value: friendSetting.name}));
	});
	var bpc_raidTier = document.getElementById('breakpointCalculator-raidTier');
	Data.RaidTierSettings.forEach(function(tierSetting){
		bpc_raidTier.appendChild(createElement('option', tierSetting.label, {value: tierSetting.name}));
	});
	bpc_raidTier.value = 5;
}

function breakpointCalculatorSubmit(){
	var attackers = getPokemonOptions(0).filter(Predicate($("#ui-species_0").val()));
	var defenders = Data.Pokemon.filter(Predicate($("#ui-species_boss").val()));
	var weather = $("#breakpointCalculator-weather").val();
	var friend = $("#breakpointCalculator-friend").val();
	var raidTier = $("#breakpointCalculator-raidTier").val();
	
	breakpointCalculatorTable.clear();
	
	for (var i = 0; i < attackers.length; i++){

		var atkrs = [];
		var atkr_copy = JSON.parse(JSON.stringify(attackers[i]));
		if (atkr_copy.box_index < 0){
			var atkiv_default = parseInt($('#breakpointCalculator-atkiv').val());
			atkr_copy.fastMoves.concat(atkr_copy.fastMoves_legacy).concat(atkr_copy.fastMoves_exclusive).forEach(function(move){
				atkrs.push(new Pokemon({
					species: atkr_copy,
					level: 40,
					atkiv: atkiv_default,
					defiv: 15,
					stmiv: 15,
					fmove: move
				}));
			});
		}else{
			atkrs.push(new Pokemon(atkr_copy));
		}

		
		for (var j = 0; j < atkrs.length; j++){
			var atkr = atkrs[j];
			atkr.fab = getFriendMultiplier(friend);
		
			for (var k = 0; k < defenders.length; k++){
				var dfdr = new Pokemon({
					name: defenders[k].name,
					raid_tier: raidTier
				});
				var bp_res = calculateBreakpoints(atkr, dfdr, atkr.fmove, weather);
				var powerup_cost = calculateLevelUpCost(atkr.level, bp_res.breakpoints[0]);
				breakpointCalculatorTable.row.add([
					createIconLabelDiv2(atkr.icon, atkr.nickname || atkr.label, 'species-input-with-icon'),
					createIconLabelDiv2(atkr.fmove.icon, atkr.fmove.label, 'move-input-with-icon'),
					createIconLabelDiv2(dfdr.icon, dfdr.label, 'species-input-with-icon'),
					bp_res.finalDamage,
					bp_res.breakpoints.slice(0, 3).join(", "),
					powerup_cost.stardust,
					powerup_cost.candy
				]);
			}
		}
	}
	
	$.fn.dataTable.ext.search.push(function( settings, searchData, index, rowData, counter ) {return true;});
	breakpointCalculatorTable.draw();
	$.fn.dataTable.ext.search.pop();
	
	addFilterToFooter(breakpointCalculatorTable);
}