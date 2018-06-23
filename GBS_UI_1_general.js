/* GBS_UI_1_general.js */

var LOGICAL_OPERATORS = {
	',': 0,	':': 0, ';': 0, // OR
	'&': 1, '|': 1, // AND
	'!': 2 // NOT
};
var SELECTORS = ['*', '?'];
var acceptedNumericalAttributes = [
	'cp','atkiv','defiv','stmiv','level','dex',
	'baseAtk','baseDef','baseStm', 'rating',
	'power', 'duration', 'dws', 'energyDelta', 'value'
];

var DialogStack = [];


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

function leftMerge(objL, objR, attrs){
	if (attrs){
		attrs.forEach(function(attr){
			objL[attr] = objR[attr];
		});
			
	}else{
		for (var attr in objR)
			objL[attr] = objR[attr];
	}
}

// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function jsonToURI(json){ return encodeURIComponent(JSON.stringify(json)); }

function uriToJSON(urijson){ return JSON.parse(decodeURIComponent(urijson)); }



function Predicate(pd){
	if (typeof pd == typeof "")
		return createComplexPredicate(pd);
	else
		return pd;
}

function parseNumericalRange(str){
	if (!isNaN(parseFloat(str))){
		return ['value', str];
	}
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
	}else if (Data.TypeEffectiveness.hasOwnProperty(str.toLowerCase()) || str.toLowerCase() == 'none'){ // Match types
		const str_const = str.toLowerCase();
		return function(obj){
			return ([obj.pokeType, obj.pokeType1, obj.pokeType2].includes(str_const));
		};
	}else if (str[0] == '@'){ // Match moves
		str = str.slice(1).toLowerCase();
		if (str.substring(0,3) == '<f>'){
			const str_const = str.slice(3).trim();
			return function(obj){
				var fmove = Data.FastMoves[obj.fmove_index] || (typeof obj.fmove == typeof "" ? getEntry(obj.fmove, Data.FastMoves) : obj.fmove);
				if (fmove){
					return fmove.name.includes(str_const) || fmove.pokeType == str_const;
				}
				return false;
			};
		}else if (str.substring(0,3) == '<c>'){
			const str_const = str.slice(3).trim();
			return function(obj){
				var cmove = Data.ChargedMoves[obj.cmove_index] || (typeof obj.cmove == typeof "" ? getEntry(obj.cmove, Data.ChargedMoves) : obj.cmove);
				if (cmove){
					return cmove.name.includes(str_const) || cmove.pokeType == str_const;
				}
				return false;
			};
		}else if (str.substring(0,3) == '<*>'){
			const pred_f = createSimplePredicate('@<f>' + str.slice(3)), pred_c = createSimplePredicate('@<c>' + str.slice(3));
			return function(obj){
				return pred_f(obj) && pred_c(obj);
			};
		}else{
			const pred_f = createSimplePredicate('@<f>' + str), pred_c = createSimplePredicate('@<c>' + str);
			return function(obj){
				return pred_f(obj) || pred_c(obj);
			};
		}
	}else if (str[0] == '$'){ // Box
		const str_const = str.slice(1).trim();
		return function(obj){
			return obj.box_index >= 0 && (!str_const || obj.nickname.includes(str_const));
		};
	}else if (str[0] == '%'){ // Raid Boss
		const str_const = str.slice(1);
		return function(obj){
			return obj.marker_1 && obj.marker_1.includes(str_const);
		};
	}else if (str[0] == '>'){ // Cutomized expression
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

function parseNextToken(expression){
	var position = 0, token = '', hasEscaped = false, startsWithWhiteSpace = true;
	while(position < expression.length){
		var c = expression[position];
		if (c == '^'){
			if (hasEscaped){
				c += '^';
				hasEscaped = false;
			}else{
				hasEscaped = true;
			}
		}else if (c == '(' || c == ')' || LOGICAL_OPERATORS.hasOwnProperty(c)){
			if (startsWithWhiteSpace || hasEscaped)
				token += c;
			if (!hasEscaped)
				break;
			hasEscaped = false;
		}else{
			token += c;
			hasEscaped = false;
			if (c != ' ')
				startsWithWhiteSpace = false;
		}
		position++;
	}
	return {
		'token': token,
		'expression': expression.slice(Math.max(position, token.length))
	};
}

function createComplexPredicate(expression){
	var tokensArr = [], stack = [];
	expression = expression.trim();
	
	// 1. Convert infix to postfix
	while (expression.length > 0){
		var parsedResult = parseNextToken(expression);
		var token = parsedResult.token.trim();
		expression = parsedResult.expression;

		if (token == '('){
			stack.push(token);
		}else if (token == ')'){
			while (stack.length && stack[stack.length-1] != '(')
				tokensArr.push(stack.pop());
			stack.pop();
		}else if (LOGICAL_OPERATORS.hasOwnProperty(token)){
			while(stack.length && stack[stack.length-1] != '(' && LOGICAL_OPERATORS[token] <= LOGICAL_OPERATORS[stack[stack.length-1]])
				tokensArr.push(stack.pop());
			stack.push(token);
		}else
			tokensArr.push(token);
	}
	while (stack.length > 0){
		tokensArr.push(stack.pop());
	}

	// 2. Evaluate the postfix expression using a stack
	for (var i = 0; i < tokensArr.length; i++){
		var token = tokensArr[i];
		if (LOGICAL_OPERATORS.hasOwnProperty(token)){
			const pred1 = stack.pop();
			if (token == ',' || token == ':' || token == ';'){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) || pred2(obj);
				});
			}else if (token == '&' || token == '|'){
				const pred2 = stack.pop();
				stack.push(function(obj){
					return pred1(obj) && pred2(obj);
				});
			}else if (token == '!'){
				stack.push(function(obj){
					return !pred1(obj);
				});
			}
		}else{
			stack.push(createSimplePredicate(token));
		}
	}
	
	if (stack.length > 0)
		return stack[0];
	else
		return function(obj){return true;}
}



