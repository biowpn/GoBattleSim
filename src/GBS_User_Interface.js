
/**
	User Interface. This module handles the interaction with the user. It manipulates the HTML DOM objects with the help of jQuery, handles user event such as clicking and inputting, and most importantly, reads user input for simulation and writes back the simulation results.
	@exports UI
*/
var UI = {};


/**
	Send feedback message to user via a pop-up dialog.
	@param {string} message The content of the feedback.
	@param {string} dialogTitle The title of the dialog. Default to document.title
	@param {function} onOK The callback function that will be called right after the user clicks "OK".
*/
UI.sendFeedbackDialog = function (message, dialogTitle, onOK) {
	var d = $(createElement('div', message, {
		title: dialogTitle || document.title
	})).dialog({
		buttons: {
			"OK": function () {
				$(this).dialog("close");
				if (onOK) {
					onOK();
				}
			}
		}
	});
	DialogStack.push(d);
}

/**
	Display a spinning spinner while waiting a computation job to finish. Remove the spinner upon the job finishes.
	@param {function} task The job to do.
	@param {string} message The message displayed next to the spinner. Default to "Running..."
*/
UI.wait = function (task, message) {
	message = message || "Running...";
	UI.sendFeedbackDialog("<i class='fa fa-spinner fa-spin fa-3x fa-fw'><\/i><span class='sr-only'><\/span>" + message);
	setTimeout(function () {
		try {
			task();
			while (DialogStack.length) {
				DialogStack.pop().dialog('close');
			}
		} catch (err) {
			while (DialogStack.length) {
				DialogStack.pop().dialog('close');
			}
			UI.sendFeedbackDialog("<p>Oops, something went wrong!</p>" + err.toString());
		}
	}, 1);
}

/**
	Recursively read data from HTML element with "name" attribute.
	@param {HTMLElement} element The root HTML element to write back to.
	@return {Object} The data in JSON.
*/
UI.read = function (element) {
	element = element || document.getElementById("input");
	let json = {};
	let nameSegments = (element.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2) {
		let attrName = nameSegments[1];
		let tagName = element.tagName.toLowerCase();
		if (tagName == "input" || tagName == "select") {
			json[attrName] = (element.type == "checkbox" ? element.checked : element.value);
			if (element.type == "number") {
				json[attrName] = parseFloat(json[attrName]) || 0;
			}
		} else {
			let childOutputs = [];
			for (var i = 0; i < element.children.length; i++) {
				let child = element.children[i];
				childOutputs.push(UI.read(child));
			}
			json[attrName] = childOutputs;
		}
	} else {
		for (var i = 0; i < element.children.length; i++) {
			let childJson = UI.read(element.children[i]);
			for (var attr in childJson) {
				json[attr] = childJson[attr];
			}
		}
	}
	return json;
}

/**
	Recursively write data to HTML element with "name" attribute.
	@param {Object] json The json data source.
	@param {HTMLElement} element The root HTML element to write back to.
*/
UI.write = function (json, element) {
	element = element || document.getElementById("input");
	let nameSegments = (element.getAttribute("name") || "").split("-");
	if (nameSegments.length >= 2) {
		let attrName = nameSegments[1];
		if (json.hasOwnProperty(attrName)) {
			let tagName = element.tagName.toLowerCase();
			if (tagName == "input" || tagName == "select") {
				if (element.type == "checkbox") {
					element.checked = json[attrName] || false;
				} else {
					if (typeof json[attrName] == typeof {}) {
						try {
							element.value = JSON.stringify(json[attrName]);
						} catch (err) {
							element.value = "";
						}
					} else {
						element.value = json[attrName] || "";
					}
				}
				if (element.onchange) {
					element.onchange();
				}
			} else {
				let nodeConstructor = { "players": createPlayerNode, "parties": createPartyNode, "pokemon": createPokemonNode }[attrName];
				if (nodeConstructor) {
					element.innerHTML = "";
					for (let childJson of json[attrName]) {
						let childNode = new nodeConstructor();
						element.appendChild(childNode);
						UI.write(childJson, childNode);
					}
				}
			}
		}
	} else {
		for (var i = 0; i < element.children.length; i++) {
			UI.write(json, element.children[i]);
		}
	}
}

/**
	Refresh the whole UI and make it pretty.
*/
UI.refresh = function () {
	formatting();
	relabel();
}

/**
	Update the master summary table containing completed simulations.
	@param {Object[]} battles A list of completed simulations.
	@param {Object} metrics The metrics (columns) to show in the table.
*/
UI.updateMasterSummaryTable = function (battles, metrics) {
	document.getElementById("feedback_table1").innerHTML = "";
	var table = createMasterSummaryTable(battles, metrics);
	document.getElementById("feedback_table1").appendChild(table);
	var dt = $(table).DataTable({
		scroller: true,
		scrollX: true,
		scrollY: '30vh'
	});
	addFilterToFooter(dt);
}

/**
	Display a specific simulation in the simulation details panel.
	@param {Object} battle The data of the simulation.
*/
UI.updateSimulationDetails = function (battle) {
	var section = document.getElementById("feedback_table2");
	section.innerHTML = "";

	var section2 = document.getElementById("feedback_table3");
	section2.innerHTML = "";

	if (!battle)
		return;

	// Replay the input
	UI.write(battle.input);
	complyBattleMode(battle.input.battleMode);
	UI.refresh();
	UI.exportConfig(battle.input);

	// Update Player/Party/Pokemon statistics
	section.innerHTML = "";
	for (var i = 0; i < battle.output.statistics.players.length; i++) {
		var playerStat = battle.output.statistics.players[i];
		section.appendChild(createElement('h4', createPlayerStatisticsString(playerStat),
			{ style: 'background:' + HSL_COLORS[i % HSL_COLORS.length][0] }));
		var playerDiv = document.createElement('div');
		for (var j = 0; j < playerStat.parties.length; j++) {
			playerDiv.appendChild(createElement('h5', 'Party ' + (j + 1)));
			var partyDiv = document.createElement('div');
			partyDiv.appendChild(createPokemonStatisticsTable(playerStat.parties[j].pokemon));
			playerDiv.appendChild(partyDiv);
		}
		section.appendChild(playerDiv);
		$(playerDiv).accordion({
			active: false,
			collapsible: true,
			heightStyle: 'content'
		});
	}
	$(section).accordion({
		active: false,
		collapsible: true,
		heightStyle: 'content'
	});

	// battle log
	if (battle.output.battleLog.length > 0) {
		section2.appendChild(createBattleLogTable(battle));
	}
}

