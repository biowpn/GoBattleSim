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
	
	$( '#moveEditForm-name' ).autocomplete({
		appendTo : '#moveEditForm',
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var matches = [];
			try{
				matches = Data[$('#moveEditForm-moveType').val() + "Moves"].filter(Predicate(request.term));
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
	var movePrefix = document.getElementById('moveEditForm-moveType').value;
	var moveDatabaseName = movePrefix + "Moves";
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (moveName == '')
		return;
	
	var move = {
		name: moveName,
		moveType: movePrefix.toLowerCase(),
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
	var movePrefix = $('#moveEditForm-moveType').val();
	var moveDatabaseName = movePrefix + "Moves";
	var moveName = document.getElementById('moveEditForm-name').value.trim().toLowerCase();
	
	if (removeEntry(moveName, Data[moveDatabaseName]) && removeEntry(moveName, LocalData[moveDatabaseName])){
		saveLocalData();
		sendFeedback("Move: " + moveName + " has been removed", false, 'moveEditForm-feedback');
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
		saveLocalData();
		sendFeedback("Pokemon: " + pokemonName + " has been removed", false, 'pokemonEditForm-feedback');
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
	sendFeedbackDialog("Battle settings have been updated", false, 'parameterEditForm-feedback');
}

function parameterEditFormReset(){
	LocalData.BattleSettings = {};
	Data.BattleSettings = JSON.parse(JSON.stringify(DefaultData.BattleSettings));
	saveLocalData();
	sendFeedbackDialog("Battle settings have been reset.", false, 'parameterEditForm-feedback');
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



function QuickStartWizardInit(){
	$('#quickStartWizardOpener').click(function() {
		$( "#quickStartWizard" ).dialog( "open" );
	});
	$( "#quickStartWizard" ).attr("style", "visibility: show;");
	$( "#quickStartWizard" ).dialog({ 
		autoOpen: false,
		width: 600,
		height: 700,
		buttons: [{
			text: 'GO',
			style: 'width: 40%; float: left;',
			click: quickStartWizardSubmit
			
		},{
			text: "Don't show Up Again",
			style: 'width: 40%; float: right;',
			click: quickStartWizardNoShowUp
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

function quickStartWizardSetMoves(value){
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
		bosses_by_tier[parseInt(boss.raidMarker.split(' ')[0])].push(boss);
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
					imgObj.setAttribute('raidTier', tier);
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

function quickStartWizardSubmit(){
	simResults = [];
	var qsw_config = JSON.parse(JSON.stringify(QUICK_START_WIZARD_CONFIG_1));
	var numPlayer = parseInt($('#quickStartWizard-numPlayer').val());
	while (numPlayer > 1){
		qsw_config.atkrSettings.push(JSON.parse(JSON.stringify(QUICK_START_WIZARD_CLONE_PLAYER)));
		numPlayer--;
	}
	var pkmSource = document.getElementById('quickStartWizard-pokemonSource').value;
	var pkm = qsw_config.atkrSettings[0].parties[0].pokemon[0];
	if (pkmSource == '$'){
		pkm.name = "*$";
		pkm.fmove = "";
		pkm.cmove = "";
		pkm.level = "";
		pkm.atkiv = "";
		pkm.defiv = "";
		pkm.stmiv = "";
	}else{
		pkm.name = "*rating3~5 & !$";
		pkm.level = parseInt(pkmSource);
	}
	
	qsw_config.dfdrSettings.name = document.getElementById('ui-species_QSW-boss').getAttribute('name');
	qsw_config.dfdrSettings.raidTier = parseInt(document.getElementById('ui-species_QSW-boss').getAttribute('raidTier'));
	qsw_config.dfdrSettings.fmove = document.getElementById('fmove_QSW-boss').value || '*current';
	qsw_config.dfdrSettings.cmove = document.getElementById('cmove_QSW-boss').value || '*current';
	
	write(document.getElementById("input"), qsw_config);
	$( "#quickStartWizard" ).dialog( "close" );
	requestSimulation({sortBy: qsW_sort});
}

function quickStartWizardNoShowUp(){
	localStorage.setItem('QUICK_START_WIZARD_NO_SHOW', '1');
	LocalData.QuickStartWizardNoShow = 1;
	saveLocalData();
	$( "#quickStartWizard" ).dialog( "close" );
}



function breakpointCalculatorInit(){
	$( "#breakpointCalculator" ).attr("style", "visibility: show;");
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

function calculateBreakpoints(dmgGiver, dmgReceiver, move, weather){
	let breakpoints = [], lastDamage = 0, thisDamage = 0;
	let atkr = new Pokemon(dmgGiver);
	for (var i = 0; i < Data.LevelSettings.length; i++){
		atkr.Atk = (atkr.baseAtk + atkr.atkiv) * Data.LevelSettings[i].cpm;
		thisDamage = damage(atkr, dmgReceiver, move, weather);
		if (thisDamage != lastDamage){
			breakpoints.unshift(Data.LevelSettings[i].value);
			lastDamage = thisDamage;
		}
	}
	return {
		"breakpoints": breakpoints,
		"finalDamage": thisDamage
	};
}

function breakpointCalculatorSubmit(){
	var attackers = getPokemonOptions(0).filter(Predicate($("#ui-species_0").val()));
	var defenders = Data.Pokemon.filter(Predicate($("#ui-species_boss").val()));
	var weather = $("#breakpointCalculator-weather").val();
	var friend = $("#breakpointCalculator-friend").val();
	var raidTier = $("#breakpointCalculator-raidTier").val();
	
	var breakpointCalculatorTable = $( "#breakpointCalculator-output" ).DataTable();
	breakpointCalculatorTable.clear();
	
	for (var i = 0; i < attackers.length; i++){
		var atkrs = [];
		var atkr_copy = JSON.parse(JSON.stringify(attackers[i]));
		if (atkr_copy.box_index >= 0){
			atkrs.push(new Pokemon(atkr_copy));			
		}else{
			atkr_copy.level = 40;
			atkr_copy.atkiv = parseInt($('#breakpointCalculator-atkiv').val());
			atkr_copy.defiv = 15;
			atkr_copy.stmiv = 15;
			for (let move of atkr_copy.fastMoves.concat(atkr_copy.fastMoves_legacy).concat(atkr_copy.fastMoves_exclusive)){
				atkr_copy.fmove = move;
				atkrs.push(new Pokemon(atkr_copy));
			}
		}
		for (var j = 0; j < atkrs.length; j++){
			var atkr = atkrs[j];
			atkr.fab = getFriendMultiplier(friend);
			for (var k = 0; k < defenders.length; k++){
				var dfdr = new Pokemon({
					name: defenders[k].name,
					raidTier: raidTier
				});
				var bp_res = calculateBreakpoints(atkr, dfdr, atkr.fmove, weather);
				var powerup_cost = calculateLevelUpCost(atkr.level, bp_res.breakpoints[0]);
				breakpointCalculatorTable.row.add([
					createIconLabelSpan(atkr.icon, atkr.nickname || atkr.label, 'species-input-with-icon'),
					createIconLabelSpan(atkr.fmove.icon, atkr.fmove.label, 'move-input-with-icon'),
					createIconLabelSpan(dfdr.icon, dfdr.label, 'species-input-with-icon'),
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
		}catch(err){
			sendFeedbackDialog("Oops, something went wrong! Make sure all input are valid. If the error persists, better call bio");
		}
		while (DialogStack.length){
			DialogStack.pop().dialog('close');
		}
	}, 100);
}

function MVLTableCalculate(){
	var baseConfig = read();
	var basePlayer = baseConfig.atkrSettings[0];
	var numPlayer = parseInt($("#MVLTable-numPlayer").val());
	if (!(numPlayer > 0)){
		sendFeedbackDialog("How many players we're talking about?");
		return;
	}
	baseConfig.atkrSettings = [];
	for (var i = 0; i < numPlayer; i++){
		baseConfig.atkrSettings.push(basePlayer);
	}
	baseConfig.aggregation = 'avrg';
	
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