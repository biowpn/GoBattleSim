/**
	@file Extension tools
*/

/*
	Module interface functions
*/


/*
	Non-interface members
*/
var sampleConfigurations = [{"players":[{"team":"0","friend":"none","parties":[{"name":"","pokemon":[{"name":"Machamp","role":"a","copies":6,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Counter","cmove":"Dynamic Punch","strategy":"strat1"}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Blissey","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Zen Headbutt","cmove":"Dazzling Gleam","strategy":"strat0"},{"name":"Chansey","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Zen Headbutt","cmove":"Dazzling Gleam","strategy":"strat0"},{"name":"Snorlax","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Zen Headbutt","cmove":"Body Slam","strategy":"strat0"},{"name":"Tyranitar","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Smack Down","cmove":"Stone Edge","strategy":"strat0"},{"name":"Lapras","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Frost Breath","cmove":"Ice Beam","strategy":"strat0"},{"name":"Milotic","role":"gd","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Waterfall","cmove":"Surf","strategy":"strat0"}],"revive":false}]}],"battleMode":"gym","timelimit":100000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":1,"aggregation":"enum"},{"players":[{"team":"0","friend":"none","parties":[{"name":"","pokemon":[{"name":"Moltres","role":"a","copies":6,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Fire Spin","cmove":"Sky Attack","strategy":"strat1"}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Machamp","role":"rb","copies":1,"raidTier":"3","fmove":"Bullet Punch","cmove":"Heavy Slam","strategy":"strat0"}],"revive":false}]}],"battleMode":"raid","timelimit":180000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":1,"aggregation":"enum"},{"players":[{"team":"0","friend":"ultra","parties":[{"name":"","pokemon":[{"name":"Tyranitar","role":"a","copies":6,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Smack Down","cmove":"Stone Edge","strategy":"strat1"}],"revive":true}]},{"team":"0","friend":"ultra","parties":[{"name":"","pokemon":[{"name":"Tyranitar","role":"a","copies":6,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Smack Down","cmove":"Stone Edge","strategy":"strat1"}],"revive":true}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Ho-oh","role":"rb","copies":1,"raidTier":"5","fmove":"Steel Wing","cmove":"Solar Beam","strategy":"strat0"}],"revive":false}]}],"battleMode":"raid","timelimit":300000,"weather":"PARTLY_CLOUDY","dodgeBugActive":"0","simPerConfig":100,"aggregation":"avrg"},{"players":[{"team":"0","friend":"none","parties":[{"name":"","pokemon":[{"name":"Latios","role":"a","copies":1,"level":40,"atkiv":15,"defiv":15,"stmiv":15,"fmove":"Dragon Breath","cmove":"Dragon Claw","cmove2":"Solar Beam","strategy2":""}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Latias","role":"a","copies":1,"level":40,"atkiv":15,"defiv":15,"stmiv":15,"fmove":"Dragon Breath","cmove":"Outrage","cmove2":"Thunder","strategy2":""}],"revive":false}]}],"battleMode":"pvp","timelimit":240000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":1,"aggregation":"enum"},{"players":[{"team":"0","friend":"ultra","parties":[{"name":"","pokemon":[{"name":"*$","role":"a","copies":6,"level":"","stmiv":"","atkiv":"","defiv":"","fmove":"","cmove":"","strategy":"strat1"}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Mewtwo","role":"rb","copies":1,"raidTier":"6","fmove":"?current","cmove":"?current","strategy":"strat0"}],"revive":false}]}],"battleMode":"raid","timelimit":300000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":20,"aggregation":"avrg"},{"players":[{"team":"0","friend":"ultra","parties":[{"name":"","pokemon":[{"name":"Machamp","role":"a","copies":6,"level":"*30-40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Counter","cmove":"Dynamic Punch","strategy":"strat1"}],"revive":false}]},{"team":"0","friend":"ultra","parties":[{"name":"","pokemon":[{"name":"Machamp","role":"a","copies":6,"level":"=1-1-1","stmiv":"15","atkiv":"15","defiv":"15","fmove":"Counter","cmove":"Dynamic Punch","strategy":"strat1"}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Tyranitar","role":"rb","copies":1,"raidTier":"4","fmove":"Bite","cmove":"Crunch","strategy":"strat0"}],"revive":false}]}],"battleMode":"raid","timelimit":180000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":200,"aggregation":"avrg"},{"players":[{"team":"0","friend":"none","parties":[{"name":"","pokemon":[{"name":"!evolve & !$","role":"a","copies":1,"level":"40","stmiv":"15","atkiv":"15","defiv":"15","fmove":"*fire & (current, legacy, exclusive)","cmove":"*fire & (current, legacy, exclusive)","strategy":"strat1"}],"revive":false}]},{"team":"1","friend":"none","parties":[{"name":"","pokemon":[{"name":"Chansey","role":"rb","copies":1,"raidTier":"5","fmove":"Zen Headbutt","cmove":"Dazzling Gleam","strategy":"strat0"}],"revive":false}]}],"battleMode":"raid","timelimit":300000,"weather":"EXTREME","dodgeBugActive":"0","simPerConfig":100,"aggregation":"avrg"}];



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
	UI.write(sampleConfigurations[configIndex] || {});
	UI.refresh();
	$( "#WelcomeDialog" ).dialog( "close" );
	if (!advanced){
		document.getElementById('GoButton').scrollIntoView({block: "center", inline: "center"});
		UI.sendFeedbackDialog('Nice choice! Now, review the configuration and click "GO" to start the simulation.');
	}
}