/** 
	Update the url based on current battle input.
	@param {Object} input The battle input.
	@return {string} The updated url.
*/
UI.exportConfig = function (battleInput) {
	// Delete redundant attributes to shorten the URL
	var battleInputMin = {};
	$.extend(battleInputMin, battleInput);
	for (let player of battleInputMin.players || []) {
		for (var attr in player) {
			if (!player[attr]) {
				delete player[attr];
			}
		}
		for (let party of player.parties) {
			for (var attr in party) {
				if (!party[attr]) {
					delete party[attr];
				}
			}
			for (let pokemon of party.pokemon) {
				delete pokemon.label;
				for (var attr in pokemon) {
					if (!pokemon[attr]) {
						delete pokemon[attr];
					}
					if ((pokemon.role || "").toLowerCase() == "rb") {
						delete pokemon.atkiv;
						delete pokemon.defiv;
						delete pokemon.stmiv;
						delete pokemon.level;
					} else {
						delete pokemon.raidTier;
					}
				}
			}
		}
	}
	var url = window.location.href.split('?')[0];
	if (Object.keys(battleInputMin).length > 0) {
		url += '?' + encodeURIComponent(JSON.stringify(battleInputMin));
	}
	window.history.pushState('', "GoBattleSim", url);
	return url;
}

/** 
	Parse simulation input from URL.
	@param {string} url The URL to parse.
	@return {Object} The battle input.
*/
UI.importConfig = function (url) {
	url = url || window.location.href;
	return JSON.parse(decodeURIComponent((url.split('?')[1])));
}


/*
	Non-interface members
*/
var MAX_NUM_POKEMON_PER_PARTY = 6;
var MAX_NUM_PARTIES_PER_PLAYER = 5;
var MAX_NUM_OF_PLAYERS = 21;

var DialogStack = [];

var HSL_COLORS = [
	['hsl(209, 100%, 90%)', 'hsl(209, 100%, 80%)', 'hsl(209, 100%, 70%)'],
	['hsl(0, 100%, 90%)', 'hsl(0, 100%, 80%)', 'hsl(0, 100%, 70%)'],
	['hsl(48, 100%, 90%)', 'hsl(48, 100%, 70%)', 'hsl(48, 100%, 50%)'],
	['hsl(120, 60%, 90%)', 'hsl(120, 60%, 70%)', 'hsl(120, 60%, 50%)']
];




/**
	Round the value.
	@param {number} Value to round.
	@param {number} numDigits The number of digits to keep.
	@return {number} The rounded value.
*/
function round(value, numDigits) {
	var multiplier = Math.pow(10, parseInt(numDigits) || 0);
	return Math.round(value * multiplier) / multiplier;
}

/**
	Format input HTML elements.
	@param {HTMLElement} element The root element to format.
*/
function formatting(element) {
	element = element || document.getElementById("input");
	let name = element.getAttribute("name") || "";
	if (name.includes("-name") || name.includes("-fmove") || name.includes("-cmove")) {
		element.value = toTitleCase(element.value);
	}
	if ($(element).data("ui-autocomplete")) {
		$(element).data("ui-autocomplete")._trigger("change");
	} else if ($(element).data("ui-checkboxradio")) {
		$(element).button("refresh");
	}
	for (var i = 0; i < element.children.length; i++) {
		formatting(element.children[i]);
	}
}

/** 
	Update label and background color of player/party/pokemon nodes based on their position.
*/
function relabel() {
	var playerNodes = $("#input").find("[name=input-players]")[0];
	for (var i = 0; i < playerNodes.children.length; i++) {
		let playerNode = playerNodes.children[i];
		playerNode.setAttribute('style', 'background:' + HSL_COLORS[i % HSL_COLORS.length][0]);
		playerNode.children[0].children[0].innerHTML = "Player " + (i + 1);
		for (var j = 0; j < playerNode.children[1].children.length; j++) {
			let partyNode = playerNode.children[1].children[j];
			partyNode.setAttribute('style', 'background:' + HSL_COLORS[i % HSL_COLORS.length][1]);
			partyNode.children[0].children[0].innerHTML = "Party " + (j + 1);
			for (var k = 0; k < partyNode.children[1].children.length; k++) {
				let pokemonNode = partyNode.children[1].children[k];
				pokemonNode.setAttribute('style', 'background:' + HSL_COLORS[i % HSL_COLORS.length][2]);
				pokemonNode.children[0].children[0].innerHTML = "Pokemon " + (k + 1);
			}
		}
	}
}

/**
	Create a document element.
	@param {string} type The name tag of the element. E.g., "input", "button", "div"
	@param {string} innerHTML The initial value of innerHTML of the element to create. Default to empty string "".
	@param {Object} attrsAndValues Name-value pairs to add additional attributes to the element.
	@return {HTMLElement} The HTML element created.
*/
function createElement(type, innerHTML, attrsAndValues) {
	var e = document.createElement(type);
	e.innerHTML = innerHTML || "";
	for (var attr in attrsAndValues) {
		e.setAttribute(attr, attrsAndValues[attr]);
	}
	return e;
}


function createRow(rowData, type) {
	type = type || "td";
	var row = document.createElement("tr");
	for (var i = 0; i < rowData.length; i++) {
		var d = document.createElement(type);
		d.innerHTML = rowData[i];
		row.appendChild(d);
	}
	return row;
}


