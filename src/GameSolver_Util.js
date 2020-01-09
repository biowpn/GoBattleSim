
/**
 * @file helper classes/functions for GameSolver wasm
 */

const SIZE_OF_DOUBLE = 8;
const SIZE_OF_POINTER = 4;


/**
 * allocate enough memory for a 1-D C-array and set its contents to @param arr.
 * 
 * @param {*} arr a 1-D array of doubles
 */
function create1DArray(arr) {
	var ptr = _malloc(arr.length * SIZE_OF_DOUBLE);
	for (let i = 0; i < arr.length; ++i) {
		setValue(ptr + i * SIZE_OF_DOUBLE, arr[i], "double");
	}
	return ptr;
}

/**
 * free memory for a 1-D C-array.
 * 
 * @param {*} ptr pointer to the 1-D array of doubles as return by create1DArray
 */
function free1DArray(ptr) {
	return _free(ptr);
}

/**
 * allocate enough memory for a 2-D C-array and set its contents to @param arr.
 * 
 * @param {*} arr a 2-D array of doubles
 */
function create2DArray(arr) {
	var ptr = _malloc(arr.length * SIZE_OF_POINTER);
	for (let i = 0; i < arr.length; ++i) {
		var ptr2 = create1DArray(arr[i]);
		setValue(ptr + i * SIZE_OF_POINTER, ptr2, '*');
	}
	return ptr;
}

/**
 * free memory for a 2-D C-array.
 * 
 * @param {*} ptr pointer to the 2-D array of doubles as return by create2DArray
 * @param {*} length first dimension length of the 2-D array
 */
function free2DArray(ptr, length) {
	for (let i = 0; i < length; ++i) {
		let ptr2 = getValue(ptr + i * SIZE_OF_POINTER, '*');
		free1DArray(ptr2);
	}
	_free(ptr);
}


/**
 * @class 2-player zero-sum Game
 */
function Game() {
	var __this__ = 0;
	var m_row = 0;
	var m_col = 0;

	this.new = function (matrix) {
		this.delete();
		let ptr = create2DArray(matrix);
		m_row = matrix.length;
		m_col = matrix[0].length;
		__this__ = Module.ccall("Game_new", "number", ["number", "number", "number"], [ptr, m_row, m_col]);
		free2DArray(ptr);
	};

	this.delete = function () {
		if (__this__) {
			Module.ccall("Game_delete", null, ["number"], [__this__]);
			__this__ = 0;
		}
	}

	this.solve = function () {
		if (__this__) {
			Module.ccall("Game_solve", null, ["number"], [__this__]);
		}
	}

	this.optstrat = function (p1) {
		if (__this__) {
			let n = p1 ? m_row : m_col;
			let ptr = create1DArray(Array(n).fill(0));
			Module.ccall("Game_optstrat", null, ["number", "number", "number"], [__this__, p1 ? 1 : 0, ptr]);
			let arr = Array(n).fill(0);
			for (let i = 0; i < n; ++i) {
				arr[i] = getValue(ptr + i * SIZE_OF_DOUBLE, "double");
			}
			free1DArray(ptr);
			return arr;
		}
	}
}
