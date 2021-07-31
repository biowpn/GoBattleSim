
function battleMatrixInit() {
    $("#inputBattleMatrixFile").on("change", onFileImport);
    $("#buttonGo").on("click", onGo);
}

function parseCSVRow(str, deli, echar) {
    var data = [];
    var word = "";
    var escaped = false;
    for (var i = 0; i < str.length; i++) {
        if (str[i] == echar) {
            if (escaped) {
                data.push(word);
                word = "";
                escaped = false;
                ++i;
            } else {
                escaped = true;
            }
        } else if (str[i] == deli && !escaped) {
            data.push(word);
            word = "";
        } else {
            word += str[i];
        }
    }
    data.push(word);
    return data;
}

function parseCSVMatrix(str) {
    var rows = [];
    var lines = str.trim().split("\n");
    var deli = lines[0].includes('\t') ? '\t' : ',';
    var names = parseCSVRow(lines[0], deli, '"');
    if (names.length < 2) {
        console.error("Bad input: first row is invalid or empty");
        return;
    }
    for (var i = 1; i < lines.length; i++) {
        var row = parseCSVRow(lines[i], deli, '"');
        if (row[0] != names[i]) {
            console.error("Names mismatch for row:");
            console.error(row);
            break;
        }
        var rowf = row.slice(1).map(parseFloat);
        rows.push(rowf);
    }
    return {
        "names": names.slice(1),
        "matrix": rows
    };
}

function transformToZeroSumMatrix(matrix) {
    // we want matrix[i][j] + matrix[j][i] = 0
    var n = matrix.length;
    for (var i = 0; i < n; ++i) {
        for (var j = i; j < n; ++j) {
            var avg = (matrix[i][j] + matrix[j][i]) / 2;
            matrix[i][j] -= avg;
            matrix[j][i] -= avg;
        }
    }
    return matrix;
}

function removeArrayElements(arr, indices) {
    var arr2 = JSON.parse(JSON.stringify(arr));
    for (var i = 0; i < indices.length; ++i) {
        arr2[indices[i]] = null;
    }
    return arr2.filter(x => x != null);
}

function removeMatrixRowsAndColumns(mat, indices) {
    var mat2 = JSON.parse(JSON.stringify(mat));
    for (var i = 0; i < indices.length; ++i) {
        mat2[indices[i]] = null;
    }
    mat2 = mat2.filter(x => x != null);
    for (var i = 0; i < mat2.length; ++i) {
        mat2[i] = removeArrayElements(mat2[i], indices);
    }
    return mat2;
}

function getAllDominators(index, dominators) {
    var output = [];
    var stack = [index];
    while (stack.length > 0) {
        var i = stack.pop();
        var direct_dominators = dominators[i] || [];
        for (let j of direct_dominators) {
            if (output.indexOf(j) == -1) {
                output.push(j);
                stack.push(j);
            }
        }
    }
    return output;
}


function solvePvPMeta(matrix, names) {
    var game = new Game();
    game.new(matrix);
    game.solve();
    var weights = game.optstrat(true);
    var entries = weights.map((v, i) => [i, names[i], v]); // (index, name, weight)
    entries.sort((a, b) => b[2] - a[2]);
    entries = entries.filter(x => x[2] > 0);
    return entries;
}

function makeDominatorTierList(matrix, names, num_tiers) {
    // convert to zero-sum matrix
    matrix = transformToZeroSumMatrix(JSON.parse(JSON.stringify(matrix)));

    var metas = [] // meta composition for each tier as list of (index, name, weight)
    var dominators = {}; // dominators[i]: all dominators for Pokemon i
    var names_in_meta = new Set(); // mons included in the metas
    var name_to_index = {}; // boring name-to-index mapping
    for (var i = 0; i < names.length; ++i) {
        name_to_index[names[i]] = i;
    }

    for (var tier = 0; tier < num_tiers; ++tier) {
        var meta_curr = [];
        if (tier == 0) {
            // solve for tier 1 directly
            meta_curr = solvePvPMeta(matrix, names);
            metas.push(meta_curr);
            for (let entry of meta_curr) {
                names_in_meta.add(entry[1]);
            }
            continue;
        }
        // solve for tier N (N >= 2)
        var meta_prev = metas[tier - 1];
        for (let entry of meta_prev) {
            // remove a previous meta mon and all its dominators from pool
            var pkm_idx = entry[0];
            var pkm_dominators = [pkm_idx] + getAllDominators(pkm_idx, dominators);
            var names_reduced = removeArrayElements(names, pkm_dominators);
            var matrix_reduced = removeMatrixRowsAndColumns(matrix, pkm_dominators);
            if (names_reduced.length == 0) {
                continue;
            }
            // solve for the reduced meta
            var meta_reduced = solvePvPMeta(matrix_reduced, names_reduced);
            for (let entry2 of meta_reduced) {
                var name2 = entry2[1];
                if (names_in_meta.has(name2)) {
                    // mon already in the current or previous meta(s)
                    continue;
                }
                var idx = name_to_index[name2];
                // add the new mon to the current meta
                meta_curr.push([idx, name2, entry2[2]]);
                names_in_meta.add(name2);
                // add `pkm_idx` to the its dominator list
                dominators[idx] = dominators[idx] || [];
                if (dominators[idx].indexOf(pkm_idx) == -1) {
                    dominators[idx].push(pkm_idx);
                }
            }
        }
        if (meta_curr.length == 0) {
            break;
        }
        meta_curr.sort((a, b) => b[2] - a[2]);
        metas.push(meta_curr);
    }
    return {
        "metas": metas,
        "dominators": dominators
    };
}

function displayOutputTierList(tiers) {
    for (var i = 0; i < tiers.length; ++i) {
        var meta = tiers[i];
        var tbody = $("#outputTier" + (i + 1).toString()).find('tbody');
        tbody.empty();

        for (let entry of meta) {
            var name = entry[1];
            var weight = (entry[2] * 100).toFixed(2) + "%";
            tbody.append($("<tr>").append($("<td>").text(name)).append($("<td>").text(weight)));
        }
    }
}

function displayDominators(dominators, names) {
    var list = $("#outputDominators");
    list.empty();
    for (var i in dominators) {
        var direct_dominators = dominators[i];
        var dominatee = names[i];
        for (let j of direct_dominators) {
            var dominator = names[j];
            var line = "[" + dominatee + "] is dominated by [" + dominator + "]";
            list.append($("<li>").text(line));
        }
    }
}

async function onFileImport() {
    var file = $("#inputBattleMatrixFile").prop("files")[0];
    var content = await file.text();
    $("#inputBattleMatrix").prop("value", content);
}

function onGo() {
    // parse input
    var content = $("#inputBattleMatrix").prop("value");
    res = parseCSVMatrix(content);
    if (res == null) {
        return;
    }
    var matrix = res.matrix;
    var names = res.names;

    // do the main work
    res = makeDominatorTierList(matrix, names, 3);
    var metas = res.metas;
    var dominators = res.dominators;

    // dump output
    displayOutputTierList(metas);
    displayDominators(dominators, names);
}