function createPokemonNameInput() {
	var nameInput = createElement('input', '', {
		type: 'text', placeholder: 'Species', class: 'input-with-icon species-input-with-icon',
		style: 'background-image: url(' + getPokemonIcon() + ')', name: "pokemon-name"
	});
	$(nameInput).autocomplete({
		minLength: 0,
		delay: 200,
		source: function (request, response) {
			var searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term);
			var matches = GM.select("pokemon_all", searchStr);
			response(matches);
		},
		select: function (event, ui) {
			var pkmInfo = ui.item;
			ui.item.value = toTitleCase(ui.item.name);
			let pokemonNode = $(this).parents("[name=pokemon]")[0];
			if (pkmInfo.uid) {
				UI.write(pkmInfo, pokemonNode);
				formatting(pokemonNode);
			}
			this.setAttribute('style', 'background-image: url(' + pkmInfo.icon + ')');
			if (pkmInfo.raidMarker) {
				let raidTierInput = $(pokemonNode).find("[name=pokemon-raidTier]")[0];
				if (raidTierInput) {
					raidTierInput.value = pkmInfo.raidMarker.split(" ")[0];
					raidTierInput.onchange();
				}
			}
		},
		change: function (event, ui) {
			if (!ui.item) { // Change not due to selecting an item from menu
				let species = GM.get("pokemon", this.value.toLowerCase());
				this.setAttribute('style', 'background-image: url(' + (species ? species.icon : getPokemonIcon()) + ')');
			}
		}
	}).autocomplete("instance")._renderItem = _renderAutocompletePokemonItem;

	return nameInput;
}


function createPokemonMoveInput(moveType, attrName) {
	var placeholder_ = "";
	if (moveType == "fast") {
		placeholder_ = "Fast Move";
	} else if (moveType == "charged") {
		placeholder_ = "Charged Move";
	}
	let moveInput = createElement('input', '', {
		type: 'text', placeholder: placeholder_, name: "pokemon-" + attrName,
		class: 'input-with-icon move-input-with-icon', style: 'background-image: url()'
	});
	$(moveInput).autocomplete({
		minLength: 0,
		delay: 0,
		source: function (request, response) {
			let pokemonInstance = GM.get("pokemon", $(moveInput).parents("[name=pokemon]").find("[name=pokemon-name]").val().trim().toLowerCase());
			let searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term), matches = [];
			if (searchStr == '' && pokemonInstance) { //special case
				searchStr = 'current, legacy, exclusive';
			}
			matches = GM.select(moveType, searchStr, pokemonInstance);
			response(matches);
		},
		select: function (event, ui) {
			this.setAttribute('style', 'background-image: url(' + ui.item.icon + ')');
		},
		change: function (event, ui) {
			if (!ui.item) { // Change not due to selecting an item from menu
				let move = GM.get(moveType, this.value.toLowerCase().trim());
				this.setAttribute('style', 'background-image: url(' + (move ? move.icon : getTypeIcon()) + ')');
			}
		}
	}).autocomplete("instance")._renderItem = _renderAutocompleteMoveItem;

	moveInput.onfocus = function () { $(this).autocomplete("search", ""); };

	return moveInput;
}

function createMinimizeButton(parentName) {
	const pName = parentName;
	var button = createElement("button", '<i class="fa fa-minus" aria-hidden="true"></i>', {
		class: "button-icon", title: "Minimize"
	});
	button.onclick = function () {
		$($(this).parents("[name=" + pName + "]")[0].children[1]).slideToggle('fast');
	}
	return button;
}


function createCopyPokemonButton() {
	var copyPokemonButton = createElement('button', '<i class="fa fa-files-o" aria-hidden="true"></i>', {
		class: "button-icon", title: "Copy"
	});
	copyPokemonButton.onclick = function () {
		LocalData.PokemonClipboard = UI.read($(this).parents("[name=pokemon]")[0]);
		GM.save();
	}
	return copyPokemonButton;
}


function createPastePokemonButton() {
	var pastePokemonButton = createElement('button', '<i class="fa fa-clipboard" aria-hidden="true"></i>', {
		class: "button-icon", title: "Paste"
	});
	pastePokemonButton.onclick = function () {
		var pokemonNode = $(this).parents("[name=pokemon]")[0];
		UI.write(LocalData.PokemonClipboard || {}, pokemonNode);
		formatting(pokemonNode);
	}
	return pastePokemonButton;
}


function createRemovePokemonButton() {
	var removePokemonButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: "button-icon", title: "Remove"
	});
	removePokemonButton.onclick = function () {
		var pokemonNode = $(this).parents("[name=pokemon]")[0];
		if (pokemonNode.parentNode.children.length > 1) {
			pokemonNode.parentNode.removeChild(pokemonNode);
		} else {
			UI.sendFeedbackDialog("Cannot remove the only Pokemon of the party.");
		}
		relabel();
	}
	return removePokemonButton;
}


function createPokemonRoleInput() {
	var roleInput = createElement("select", "", { name: "pokemon-role" });
	roleInput.appendChild(createElement('option', 'Attacker', { value: "a" }));
	roleInput.appendChild(createElement('option', 'Attacker Basic', { value: "a_basic" }));
	roleInput.appendChild(createElement('option', 'Gym Defender', { value: "gd" }));
	roleInput.appendChild(createElement('option', 'Gym Defender Basic', { value: "gd_basic" }));
	roleInput.appendChild(createElement('option', 'Raid Boss', { value: "rb" }));
	roleInput.appendChild(createElement('option', 'Raid Boss Immortal', { value: "RB" }));
	roleInput.onchange = function () {
		var pokemonNode = $(this).parents("[name=pokemon]")[0];
		for (var i = 0; i < pokemonNode.children[1].children.length; i++) {
			var child = pokemonNode.children[1].children[i];
			if (child.hasAttribute("for_roles")) {
				let roles = child.getAttribute("for_roles").split(";");
				if (roles.includes(this.value)) {
					child.removeAttribute("hidden");
				} else {
					child.setAttribute("hidden", true);
				}
			}
		}
		var strategyNode = $(pokemonNode).find("[name=pokemon-strategy]")[0];
		if (this.value == "a" || this.value == "a_basic") {
			if (strategyNode.value == "DEFENDER")
				strategyNode.value = "ATTACKER_NO_DODGE";
		} else {
			strategyNode.value = "DEFENDER";
		}
	}
	roleInput.comply = function (kwargs) {
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				if (kwargs.battleMode == "raid") {
					if (this.value.toLowerCase() != "rb") {
						this.value = "rb";
					}
				} else {
					this.value = "gd";
				}
				this.onchange();
				//this.disabled = true;
			}
		} else if (kwargs.battleMode == "pvp") {
			if (this.value != "a" && this.value != "a_basic") {
				this.value = "a";
				this.onchange();
			}
		}
	}
	return roleInput;
}


