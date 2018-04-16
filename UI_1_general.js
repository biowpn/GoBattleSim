/* UI_1_general.js */

const LOGICAL_OPERATORS = {
	',': 0,	'&': 1,	'!': 2
};
const SELECTORS = ['*', '?'];
const acceptedNumericalAttributes = [
	'cp','atkiv','defiv','stmiv','level', 'maxhp','dex',
	'baseAtk','baseDef','baseStm', 'rating',
	'power', 'duration', 'dws', 'energyDelta', 'value'
];



function createElement(type, innerHTML, attrsAndValues){
	var e = document.createElement(type);
	e.innerHTML = innerHTML;
	for (var attr in attrsAndValues){
		e.setAttribute(attr, attrsAndValues[attr]);
	}
	return e;
}

function createRow(rowData, type){
	type = type || "td";
	var row = document.createElement("tr");
	for (var i = 0; i < rowData.length; i++){
		var d = document.createElement(type);
		d.innerHTML = rowData[i];
		row.appendChild(d);
	}
	return row;
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function copyAllInfo(obj_to, obj_from, minimized){
	if (minimized){
		['species','copies','level','atkiv','defiv','stmiv','fmove','cmove','dodge'].forEach(function(attr){
			obj_to[attr] = obj_from[attr];
		});
	}else{
		for (var attr in obj_from)
			obj_to[attr] = obj_from[attr];
	}
}

function jsonToURI(json){ return encodeURIComponent(JSON.stringify(json)); }

function uriToJSON(urijson){ return JSON.parse(decodeURIComponent(urijson)); }

function exportConfigToUrl(cfg){
	var cfg_min = {
		atkrSettings: [], dfdrSettings: {},
		generalSettings: JSON.parse(JSON.stringify(cfg.generalSettings))
	};
	for (var i = 0; i < cfg.atkrSettings.length; i++){
		cfg_min.atkrSettings.push({party_list: []});
		for (var j = 0; j < cfg.atkrSettings[i].party_list.length; j++){
			cfg_min.atkrSettings[i].party_list.push({pokemon_list: []});
			if (cfg.atkrSettings[i].party_list[j].revive_strategy)
				cfg_min.atkrSettings[i].party_list[j].revive_strategy = cfg.atkrSettings[i].party_list[j].revive_strategy;
			for (var k = 0; k < cfg.atkrSettings[i].party_list[j].pokemon_list.length; k++){
				var pkm_min = {};
				copyAllInfo(pkm_min, cfg.atkrSettings[i].party_list[j].pokemon_list[k], true);
				for (var attr in pkm_min){
					if (pkm_min[attr] == DEFAULT_ATTACKER_INPUT_MIN[attr])
						delete pkm_min[attr];
				}
				cfg_min.atkrSettings[i].party_list[j].pokemon_list.push(pkm_min);
			}
		}
	}
	copyAllInfo(cfg_min.dfdrSettings, cfg.dfdrSettings, true);
	cfg_min.dfdrSettings.raid_tier = cfg.dfdrSettings.raid_tier;
	delete cfg_min.dfdrSettings.copies;
	delete cfg_min.dfdrSettings.dodge;
	if (cfg_min.dfdrSettings.raid_tier > 0){
		delete cfg_min.dfdrSettings.level;
		delete cfg_min.dfdrSettings.atkiv;
		delete cfg_min.dfdrSettings.defiv;
		delete cfg_min.dfdrSettings.stmiv;
	}
	
	delete cfg_min.generalSettings.logStyle;
	for (var attr in cfg_min.generalSettings){
		if (cfg_min.generalSettings[attr] == DEFAULT_GENERAL_SETTING_INPUT_MIN[attr])
			delete cfg_min.generalSettings[attr];
	}
	
	return jsonToURI(cfg_min);
}

function parseConfigFromUrl(url){
	var cfg = uriToJSON(url);
	for (var i = 0; i < cfg.atkrSettings.length; i++){
		for (var j = 0; j < cfg.atkrSettings[i].party_list.length; j++){
			cfg.atkrSettings[i].party_list[j].revive_strategy = cfg.atkrSettings[i].party_list[j].revive_strategy || false;
			for (var k = 0; k < cfg.atkrSettings[i].party_list[j].pokemon_list.length; k++){
				var pkm = cfg.atkrSettings[i].party_list[j].pokemon_list[k];
				for (var attr in DEFAULT_ATTACKER_INPUT_MIN){
					if (!pkm.hasOwnProperty(attr))
						pkm[attr] = DEFAULT_ATTACKER_INPUT_MIN[attr];
				}
			}
		}
	}
	for (var attr in DEFAULT_GENERAL_SETTING_INPUT_MIN){
		if (!cfg.generalSettings.hasOwnProperty(attr))
			cfg.generalSettings[attr] = DEFAULT_GENERAL_SETTING_INPUT_MIN[attr];
	}
	return cfg;
}


function parseNumericalRange(str){
	for (var i = 0; i < acceptedNumericalAttributes.length; i++){
		var attr = acceptedNumericalAttributes[i];
		if (str.substring(0, attr.length) == attr.toLowerCase())
			return [attr, str.slice(attr.length)];
	};
	return ['', str];
}

function createSimplePredicate(str){
	str = str.trim();
	
	var numericalParameters = parseNumericalRange(str.toLowerCase());
	if (numericalParameters[0] != ''){ // Match numerical attributes
		var bounds = numericalParameters[1].split((numericalParameters[1].includes('~') ? '~' : '-'));
		const attr = numericalParameters[0], LBound = parseFloat(bounds[0]) || -1000000, UBound = parseFloat(bounds[bounds.length-1]) || 1000000;
		return function(obj){
			return LBound <= obj[attr] && obj[attr] <= UBound;
		};
	}else if (POKEMON_TYPE_ADVANTAGES.hasOwnProperty(str.toLowerCase()) || str.toLowerCase() == 'none'){ // Match types
		const str_const = str.toLowerCase();
		return function(obj){
			return ([obj.pokeType, obj.pokeType1, obj.pokeType2].includes(str_const));
		};
	}else if (str[0] == '@'){ // Match moves
		str = str.slice(1).toLowerCase();
		if (str.substring(0,3) == '<f>'){
			const str_const = str.slice(3);
			return function(obj){
				if (typeof obj.fmove_index == typeof 0 && obj.fmove_index >= 0){
					var fmove = FAST_MOVE_DATA[obj.fmove_index];
					return fmove.name.includes(str_const) || fmove.pokeType == str_const;
				}
				return false;
			};
		}else if (str.substring(0,3) == '<c>'){
			const str_const = str.slice(3);
			return function(obj){
				if (typeof obj.cmove_index == typeof 0 && obj.cmove_index >= 0){
					var cmove = CHARGED_MOVE_DATA[obj.cmove_index];
					return cmove.name.includes(str_const) || cmove.pokeType == str_const;
				}
				return false;
			};
		}else{
			const pred_f = createSimplePredicate('@<f>' + str), pred_c = createSimplePredicate('@<c>' + str);
			return function(obj){
				return pred_f(obj) || pred_c(obj);
			};
		}
	}else if (str[0] == '$'){ // Box
		return function(obj){
			return obj.box_index >= 0;
		};
	}else if (str[0] == '%'){ // Raid Boss
		const str_const = str.slice(1);
		return function(obj){
			return obj.marker_1.includes(str_const);
		};
	}else if (str[0] == '?'){ // Cutomized expression
		const str_const = str.slice(1);
		return function(obj){
			return eval(str_const);
		};
	}else{ // Match name/nickname/species
		const str_const = str.toLowerCase();
		return function(obj){
			if (obj.name && obj.name.includes(str_const))
				return true;
			if (obj.marker && obj.marker.includes(str_const))
				return true;
			return obj.label && obj.label.toLowerCase().includes(str_const);
		}
	}
}

function createComplexPredicate(str){
	var tokensArr = [], stack = [], tempStr = '';
	
	// 1.Infix to Postfix
	for (var i = 0; i < str.length; i++){
		if (str[i] == '('){
			if (tempStr = tempStr.trim()){
				tokensArr.push(tempStr);
				tempStr = '';
			}
			stack.push(str[i]);
		}else if (str[i] == ')'){
			if (tempStr = tempStr.trim()){
				tokensArr.push(tempStr);
				tempStr = '';
			}
			while (stack[stack.length-1] != '(')
				tokensArr.push(stack.pop());
			stack.pop();
		}else if (str[i] in LOGICAL_OPERATORS){
			if (tempStr = tempStr.trim()){
				tokensArr.push(tempStr);
				tempStr = '';
			}
			while(stack.length && stack[stack.length-1] != '(' && LOGICAL_OPERATORS[str[i]] <= LOGICAL_OPERATORS[stack[stack.length-1]])
				tokensArr.push(stack.pop());
			stack.push(str[i]);
		}else
			tempStr += str[i];
	}
	if (tempStr = tempStr.trim()){
		tokensArr.push(tempStr);
	}
	while (stack.length > 0){
		tokensArr.push(stack.pop());
	}

	// 2. Evaluate the stack
	stack = [];
	for (var i = 0; i < tokensArr.length; i++){
		if (!(tokensArr[i] in LOGICAL_OPERATORS))
			tokensArr[i] = createSimplePredicate(tokensArr[i]);
	}
	for (var i = 0; i < tokensArr.length; i++){
		if (tokensArr[i] in LOGICAL_OPERATORS){
			const pred1 = stack.pop();
			if (tokensArr[i] == ','){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) || pred2(obj);
				});
			}else if (tokensArr[i] == '&'){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) && pred2(obj);
				});
			}else if (tokensArr[i] == '!'){
				stack.push(function(obj){
					return !pred1(obj);
				});
			}
		}else{
			stack.push(tokensArr[i]);
		}
	}
	
	if (stack.length > 0)
		return stack[0];
	else
		return function(obj){return true;}
}