function getPokemonOptions(userIndex){
	var speciesOptions = [];
	if (0 <= userIndex && userIndex < Data.Users.length){
		var userBox = Data.Users[userIndex].box;
		for (var i = 0; i < userBox.length; i++){
			userBox[i].box_index = i;
			userBox[i].label = '$ ' + userBox[i].nickname;
			speciesOptions.push(userBox[i]);
		}
	}
	return speciesOptions.concat(Data.Pokemon);
}

function markMoveDatabase(moveType, species_idx){
	var prefix = (moveType == 'f' ? 'fast' : 'charged');
	var pkm = Data.Pokemon[species_idx];
	Data[toTitleCase(prefix) + 'Moves'].forEach(function(move){
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


function autocompletePokemonNodeSpecies(speciesInput){
	$( speciesInput ).autocomplete({
		minLength : 0,
		delay : 200,
		source : function(request, response){
			var user_idx = 0;
			for (var i = 0; i < this.bindings.length; i++){
				if (this.bindings[i].id && this.bindings[i].id.includes('species_')){
					thisAddress = this.bindings[i].id.split('_')[1];
					user_idx = parseInt(thisAddress.split('-')[0]);
					if (thisAddress == 'd'){
						user_idx = 0;
					}else if (isNaN(user_idx)){
						user_idx = -1;
					}
					break;
				}
			}
			var searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term), matches = [];
			try{
				matches = getPokemonOptions(user_idx).filter(createComplexPredicate(searchStr));
			}catch(err){
			}
			response(matches);
		},
		select : function(event, ui){
			var pkmInfo = ui.item, thisAddress = this.id.split('_')[1];
			if (pkmInfo.box_index >= 0){
				var thisPokemonNode = document.getElementById('ui-pokemon_' + thisAddress);
				var user_idx = parseInt(thisAddress.split('-')[0]);
				try{
					if (!isNaN(user_idx)){
						writeAttackerNode(thisPokemonNode, Data.Users[user_idx].box[pkmInfo.box_index]);
					}else if (thisAddress == 'd'){
						writeDefenderNode(thisPokemonNode, Data.Users[0].box[pkmInfo.box_index]);
					}
				}catch(err){}
			}
			this.setAttribute('index', getEntryIndex(pkmInfo.name, Data.Pokemon));
			this.setAttribute('box_index', pkmInfo.box_index);
			this.setAttribute('style', 'background-image: url(' + pkmInfo.icon + ')');
			if (thisAddress == 'd' && $("#battleMode").val() == 'raid'){
				var pkm = Data.Pokemon[this.getAttribute("index")];
				if (pkm && pkm.marker_1){
					$( "#raidTier" ).val(parseInt(pkm.marker_1.split(" ")[0]) || 5);
				}
			}
		},
		change : function (event, ui){
			if (!ui.item){ // Change not due to selecting an item from menu
				var idx = getEntryIndex(this.value.toLowerCase(), Data.Pokemon);
				this.setAttribute('index', idx);
				this.setAttribute('box_index', -1);
				this.setAttribute('style', 'background-image: url(' + getPokemonIcon({index: idx}) + ')');
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompletePokemonItem;
	
	// speciesInput.onfocus = function(){$(this).autocomplete("search", "");} // This line of cope is causing page to freeze
}

function autocompletePokemonNodeMoves(moveInput){
	$( moveInput ).autocomplete({
		minLength : 0,
		delay : 0,
		source: function(request, response){
			var moveType = '', address = '';
			for (var i = 0; i < this.bindings.length; i++){
				if (this.bindings[i].id && this.bindings[i].id.includes('move_')){
					moveType = this.bindings[i].id[0];
					address = this.bindings[i].id.split('_')[1];
					break;
				}
			}
			var idx = parseInt($('#ui-species_' + address)[0].getAttribute('index'));
			var searchStr = (SELECTORS.includes(request.term[0]) ? request.term.slice(1) : request.term), matches = [];
			markMoveDatabase(moveType, idx);
			if (searchStr == '' && idx >= 0) //special case
				searchStr = 'current,legacy,exclusive';
			try{
				matches = (moveType == 'f' ? Data.FastMoves : Data.ChargedMoves).filter(Predicate(searchStr));
			}catch(err){matches = [];}
			response(matches);
		},
		select : function(event, ui) {
			var moveType = this.id[0];
			this.setAttribute('index', getEntryIndex(ui.item.name.toLowerCase(), (moveType == 'f' ? Data.FastMoves : Data.ChargedMoves)));
			this.setAttribute('style', 'background-image: url(' + ui.item.icon + ')');
		},
		change : function(event, ui) {
			if (!ui.item){ // Change not due to selecting an item from menu
				var moveType = this.id[0];
				var idx = getEntryIndex(this.value, (moveType == 'f' ? Data.FastMoves : Data.ChargedMoves));
				this.setAttribute('index', idx);
				this.setAttribute('style', 'background-image: url(' + getTypeIcon({mtype: moveType, index: idx}) + ')');
			}
		}
	}).autocomplete( "instance" )._renderItem = _renderAutocompleteMoveItem;
	
	moveInput.onfocus = function(){$(this).autocomplete("search", "");};
}


function addFilterToFooter(table){
	table.columns().flatten().each(function (colIdx){
		table.column(colIdx).footer().innerHTML = "";
		var select = $('<select />')
			.appendTo(
				table.column(colIdx).footer()
			)
			.on( 'change', function (){
				table.column( colIdx ).search( $(this).val() ).draw();
			});
		
		select.append( $("<option value=' '>*</option>") );
		table.column( colIdx ).cache( 'search' ).sort().unique()
			.each( function ( d ) {
				var op = document.createElement('option');
				op.value = d;
				op.innerHTML = d;
				select.append(op);
			});
	});
}


function sendFeedback(msg, appending, feedbackElementId){
	var feedbackEl = document.getElementById(feedbackElementId || "feedback_message");
	if (feedbackEl){
		if (appending){
			feedbackEl.innerHTML += '<p>' + msg + '</p>';
		}else
			feedbackEl.innerHTML = '<p>' + msg + '</p>';
	}
}

function sendFeedbackDialog(msg, dialogTitle){
	var d = $(createElement('div', msg, {
		title: dialogTitle || document.title
	})).dialog({
		buttons: {
			"OK": function(){
				$(this).dialog("close");
			}
		}
	});
	DialogStack.push(d);
	return d;
}


function createIconLabelDiv(iconURL, label, iconClass){
	return "<div><span class='" + iconClass + "'>" + "<img src='"+iconURL+"'></img></span><span class='apitem-label'>" + label + "</span></div>";
}

function createIconLabelDiv2(iconURL, label, iconClass){
	return "<div class='input-with-icon " + iconClass + "' style='background-image: url(" + iconURL + ")'>" + label + "</div>";
}

function _renderAutocompletePokemonItem(ul, item){
    return $( "<li>" )
        .append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-pokemon-icon') + "</div>" )
        .appendTo( ul );
}

function _renderAutocompleteMoveItem(ul, item){
    return $( "<li>" )
		.append( "<div>" + createIconLabelDiv(item.icon, item.label, 'apitem-move-icon') + "</div>" )
        .appendTo( ul );
}