function createPokemonCopiesInput() {
	var copiesInput = createElement('input', '', {
		type: 'number', placeholder: 'Copies', title: "Number of copies",
		min: 1, max: 6, value: 1, name: "pokemon-copies"
	});
	copiesInput.onchange = function () {
		var pokemonCount = countPokemonFromParty($(this).parents("[name=party]")[0]);
		if (pokemonCount > MAX_NUM_POKEMON_PER_PARTY) {
			this.value -= pokemonCount - MAX_NUM_POKEMON_PER_PARTY;
		}
		if (this.value < 1)
			this.value = 1;
	}
	copiesInput.comply = function (kwargs) {
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				this.value = 1;
				this.disabled = true;
			}
		}
	}
	return copiesInput;
}


function createPokemonRaidTierInput() {
	var raidTierInput = createElement("select", "", {
		name: "pokemon-raidTier"
	});
	GM.each("RaidTier", function (raidTier) {
		raidTierInput.appendChild(createElement('option', raidTier.label, { value: raidTier.name }));
	});
	raidTierInput.onchange = function () {
		this.comply({ battleMode: $("#battleMode").val() });
	}
	raidTierInput.comply = function (kwargs) {
		if (kwargs.battleMode == "raid") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				var timelimitInput = document.getElementById("timelimit");
				if (parseInt(this.value) <= 4) {
					timelimitInput.value = GM.get("battle", "timelimitRaidMs", "battle");
				} else {
					timelimitInput.value = GM.get("battle", "timelimitLegendaryRaidMs");
				}
			}
		}
	}
	return raidTierInput;
}


function createPokemonStrategyInput() {
	var strategyInput = createElement('select', '', { name: "pokemon-strategy" });
	strategyInput.appendChild(createElement('option', 'No Dodge', { value: "ATTACKER_NO_DODGE" }));
	strategyInput.appendChild(createElement('option', 'No Dodge Burst', { value: "ATTACKER_NO_DODGE_BURST" }));
	strategyInput.appendChild(createElement('option', 'No Dodge Combo 1+N', { value: "ATTACKER_NO_DODGE_COMBO_1_PLUS_N" }));
	strategyInput.appendChild(createElement('option', 'No Dodge Combo 2+N', { value: "ATTACKER_NO_DODGE_COMBO_2_PLUS_N" }));
	strategyInput.appendChild(createElement('option', 'No Dodge Fast Only ', { value: "ATTACKER_NO_DODGE_FAST_ATTACK_ONLY" }));
	strategyInput.appendChild(createElement('option', 'Dodge Charged', { value: "ATTACKER_DODGE_CHARGED" }));
	strategyInput.appendChild(createElement('option', 'Dodge All', { value: "ATTACKER_DODGE_ALL" }));
	strategyInput.appendChild(createElement('option', 'Defender AI', { value: "DEFENDER" }));
	strategyInput.appendChild(createElement('option', 'PvP Basic', { value: "PVP_BASIC" }));
	strategyInput.comply = function (kwargs) {
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				this.value = "DEFENDER";
				this.disabled = true;
			}
		} else if (kwargs.battleMode == "pvp") {
			this.value = "PVP_BASIC";
			$(this).parents("[name=pokemon]").find("[name=pokemon-strategy2]").show();
			$(this).hide();
		}
	}
	return strategyInput;
}


function createPokemonProtectStrategyInput() {
	var strategyInput = createElement('input', '0,0', {
		name: "pokemon-strategy2", placeholder: "Number of Shields"
	});
	strategyInput.comply = function (kwargs) {
		if (kwargs.battleMode != "pvp") {
			$(this).parents("[name=pokemon]").find("[name=pokemon-strategy]").show();
			$(this).hide();
		}
	}
	return strategyInput;
}

function createPartyNameInput() {
	var partyNameInput = createElement('input', '', {
		type: "text", style: "width: 30%; display: inline-block; text-align: center;", name: "party-name"
	});
	$(partyNameInput).autocomplete({
		minLength: 0,
		delay: 0,
		source: function (request, response) {
			var matches = [];
			GM.each("user", function (user) {
				for (let party of user.parties) {
					if (party.name.includes(request.term)) {
						matches.push(party);
					}
				}
			});
			for (let party of LocalData.BattleParties) {
				if (party.name.includes(request.term)) {
					matches.push(party);
				}
			}
			response(matches);
		},
		select: function (event, ui) {
			var partyNode = $(this).parents("[name=party]")[0];
			UI.write(ui.item, partyNode);
			comply(partyNode, { battleMode: $("#battleMode").val() });
			formatting(partyNode);
			relabel();
		}
	});
	partyNameInput.comply = function (kwargs) {
		if (kwargs.battleMode == "raid") {
			$player = $(this).parents("[name=player]");
			if ($player.find("[name=player-team]").val() == "1") {
				let pokemonNodes = $player.find("[name=party-pokemon]")[0];
				while (pokemonNodes.children.length > 1) {
					pokemonNodes.removeChild(pokemonNodes.lastChild);
				}
			}
		}
	}
	partyNameInput.onfocus = function () {
		$(this).autocomplete("search", "");
	}
	return partyNameInput;
}


function createSavePartyButton() {
	var savePartyButton = createElement('button', '<i class="fa fa-floppy-o" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Save'
	});
	savePartyButton.onclick = function () {
		var partyNode = $(this).parents("[name=party]")[0];
		var partyName = $(partyNode).find("[name=party-name]").val();
		if (partyName.length > 0) {
			let partyConfig = UI.read(partyNode);
			party.label = partyName;
			GM.set("BattleParties_local", partyName, party);
			GM.save();
			UI.sendFeedbackDialog('Local party "' + partyName + '" has been saved!');
		}
	}
	return savePartyButton;
}