function universalGetter(expression, Space){
	var result = [];
	pred = createComplexPredicate(expression);
	Space.forEach(function(obj){
		if (pred(obj))
			result.push(obj);
	});
	return result;
}

function getPokemonSpeciesOptions(userIndex){
	userIndex = userIndex || 0;
	var speciesOptions = [];
	if (0 <= userIndex && userIndex < USERS_INFO.length){
		var userBox = USERS_INFO[userIndex].box;
		for (var i = 0; i < userBox.length; i++){
			userBox[i].box_index = i;
			userBox[i].label = '$ ' + userBox[i].nickname;
			speciesOptions.push(userBox[i]);
		}
	}
	POKEMON_SPECIES_DATA.forEach(function(pkm){
		speciesOptions.push(pkm);
	});
	return speciesOptions;
}

function markMoveDatabase(moveType, species_idx){
	var moveDatabase = (moveType == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	var prefix = (moveType == 'f' ? 'fast' : 'charged'), pkm = POKEMON_SPECIES_DATA[species_idx];
	moveDatabase.forEach(function(move){
		move.marker = 'all';
		if(pkm){
			if (move.pokeType == pkm.pokeType1 || move.pokeType == pkm.pokeType2)
				move.marker += ' stab';
			if (pkm[prefix + 'Moves'].includes(move.name))
				move.marker += ' current';
			if (pkm[prefix + 'Moves_legacy'].includes(move.name))
				move.marker += ' legacy';
			if (pkm[prefix + 'Moves_exclusive'].includes(move.name))
				move.marker += ' exclusive';
		}
	});
}

function send_feedback(msg, appending, feedbackDivId){
	var feedbackSection = document.getElementById(feedbackDivId || "feedback_message");
	if (feedbackSection){
		if (appending){
			feedbackSection.innerHTML += '<p>' + msg + '</p>';
		}else
			feedbackSection.innerHTML = '<p>' + msg + '</p>';
	}
}

function pokemon_icon_url_by_dex(dex){
	var dex_string = dex.toString();
	while (dex_string.length < 3)
		dex_string = "0" + dex_string;
	return "https://pokemongo.gamepress.gg/assets/img/sprites/" + dex_string + "MS.png";
}

function pokemon_icon_url_by_index(index){
	if (index >= 0)
		return POKEMON_SPECIES_DATA[index].icon;
	else
		return pokemon_icon_url_by_dex(0);
}

function poketype_icon_url_by_name(type){
	return "https://pokemongo.gamepress.gg/sites/pokemongo/files/icon_" + type.toLowerCase() + ".png";
}

function move_icon_url_by_index(type, index){
	var moveDatabase = (type == 'f' ? FAST_MOVE_DATA : CHARGED_MOVE_DATA);
	if (index >= 0)
		return moveDatabase[index].icon;
	else
		return '';
}

function createIconLabelDiv(iconURL, label, iconClass){
	return "<div><span class='" + iconClass + "'>" + "<img src='"+iconURL+"'></img></span><span class='apitem-label'>" + label + "</span></div>";
}

function createIconLabelDiv2(iconURL, label, iconClass){
	return "<div class='input-with-icon " + iconClass + "' style='background-image: url(" + iconURL + ")'>" + label + "</div>";
}

function manual_render_autocomplete_pokemon_item(ul, item){
    return $( "<li>" )
        .append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-pokemon-icon') + "</div>" )
        .appendTo( ul );
}

function manual_render_autocomplete_move_item(ul, item){
    return $( "<li>" )
		.append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-move-icon') + "</div>" )
        .appendTo( ul );
}