function welcomeDialogRespond(resp){
	if (resp == 1){
		LocalData.WelcomeDialogNoShow = 1;
		GM.save();
	}
	$( "#WelcomeDialog" ).dialog( "close" );
}


function dropdownMenuInit(){
	$( "#menu" ).attr("style", "visibility: show;");
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
	
	var movePokeTypeInput = $(moveInput).find("[name=move-pokeType]")[0];
	movePokeTypeInput.innerHTML = "";
	
	var Effectiveness = GM.get("battle", "TypeEffectiveness");
	for (var type in Effectiveness){
		movePokeTypeInput.appendChild(createElement("option", toTitleCase(type), {value: type}));
	}
	
	$(moveInput).find("[name=move-name]").autocomplete({
		appendTo: '#moveEditForm',
		minLength: 0,
		delay: 0,
		source: function(request, response){
			var matches = GM.select($(moveInput).find("[name=move-moveType]").val(), request.term);
			response(matches);
		},
		select: function(event, ui){
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: ui.item});
		},
		change: function(event, ui){
			var move = ui.item || GM.get($(moveInput).find("[name=move-moveType]").val(), this.value.trim().toLowerCase());
			if (move){
				var scope = $(moveInput).find("[name=move-scope]").val();
				for (var a in move[scope]) {
					move[a] = move[scope][a];
				}
				this.setAttribute('style', 'background-image: url(' + move.icon + ')');
				UI.write(move, moveInput);
				this.value = toTitleCase(this.value);
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	$(moveInput).find("[name=move-pokeType]").change(function(){
		$(moveInput).find("[name=move-name]").attr("style", "background-image: url(" + getTypeIcon(this.value) + ")");
	});
	
	$(moveInput).find("[name=move-scope]").change(function(){
		$(moveInput).find("[name=move-name]").data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: null});
	});
}


function moveEditFormSubmit(){
	var moveInput = document.getElementById("moveEditForm-table");
	var move = UI.read(moveInput);
	move.name = move.name.trim().toLowerCase();
	move.icon = getTypeIcon(move.pokeType);
	if (move.effect){
		try{
			move.effect = JSON.parse(move.effect);
		} catch(err){
			delete move.effect;
		}
	}
	move[move.scope] = {};
	for (let a of ["power", "energyDelta", "duration", "dws"]) {
		move[move.scope][a] = move[a];
	}
	delete move.scope;

	var move2 = GM.get(move.moveType, move.name);
	if (move2){
		$.extend(move2, move);
		move = move2;
		UI.sendFeedbackDialog('Move: ' + move.label + ' has been updated.');
	}else{
		move.label = toTitleCase(move.name);
		GM.set(move.moveType, move.name, move);
		UI.sendFeedbackDialog('Move: ' + move.label + ' has been added.');
	}
	GM.set(move.moveType + "_local", move.name, move);
	GM.save();
}