function createRemovePartyButton() {
	var removePartyButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Remove'
	});
	removePartyButton.onclick = function () {
		var partyNode = $(this).parents("[name=party]")[0];
		var partyName = $(partyNode).find("[name=party-name]").val();
		var askForConfirm = GM.get("BattleParties_local", partyName) != null;
		if (partyNode.parentNode.children.length > 1) {
			partyNode.parentNode.removeChild(partyNode);
		} else if (!askForConfirm) {
			UI.sendFeedbackDialog("Cannot remove the only party of the player.");
		}
		if (askForConfirm) {
			var removePartyDialog = createElement('div', 'Do you want to remove local party "' + partyName + '"?');
			$(removePartyDialog).dialog({
				buttons: [{
					text: "Yes",
					style: 'width: 40%; float: left;',
					click: function () {
						GM.set("BattleParties_local", partyName);
						GM.save();
						$(this).dialog("close");
						UI.sendFeedbackDialog('Local party "' + partyName + '" has been removed.');
					}
				}, {
					text: "No",
					style: 'width: 40%; float: right;',
					click: function () {
						$(this).dialog("close");
					}
				}]
			}).dialog('open');
		}
		relabel();
	}
	return removePartyButton;
}


function createPartyReviveCheckbox() {
	var reviveCheckboxContainer = createElement("label", "Max Revive", { style: "width: 50%" });
	var reviveCheckbox = createElement("input", "", { type: "checkbox", name: "party-revive" });
	reviveCheckbox.onclick = function () {
		$(this).button("refresh");
	}
	reviveCheckbox.comply = function (kwargs) {
		$(this).button("enable");
		if (kwargs.battleMode == "raid") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				this.checked = false;
				$(this).button("refresh");
				$(this).button("disable");
			}
		} else if (kwargs.battleMode == "gym" || kwargs.battleMode == "pvp") {
			this.checked = false;
			$(this).button("refresh");
			$(this).button("disable");
		}
	}
	reviveCheckboxContainer.appendChild(reviveCheckbox);
	return reviveCheckboxContainer;
}


function createAddPokemonButton() {
	var addPokemonButton = createElement("button", "Add Pokemon", { style: "width: 50%" });
	addPokemonButton.onclick = function () {
		let partyNode = $(this).parents("[name=party]")[0];
		let pokemonCount = countPokemonFromParty(partyNode);
		if (pokemonCount < MAX_NUM_POKEMON_PER_PARTY) {
			let newPokemonNode = createPokemonNode();
			let prevPokemonConfig = UI.read(partyNode.children[1].lastChild);
			prevPokemonConfig.copies = 1;
			partyNode.children[1].appendChild(newPokemonNode);
			UI.write(prevPokemonConfig, newPokemonNode);
			formatting(newPokemonNode);
			comply(newPokemonNode, { battleMode: $("#battleMode").val() });
			relabel();
		} else {
			UI.sendFeedbackDialog("Exceeding Maximum number of Pokemon per party.");
		}
	}
	addPokemonButton.comply = function (kwargs) {
		$(this).button("enable");
		if (kwargs.battleMode == "raid") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				$(this).button("disable");
			}
		}
	}
	return addPokemonButton;
}


function createPlayerTeamInput() {
	var playerTeamInput = createElement('select', '', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-team"
	});
	playerTeamInput.appendChild(createElement('option', "Primary Team", { value: "0" }));
	playerTeamInput.appendChild(createElement('option', "Opposite Team", { value: "1" }));
	playerTeamInput.onchange = function () {
		/* TODO: Validation - different team
		// Something buggy on this section of codes
		var different = false;
		for (let player of UI.read().players){
			if (player.team != this.value){
				different = true;
				break;
			}
		}
		if (!different){
			this.value = this.value == "0" ? "1": "0";
			UI.sendFeedbackDialog("There must be two different teams");
		}
		*/
	}
	playerTeamInput.comply = function (kwargs) {
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym") {
			this.disabled = true;
			var $playerNode = $(this).parents("[name=player]");
			if ($playerNode.find("[name=player-team]").val() == "1" || kwargs.battleMode == "gym") {
				let partyNodes = $playerNode.find("[name=player-parties]")[0];
				while (partyNodes.children.length > 1) {
					partyNodes.removeChild(partyNodes.lastChild);
				}
			}
		}
	}
	return playerTeamInput;
}


function createPlayerFriendInput() {
	var playerFriendInput = createElement('select', '', {
		style: 'width: 50%; display: inline-block; text-align: center;', name: "player-friend"
	});
	GM.each("friend", function (friendSetting) {
		playerFriendInput.appendChild(createElement('option', friendSetting.label, { value: friendSetting.name }));
	});
	playerFriendInput.comply = function (kwargs) {
		this.disabled = false;
		if (kwargs.battleMode == "raid" || kwargs.battleMode == "gym") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				this.value = "none";
				this.disabled = true;
			}
		}
	}
	return playerFriendInput;
}


function createRemovePlayerButton() {
	var removePlayerButton = createElement('button', '<i class="fa fa-times" aria-hidden="true"></i>', {
		class: 'button-icon', title: 'Remove'
	});
	removePlayerButton.onclick = function () {
		var playersNode = $("#input").find("[name=input-players]")[0];
		if (playersNode.children.length > 2) {
			var playerNode = $(this).parents("[name=player]")[0];
			playerNode.parentNode.removeChild(playerNode);
			document.getElementById('input.addPlayer').disabled = false;
			relabel();
		} else {
			UI.sendFeedbackDialog("Need at least two players to fight");
		}
	}
	return removePlayerButton;
}


function createAddPartyButton() {
	var addPartyButton = createElement("button", "Add Party", {
		class: 'player_button'
	});
	addPartyButton.onclick = function () {
		var playerNode = $(this).parents("[name=player]")[0];
		if (playerNode.children[1].children.length < MAX_NUM_PARTIES_PER_PLAYER) {
			playerNode.children[1].appendChild(createPartyNode());
			relabel();
		} else {
			UI.sendFeedbackDialog("Exceeding Maximum number of Parties per player.");
		}
	}
	addPartyButton.comply = function (kwargs) {
		$(this).button("enable");
		if (kwargs.battleMode == "raid") {
			if ($(this).parents("[name=player]").find("[name=player-team]").val() == "1") {
				$(this).button("disable");
			}
		} else if (kwargs.battleMode == "gym") {
			$(this).button("disable");
		}
	}
	return addPartyButton;
}

// Recursive call to make a node and all its children to comply the system requirements
function comply(node, kwargs) {
	node = node || document.getElementById("input");
	kwargs = kwargs || { battleMode: $("#battleMode").val() };
	if (node.comply) {
		node.comply(kwargs);
	}
	for (var i = 0; i < node.children.length; i++) {
		comply(node.children[i], kwargs);
	}
}

// Trigger when the battle mode input changed
function complyBattleMode(mode) {
	let playerNodes = $("#input").find("[name=input-players]")[0];
	if (mode == "gym" || mode == "raid") {
		let hasProcessedDefender = false;
		for (var i = 0; i < playerNodes.children.length; i++) {
			let playerNode = playerNodes.children[i];
			if ($(playerNode).find("[name=player-team]").val() == "1") {
				if (hasProcessedDefender) {
					playerNodes.removeChild(playerNode);
				} else {
					hasProcessedDefender = true;
				}
			}
		}
	} else if (mode == "pvp") {

	}
	comply(playerNodes, { battleMode: mode });
	var timelimitInput = document.getElementById("timelimit");
	if (mode == "gym") {
		timelimitInput.value = GM.get("battle", "timelimitGymMs");
	} else if (mode == "pvp") {
		timelimitInput.value = GM.get("battle", "timelimitPvPMs");
	}
	GBS.mode(mode);
}


function createPokemonNode() {
	var pokemonNode = createElement('div', '', {
		class: "section-body section-pokemon-node", name: "pokemon"
	});
	pokemonNode.appendChild(createElement('div', "", { class: "section-node-head" }));
	pokemonNode.appendChild(createElement('div', ""));
	pokemonNode.appendChild(createElement('div', ""));

	// 1. Head
	pokemonNode.children[0].appendChild(createElement('span', "Unlabeled Pokemon", { class: "section-node-title" }));

	var controlButtonDiv = createElement('div', "", { class: "section-buttons-panel" });
	controlButtonDiv.appendChild(createMinimizeButton("pokemon"));
	controlButtonDiv.appendChild(createCopyPokemonButton());
	controlButtonDiv.appendChild(createPastePokemonButton());
	controlButtonDiv.appendChild(createRemovePokemonButton());
	pokemonNode.children[0].appendChild(controlButtonDiv);


	// 2. Body
	var tb1 = createElement("table", "<colgroup><col width=50%><col width=25%><col width=25%></colgroup>");
	tb1.appendChild(createRow(['', '', ''], 'td'));
	tb1.children[1].children[0].appendChild(createPokemonNameInput());
	tb1.children[1].children[0].appendChild(createElement("input", "", { name: "pokemon-label", hidden: true }));
	tb1.children[1].children[1].appendChild(createPokemonRoleInput());
	tb1.children[1].children[2].appendChild(createPokemonCopiesInput());
	pokemonNode.children[1].appendChild(tb1);

	var tb2 = createElement("table", "<colgroup><col width=25%><col width=25%><col width=25%><col width=25%></colgroup>", { for_roles: "a;gd" });
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
	pokemonNode.children[1].appendChild(tb2);

	var tb2b = createElement("table", "<colgroup><col width=100%></colgroup>", { hidden: "true", for_roles: "a_basic;gd_basic" });
	tb2b.appendChild(createRow(['']));
	tb2b.children[1].children[0].appendChild(createElement("input", "", {
		placeholder: "CP", name: "pokemon-cp"
	}));
	pokemonNode.children[1].appendChild(tb2b);

	var tb3 = createElement("table", "<colgroup><col width=100%></colgroup>", { hidden: "true", for_roles: "rb;RB" });
	tb3.appendChild(createRow(['']));
	tb3.children[1].children[0].appendChild(createPokemonRaidTierInput());
	pokemonNode.children[1].appendChild(tb3);

	var tb4 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb4.appendChild(createRow(['', ''], 'td'));
	tb4.children[1].children[0].appendChild(createPokemonMoveInput("fast", "fmove"));
	tb4.children[1].children[1].appendChild(createPokemonStrategyInput());
	var protectShieldStratInput = createPokemonProtectStrategyInput();
	protectShieldStratInput.setAttribute("hidden", true);
	tb4.children[1].children[1].appendChild(protectShieldStratInput);
	pokemonNode.children[1].appendChild(tb4);

	var tb5 = createElement("table", "<colgroup><col width=50%><col width=50%></colgroup>");
	tb5.appendChild(createRow(['', ''], 'td'));
	tb5.children[1].children[0].appendChild(createPokemonMoveInput("charged", "cmove"));
	tb5.children[1].children[1].appendChild(createPokemonMoveInput("charged", "cmove2"));
	pokemonNode.children[1].appendChild(tb5);

	return pokemonNode;
}


function createPartyNode() {
	var partyNode = createElement('div', '', {
		class: 'section-body section-party-node', name: "party"
	});
	partyNode.appendChild(createElement('div', "", { class: "section-node-head" }));
	partyNode.appendChild(createElement('div', "", { name: "party-pokemon" }));
	partyNode.appendChild(createElement('div', "", { style: "width:100%" }));

	// 1. Head
	partyNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Party</span>";
	partyNode.children[0].appendChild(createPartyNameInput());
	var controlButtonDiv = createElement('div', "", { class: "section-buttons-panel" });
	controlButtonDiv.appendChild(createMinimizeButton("party"));
	controlButtonDiv.appendChild(createSavePartyButton());
	controlButtonDiv.appendChild(createRemovePartyButton());
	partyNode.children[0].appendChild(controlButtonDiv);

	// 2. Body
	partyNode.children[1].appendChild(createPokemonNode());
	$(partyNode.children[1]).sortable({ axis: 'y' });

	// 3. Tail
	partyNode.children[2].appendChild(createPartyReviveCheckbox());
	partyNode.children[2].appendChild(createAddPokemonButton());
	$(partyNode.children[2]).controlgroup();

	return partyNode;
}