function moveEditFormReset(){
	GM.erase("fast_local");
	GM.erase("charged_local");
	GM.invalidate();
	GM.fetch(function(){
		UI.sendFeedbackDialog("Latest move data have been fetched");
	});
}


function moveEditFormDelete(){
	var moveType = $("#moveEditForm-table").find("[name=move-moveType]").val();
	var moveName = $("#moveEditForm-table").find("[name=move-name]").val().trim().toLowerCase();
	if (GM.set(moveType, moveName) && GM.set(moveType + "_local", moveName)){
		GM.save();
		UI.sendFeedbackDialog("Move: " + moveName + " has been removed");
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
	
	var pokeType1Input = $(pokemonInput).find("[name=pokemon-pokeType1]")[0];
	var pokeType2Input = $(pokemonInput).find("[name=pokemon-pokeType2]")[0];
	pokeType1Input.innerHTML = "";
	pokeType2Input.innerHTML = "";
	pokeType1Input.appendChild(createElement("option", "None", {value: "none"}));
	pokeType2Input.appendChild(createElement("option", "None", {value: "none"}));
	var Effectiveness = GM.get("battle", "TypeEffectiveness");
	for (var type in Effectiveness){
		pokeType1Input.appendChild(createElement("option", toTitleCase(type), {value: type}));
		pokeType2Input.appendChild(createElement("option", toTitleCase(type), {value: type}));
	}
	
	$(pokemonInput).find("[name=pokemon-name]").autocomplete({
		appendTo: '#pokemonEditForm',
		minLength: 0,
		delay: 0,
		source: function(request, response){
			response(GM.select("pokemon", request.term));
		},
		select: function(event, ui){
			$(this).data('ui-autocomplete')._trigger('change', 'autocompletechange', {item: ui.item});
		},
		change: function(event, ui){
			var pkmInfo = ui.item || GM.get("pokemon", this.value.trim().toLowerCase());
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

				UI.write(pkmInfo, pokemonInput);
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompletePokemonItem;
}


function pokemonEditFormSubmit(){
	var pokemonInput = document.getElementById("pokemonEditForm-table");
	
	var pokemon = UI.read(pokemonInput);
	var orginalLabel = pokemon.name;
	pokemon.name = pokemon.name.toLowerCase();
	
	pokemon.fastMoves = [];
	pokemon.fastMoves_legacy = [];
	pokemon.fastMoves_exclusive = [];
	pokemon.chargedMoves= [];
	pokemon.chargedMoves_legacy = [];
	pokemon.chargedMoves_exclusive = [];
	
	for (let mType of ['fast', 'charged']){
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
			if (GM.get(mType, moveName)){
				pokemon[mType + "Moves" + poolPostFix].push(moveName);
			}
		}
		delete pokemon[mType[0] + "moves"];
	}
	
	var pokemon2 = GM.get("pokemon", pokemon.name);
	if (pokemon2){
		$.extend(pokemon2, pokemon);
		pokemon = pokemon2;
		UI.sendFeedbackDialog('Pokemon: ' + pokemon.label + ' has been updated.');
	}else{
		pokemon.dex = 0;
		pokemon.icon = "https://pokemongo.gamepress.gg/assets/img/sprites/000MS.png";
		pokemon.label = orginalLabel;
		pokemon.rating = 0;
		GM.set("pokemon", pokemon.name, pokemon);
		UI.sendFeedbackDialog('Pokemon: ' + pokemon.label + ' has been added.');
	}
	console.log(pokemon);
	GM.set("Pokemon_local", pokemon.name, pokemon);
	GM.save();
}


function pokemonEditFormReset(){
	GM.erase("pokemon_local");
	GM.invalidate();
	GM.fetch(function(){
		UI.sendFeedbackDialog("Latest Pokemon data have been fetched");
	});
}


function pokemonEditFormDelete(){
	var pokemonName = $("#pokemonEditForm-table").find("[name=pokemon-name]").val();
	if (GM.set("pokemon", pokemonName) && GM.set("pokemon", pokemonName)){
		GM.save();
		UI.sendFeedbackDialog("Pokemon: " + pokemonName + " has been removed");
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
	GM.each("battleSetting", function(value, param){
		var row = createRow([param, "<input id='parameterEditForm-" + param + "'></input>"], 'td');
		row.children[1].children[0].value = JSON.stringify(value);
		parameterTable.children[1].appendChild(row);
	});
}


function parameterEditFormSubmit(){
	var EDITABLE_PARAMETERS = {};
	GM.each("battleSetting", function(value, param){
		try{
			GM.set("battleSetting", param, JSON.parse($('#parameterEditForm-'+param).val()));
		} catch (err){
			UI.sendFeedbackDialog("When parsing parameter: " + param + '; ' + err.toString());
		}
	});
	GM.save();
	UI.sendFeedbackDialog("Battle settings have been updated");
}


function parameterEditFormReset(){
	LocalData.BattleSettings = {};
	GM.save();
	UI.sendFeedbackDialog("Battle settings have been reset. Refresh the page to get default back.");
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
	let primaryUserID = userID2;
	userID2 = document.getElementById('userEditForm-userID-1').value.trim();
	GM.invalidate();
	GM.fetch(function(){
		updateUserTable();
		UI.sendFeedbackDialog("Imported user " + userID2, "", updateUserTable);
		userID2 = primaryUserID;
	});
}


function userEditFormRemoveUser(){
	var userID = document.getElementById('userEditForm-userID-1').value.trim();
	if (GM.get("user", userID) != null){
		GM.set("user", userID);
		updateUserTable();
		UI.sendFeedbackDialog("Successfully removed user " + userID);
	}else{
		UI.sendFeedbackDialog("No user with ID " + userID + " was found");
	}
}


function updateUserTable(){
	var table = document.getElementById('userEditForm-userTable');
	table.children[1].innerHTML = '';
	GM.each("user", function(user){
		table.children[1].appendChild(createRow([
			user.uid,
			user.box.length,
			'<button onclick="updateBoxTable(' + user.uid + ')">View Box</button>'
		], 'td'));
	});
}


function updateBoxTable(uid){
	document.getElementById('boxEditForm-title').innerHTML = "User ID: " + uid;
	var boxEditFormTable = $('#boxEditForm-pokemonTable').DataTable();
	let user = GM.get("user", uid);
	var box = user.box;
	
	$( "#boxEditForm" ).dialog( "open" );
	boxEditFormTable.clear();
	for (var i = 0; i < box.length; i++){
		var fmove = GM.get("fast", box[i].fmove), cmove = GM.get("charged", box[i].cmove);
		boxEditFormTable.row.add([
			i+1,
			createIconLabelSpan(box[i].icon, box[i].label, 'species-input-with-icon'),
			createIconLabelSpan(getTypeIcon(box[i].pokeType1), toTitleCase(box[i].pokeType1), 'move-input-with-icon'),
			createIconLabelSpan(getTypeIcon(box[i].pokeType2), toTitleCase(box[i].pokeType2), 'move-input-with-icon'),
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
	$( "#modEditFormOpener" ).click(function(){
		$( "#modEditForm" ).dialog( "open" );
	});
}


function modEditFormSubmit(){
	GM.invalidate();
	GM.fetch(function(){
		for (var i = 0; i < Mods.length; i++){
			var mod_checkbox = document.getElementById('mod_checkbox_' + i);
			if (mod_checkbox && mod_checkbox.checked){
				Mods[i].effect();
			}
		}
		UI.sendFeedbackDialog("Mods have been applied");
	});
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
	GM.each("friend", function(friendSetting, index){
		friendStartEl.appendChild(createElement("option", friendSetting.name, {"value": index}));
		friendEndEl.appendChild(createElement("option", friendSetting.name, {"value": index}));
	});
	friendStartEl.value = 0;
	friendEndEl.value = friendEndEl.lastChild.value;
}

function MVLTableSubmit(){
	UI.wait(MVLTableCalculate);
}


function MVLTableCalculate(){
	var baseConfig = UI.read();
	baseConfig.aggregation = 'avrg';
	baseConfig.simPerConfig = 100;
	
	var configurations = GBS.parse(baseConfig); // Each configuration will take a row
	
	var friends = [], frendStart = parseInt($("#MVLTable-friendStart").val()), friendEnd = parseInt($("#MVLTable-friendEnd").val());
	GM.each("friend", function(friendSetting, index){
		if (frendStart <= index && index <= friendEnd) {
			friends.push(friendSetting.name);
		}
	});
	
	var levels = [];
	GM.each("level", function(levelSetting){
		levels.push(levelSetting);
	});
	
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
			var winRates = new Array(levels.length), lower = 0, upper = levels.length - 1;
			while (upper >= lower){
				var mid = Math.floor((lower + upper)/2);
				winRates[mid] = getWinRate(levels[mid].name, baseConfig);
				if (winRates[mid] >= 0.6){	
					upper = mid - 1;
				}else{
					lower = mid + 1;
				}
			}
			rowDict[friendLevel] = levels[levels.length - 1].name + "*";
			for (var k = 0; k < winRates.length; k++){
				if (winRates[k] >= 0.6){
					rowDict[friendLevel] = levels[k].name;
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
	return parseFloat(processConfig(cfg)[0].output.statistics.outcome);
}


var teamBuilderPartyPermutationStats = {};

function getPokemonByNID(nid){
	var pokemon = null;
	GM.each("user", function(user){
		for (let pkm of user.box){
			if (pkm.nid == nid){
				pokemon = pkm;
			}
		}
	});
	return pokemon;
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
		UI.wait(teamBuilderCalculatePokemon, "Evaluating Pokemon...");
	}else if (type == 1){
		UI.wait(teamBuilderCalculateParty, "Calculating optimal permuation...");
	}
}


function teamBuilderReadConfig(numAttacker){
	var baseConfig = UI.read();
	
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
	GM.each("user", function(user){
		for (let pokemon of user.box){
			var pokemonCopy = JSON.parse(JSON.stringify(pokemon));
			pokemonCopy.iconLabel = createIconLabelSpan(pokemon.icon, pokemon.label, "species-input-with-icon");
			allPokemon.push(pokemonCopy);
		}
	});
	if (allPokemon.length == 0){
		UI.sendFeedbackDialog("No Pokemon in your box! Please log in and enter some Pokemon.");
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
		for (let config of GBS.parse(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		var avrgSim = GBS.average(intermediateSimResults);
		pokemon.dps = round(avrgSim.output.statistics.dps / numAttacker, 3);
		pokemon.tdo = round(avrgSim.output.statistics.tdo / numAttacker / 6, 1);
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
		UI.sendFeedbackDialog("Party is empty. Analzye Pokemon first.");
		return;
	}
	
	function Permutation(arr, n, start){
		start = start || 0;
		if (n == 0){
			return [[]];
		}
		var permutations = [];
		for (var i = start; i < arr.length; i++){
			let temp = arr[start];
			arr[start] = arr[i];
			arr[i] = temp;
			for (let p2 of Permutation(arr, n - 1, start + 1)){
				var p = [arr[start]];
				p = p.concat(p2);
				permutations.push(p);
			}
			arr[i] = arr[start];
			arr[start] = temp;
		}
		return permutations;
	}
	
	// Test all permuations of parties
	var bestStats = null;
	var bestPermuation = null;
	for (let permutation of Permutation(party, party.length)){ // Did you know that 36 = 6!?
		bestParty.pokemon = permutation;
		let intermediateSimResults = [];
		for (let config of GBS.parse(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		let curStats = GBS.average(intermediateSimResults).output.statistics;
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
		for (let config of GBS.parse(baseConfig)){
			intermediateSimResults = intermediateSimResults.concat(processConfig(config));
		}
		curStats = GBS.average(intermediateSimResults).output.statistics;
		curStats.dps = curStats.dps / numAttacker;
		curStats.tdo_percent = curStats.tdo_percent / numAttacker;
		teamBuilderPartyPermutationStats[key] = curStats;
	}
	document.getElementById("teamBuilder-optimalPartyDPS").innerHTML = round(curStats.dps, 2);
	document.getElementById("teamBuilder-optimalPartyTDO").innerHTML = round(curStats.tdo_percent, 2) + "%";
}


function teamBuilderSaveParty(){
	var namePostFix = 0;
	while (GM.get("BattleParties_local", "Best_Party_" + namePostFix)){
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
	GM.set("BattleParties_local", partyName, bestParty);
	GM.save();
	UI.sendFeedbackDialog('This party has been saved with the name "' + partyName + '"');
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
	var Effectiveness = GM.get("battle", "TypeEffectiveness");
	for (var t1 in Effectiveness){
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
	var Effectiveness = GM.get("battle", "TypeEffectiveness");
	for (var t1 in Effectiveness){
		for (var t2 in Effectiveness[t1]){
			let m = Effectiveness[t1][t2];
			maxMultiplier = Math.max(maxMultiplier, Math.log(m));
			minMultiplier = Math.min(minMultiplier, Math.log(m));
		}
	}
	
	var partyConfig = UI.read(document.getElementById("typeChecker-party"));
	var pokemonReps = [];
	for (let pokemonConfig of partyConfig.pokemon){
		var pokemonRep = {
			pokeType1: "none", pokeType2: "none", attackingTypes: []
		};
		var species = GM.get("pokemon", pokemonConfig.name.trim().toLowerCase());
		if (species != null){
			pokemonRep.pokeType1 = species.pokeType1;
			pokemonRep.pokeType2 = species.pokeType2;
			var fmove = GM.get("fast", pokemonConfig.fmove.trim().toLowerCase());
			var cmove = GM.get("charged", pokemonConfig.cmove.trim().toLowerCase());
			var cmove2 = GM.get("charged", pokemonConfig.cmove2.trim().toLowerCase());
			for (let move of [fmove, cmove, cmove2]) {
				if (move) {
					pokemonRep.attackingTypes.push(move.pokeType);
				}
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
					if (Effectiveness[attackingType]){
						let m = Effectiveness[attackingType][td.innerHTML.toLowerCase()];
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
				let m1 = Effectiveness[attackingType][pokemonRep.pokeType1] || 1;
				let m2 = Effectiveness[attackingType][pokemonRep.pokeType2] || 1;
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
				++i;
			}else{
				escaped = true;
			}
		}else if (str[i] == deli && !escaped){
			data.push(word);
			word = "";
		}else{
			word += str[i];
		}
	}
	data.push(word);
	return data;
}


function battleScore(x, y){
	if (x.strategy2 == "?"){
		x.strategy2 = "0";
		let score1 = battleScore(x, y);
		x.strategy2 = "1";
		let score2 = battleScore(x, y);
		x.strategy2 = "?";
		return (score1 + score2)/2;
	}
	if (y.strategy2 == "?"){
		y.strategy2 = "0";
		let score1 = battleScore(x, y);
		y.strategy2 = "1";
		let score2 = battleScore(x, y);
		y.strategy2 = "?";
		return (score1 + score2)/2;
	}
	var input = {
	  "players": [
		{
		  "team": "0",
		  "parties": [
			{
			  "name": "", "pokemon": [x], "revive": false
			}
		  ]
		},
		{
		  "team": "1",
		  "parties": [
			{
			  "name": "", "pokemon": [y], "revive": false
			}
		  ]
		}
	  ],
	  "battleMode": "pvp",
	  "timelimit": 240000,
	  "aggregation": "tree"
	};
	var output = GBS.run(input);
	
	let statistics = output.statistics;
	let statsX = statistics.players[0].parties[0].pokemon[0];
	let statsY = statistics.players[1].parties[0].pokemon[0];
	return ((statsY.maxHP - Math.max(0, statsY.hp))/statsY.maxHP) - ((statsX.maxHP - Math.max(0, statsX.hp))/statsX.maxHP);
}

function generateBattleMatrix(P){
	for (let pkm of P){
		pkm.strategy = "strat5";
		if (pkm.hasOwnProperty("cp")){
			let species = GM.get("pokemon", pkm.name.toLowerCase().trim());
			let levelAndIVs = inferLevelAndIVs(species, parseInt(pkm.cp));
			pkm.level = levelAndIVs.level;
			pkm.atkiv = levelAndIVs.atkiv;
			pkm.defiv = levelAndIVs.defiv;
			pkm.stmiv = levelAndIVs.stmiv;
		}
	}
	var matrix = [];
	var n = P.length;
	for (var i = 0; i < n; i++){
		matrix.push(new Array(n));
	}
	for (var i = 0; i < n; i++){
		matrix[i][i] = 0;
		for (var j = i + 1; j < n; j++){
			let score = (battleScore(P[i], P[j]) - battleScore(P[j], P[i])) / 2;
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
	
	var config = UI.read();
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

function removeDuplicates(pokemonVector){
	var uniquePokemonVector = [];
	for (let pkm of pokemonVector){
		var unique = true;
		for (let pkm2 of uniquePokemonVector){
			unique = false;
			for (var a in pkm){
				if (a != "cmove" && a != "cmove2" && a != "nickname" && pkm[a] != pkm2[a]){
					unique = true;
					break;
				}
			}
			if (!unique){
				unique = !(pkm.cmove == pkm2.cmove && pkm.cmove2 == pkm2.cmove2) && !(pkm.cmove == pkm2.cmove2 && pkm.cmove2 == pkm2.cmove);
			}
			if (!unique){
				break;
			}
		}
		if (unique){
			uniquePokemonVector.push(pkm);
		}
	}
	return uniquePokemonVector;
}

function battleMatrixSubmit(){
	GBS.mode("pvp");
	
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
			pokemon[attributes[j]] = (rowData[j] || "");
			if (pokemon[attributes[j]] == "*"){
				pokemon[attributes[j]] = "";
			}
		}
		pokemon.copies = 1;
		var wrapperConfig = {
			players: [{parties: [{pokemon: [pokemon]}]}]
		};
		var batchedConfigs = GBS.parse(wrapperConfig);
		function initials(str){
			var firsts = [];
			for (let word of (str || "").split(' ')){
				firsts.push(word[0].toUpperCase());
			}
			return firsts.join('');
		}
		
		for (let cfg of batchedConfigs){
			let p = cfg.players[0].parties[0].pokemon[0];
			if (p.nickname == ""){
				p.nickname = [initials(p.fmove), initials(p.cmove), initials(p.cmove2)].join('.') + ' ' + p.name;
			}
			pokemonVector.push(p);
		}
	}
	
	pokemonVector = removeDuplicates(pokemonVector);
	
	UI.wait(function(){
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
				let pkm = pokemonVector[i + startRow];
				matrix[i].unshift(pkm.nickname || pkm.name);
			}
			var headerRow = [""];
			for (var i = 0; i < endCol - startCol; i++){
				let pkm = pokemonVector[i + startCol];
				headerRow.push(pkm.nickname || pkm.name);
			}
			matrix.unshift(headerRow);
		}
		
		var rawOutputRows = [];
		for (var i = 0; i < matrix.length; i++){
			rawOutputRows.push(matrix[i].join("\t"));
		}
		document.getElementById("battleMatrix-output").value = rawOutputRows.join("\n");
	}, "Running...");
}