function createPlayerNode() {
	var playerNode = createElement('div', '', {
		class: 'section-body section-player-node', name: "player"
	});
	playerNode.appendChild(createElement('div', "", { class: "section-node-head" }));
	playerNode.appendChild(createElement('div', "", { name: "player-parties" }));
	playerNode.appendChild(createElement('div', "", { style: "width:100%" }));

	// 1. Head
	playerNode.children[0].innerHTML = "<span class='section-node-title'>Unlabeled Player</span>";
	var playerSettingDiv = createElement('div', '', {
		style: 'width: 50%; display: inline-block; text-align: center;'
	});
	playerSettingDiv.appendChild(createPlayerTeamInput());
	playerSettingDiv.appendChild(createPlayerFriendInput());
	playerNode.children[0].appendChild(playerSettingDiv);

	var controlButtonDiv = createElement('div', "", { class: 'section-buttons-panel' });
	controlButtonDiv.appendChild(createMinimizeButton("player"));
	controlButtonDiv.appendChild(createRemovePlayerButton());
	playerNode.children[0].appendChild(controlButtonDiv);

	// 2. Body
	playerNode.children[1].appendChild(createPartyNode());
	$(playerNode.children[1]).sortable({ axis: 'y' });

	// 3. Tail
	playerNode.children[2].appendChild(createAddPartyButton());
	$(playerNode.children[2]).controlgroup();

	return playerNode;
}


function addPlayerNode() {
	var playerNodes = $("#input").find("[name=input-players]")[0];
	if (playerNodes.children.length < MAX_NUM_OF_PLAYERS) {
		playerNodes.appendChild(createPlayerNode());
		relabel();
	} else {
		document.getElementById('input.addPlayer').setAttribute('disabled', true);
		UI.sendFeedbackDialog('Exceeding maximum number of players.');
	}
}


function countPokemonFromParty(partyNode) {
	var count = 0;
	for (let pokemonCopiesEl of $(partyNode).find("[name=pokemon-copies]")) {
		count += parseInt($(pokemonCopiesEl).val()) || 0;
	}
	return count;
}


function addFilterToFooter(table) {
	table.columns().flatten().each(function (colIdx) {
		table.column(colIdx).footer().innerHTML = "";
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).footer()
			)
			.on('change', function () {
				table.column(colIdx).search($(this).val()).draw();
			});

		select.append($("<option value=' '>*</option>"));
		table.column(colIdx).cache('search').sort().unique()
			.each(function (d) {
				var op = document.createElement('option');
				op.value = d;
				op.innerHTML = d;
				select.append(op);
			});
	});
}




// https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
var copyToClipboard = str => {
	const el = document.createElement('textarea');  // Create a <textarea> element
	el.value = str;                                 // Set its value to the string that you want copied
	el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
	el.style.position = 'absolute';
	el.style.left = '-9999px';                      // Move outside the screen to make it invisible
	document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
	const selected =
		document.getSelection().rangeCount > 0        // Check if there is any content selected previously
			? document.getSelection().getRangeAt(0)     // Store selection if found
			: false;                                    // Mark as false to know no selection existed before
	el.select();                                    // Select the <textarea> content
	document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
	document.body.removeChild(el);                  // Remove the <textarea> element
	if (selected) {                                 // If a selection existed before copying
		document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
		document.getSelection().addRange(selected);   // Restore the original selection
	}
};

function getTableContent(dt) {
	var content = [];
	let headers = dt.columns().header();
	content.push(headers.map(x => x.innerText.trim()));

	let attributes = dt.columns().dataSrc();
	let data = dt.rows({ search: "applied" }).data();
	for (var i = 0; i < data.length; i++) {
		let row = [];
		for (var j = 0; j < attributes.length; ++j) {
			var attr = attributes[j];
			row.push($("<div>" + data[i][attr] + "</div>").text());
		}
		content.push(row);
	}
	return content;
}


function makeAndDownloadCSV(arrayOfLines, filename) {
	filename = filename || "whatever.csv";
	var lineArray = [];
	arrayOfLines.forEach(function (infoArray) {
		lineArray.push(infoArray.map(x => '"' + x.toLocaleString() + '"').join(","));
	});
	var csvContent = lineArray.join("\n");
	var blob = new Blob([csvContent], {
		type: "application/csv;charset=utf-8;"
	});
	if (window.navigator.msSaveBlob) {
		// FOR IE BROWSER
		navigator.msSaveBlob(blob, filename);
	} else {
		// FOR OTHER BROWSERS
		var link = document.createElement("a");
		var csvUrl = URL.createObjectURL(blob);
		link.href = csvUrl;
		link.style = "visibility:hidden";
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}


function copyTableToClipboard(elementId) {
	var copyStr = "";
	var content = getTableContent($("#" + elementId).DataTable());
	var language = window.navigator.userLanguage || window.navigator.language || "en";
	for (var i = 0; i < content.length; i++) {
		for (var j = 0; j < content[i].length; j++) {
			let num = parseFloat(content[i][j]);
			if (!isNaN(num)) {
				content[i][j] = num.toLocaleString(language);
			}
		}
		copyStr += content[i].join("\t") + "\n";
	}
	copyToClipboard(copyStr);
	UI.sendFeedbackDialog("Table has been copied to clipboard");
}


function exportTableToCSV(elementId, filename) {
	var content = getTableContent($("#" + elementId).DataTable());
	makeAndDownloadCSV(content, filename);
}


function createIconLabelSpan(icon, label, cls) {
	return '<span class="input-with-icon ' + cls + '" style="background-image: url(' + icon + ')">' + label + '</span>';
}


function _renderAutocompletePokemonItem(ul, item) {
	return $("<li>")
		.append("<div>" + createIconLabelSpan(item.icon, item.label, 'species-input-with-icon') + "</div>")
		.appendTo(ul);
}


function _renderAutocompleteMoveItem(ul, item) {
	return $("<li>")
		.append("<div>" + createIconLabelSpan(item.icon, item.label, 'move-input-with-icon') + "</div>")
		.appendTo(ul);
}


function createMasterSummaryTable(battles, metrics) {
	var table = createElement('table', '<thead></thead><tfoot></tfoot><tbody></tbody>', {
		width: '100%', id: 'MasterSummaryTable', cellspacing: '0', class: 'display nowrap'
	});
	var headers = ['#'].concat(Object.values(metrics)).concat(["Detail"]);
	table.children[0].appendChild(createRow(headers, "th"));
	table.children[1].appendChild(createRow(headers, "th"));
	for (var i = 0; i < battles.length; i++) {
		let sim = battles[i];
		var rowData = [i + 1];
		for (var metric in metrics) {
			if (metric[0] == '*') {
				metric = metric.slice(1);
				var pkmInfo = getPokemonConfig(sim.input, metric.split('.')[0]);
				var attr = metric.split('.')[1];
				if (attr == 'name') {
					let pkmData = GM.get("pokemon", pkmInfo.name) || {};
					rowData.push(createIconLabelSpan(pkmData.icon, pkmInfo.label || pkmData.label, 'species-input-with-icon'));
				} else if (attr == 'fmove' || attr == 'cmove' || attr == 'cmove2') {
					var move = GM.get("fast", pkmInfo[attr]) || GM.get("charged", pkmInfo[attr]) || {};
					rowData.push(createIconLabelSpan(move.icon, move.label, 'move-input-with-icon'));
				} else {
					rowData.push(pkmInfo[attr]);
				}
			} else if (metric == 'weather') {
				rowData.push(sim.input.weather);
			} else {
				let cellData = sim.output.statistics[metric];
				if (typeof cellData == typeof 0) {
					if (metric == "win") {
						if (sim.input.aggregation == "enum") {
							rowData.push(cellData == 1 ? "Win" : "Lose");
						} else {
							rowData.push(round(cellData * 100, 2) + "%");
						}
					} else {
						rowData.push(round(cellData, 2));
					}
				} else {
					rowData.push(cellData);
				}
			}
		}
		rowData.push("<a style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>");
		var rowEl = createRow(rowData, "td");
		rowEl.lastChild.onclick = function () {
			UI.updateSimulationDetails(sim);
			document.getElementById('feedback_table2').scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
		}
		table.children[2].appendChild(rowEl);
	}
	return table;
}


function createPlayerStatisticsString(playerStat) {
	var pString = playerStat.name;
	pString += ", TDO: " + round(playerStat.tdo, 2);
	pString += ", DPS: " + round(playerStat.dps, 2);
	return pString;
}


function createPokemonStatisticsTable(pokemonStatistics) {
	var table = document.createElement("table");
	table.appendChild(createRow(["<img src='" + getPokemonIcon() + "'></img>",
		"HP", "Energy", "TDO", "Duration", "DPS", "Detail"], 'th'));
	for (var i = 0; i < pokemonStatistics.length; i++) {
		let statistics = pokemonStatistics[i];
		let species = GM.get("pokemon", statistics.name.toLowerCase());
		let row = createRow([
			"<img src='" + species.icon + "' class='apitem-pokemon-icon'></img>",
			statistics.hp, statistics.energy, statistics.tdo, round(statistics.duration, 2), round(statistics.dps, 2),
			"<a style='cursor: pointer'><i class='fa fa-info-circle' aria-hidden='true'></i></a>"
		], 'td');
		row.lastChild.children[0].onclick = function () {
			var pokemonDialog = createElement('div', '', { title: 'Pokemon Detail' });
			var pokemonTable = createElement('table', '');
			for (var attr in statistics) {
				pokemonTable.appendChild(createElement('tr', "<th>" + attr + "</th><td>" + statistics[attr] + "</td>"));
			}
			pokemonDialog.appendChild(pokemonTable);
			$(pokemonDialog).dialog({
				width: 400,
				position: { my: "center", at: "center", 'of': row }
			}).dialog('open');
		};
		table.appendChild(row);
	}
	return table;
}





function createBattleLogTable(battle) {
	let log = battle.output.battleLog;
	var table = createElement('table', '<thead></thead>', {
		width: '100%', class: 'display nowrap'
	});
	let headers = ["Time"];
	for (let i = 0; i < log[0].events.length; i++) {
		headers.push("Player " + (i + 1));
	}
	table.children[0].appendChild(createRow(headers, "th"));
	var tbody = createElement("tbody");
	for (let i = 0; i < log.length; i++) {
		let entry = log[i];
		let tableRow = createElement("tr");
		tableRow.appendChild(createElement("td", round(entry.t / 1000, 2)));
		for (let j = 0; j < entry.events.length; j++) {
			let tableCell = createElement("td");
			let singleEvent = entry.events[j] || { index: 0, options: [{ text: "" }] };
			if (singleEvent.options.length > 1) {
				let selectElement = createElement("select");
				for (let k = 0; k < singleEvent.options.length; k++) {
					let option = singleEvent.options[k];
					let optionEl = createElement("option", option.text);
					optionEl.value = k;
					if (option.style == "pokemon") {
						optionEl.dataset.class = "input-with-icon species-input-with-icon";
						optionEl.dataset.style = "background-image: url(" + option.icon + ");"
					} else if (option.style == "move") {
						optionEl.dataset.class = "input-with-icon move-input-with-icon";
						optionEl.dataset.style = "background-image: url(" + option.icon + ");"
					}
					selectElement.appendChild(optionEl);
				}
				selectElement.value = singleEvent.index;
				tableCell.appendChild(selectElement);
				$(selectElement).iconselectmenu({
					change: function (event, ui) {
						singleEvent.index = ui.item.index;
						entry.breakpoint = true;
						App.onBattleLogChange(battle);
					}
				}).iconselectmenu("menuWidget").addClass("ui-menu-icons");
			} else {
				let curOption = singleEvent.options[singleEvent.index];
				if (curOption.style == "pokemon") {
					tableCell.innerHTML = createIconLabelSpan(curOption.icon, curOption.text, "species-input-with-icon");
				} else if (curOption.style == "move") {
					tableCell.innerHTML = createIconLabelSpan(curOption.icon, curOption.text, "move-input-with-icon");
				} else {
					tableCell.innerHTML = curOption.text;
				}
			}
			tableCell.setAttribute('style', 'background:' + HSL_COLORS[j % HSL_COLORS.length][0]);
			tableRow.appendChild(tableCell);
		}
		tbody.appendChild(tableRow);
	}
	table.appendChild(tbody);
	return table;
}


