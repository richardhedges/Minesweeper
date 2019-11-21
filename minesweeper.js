class Game {

	// constructor(element, width, height, totalMines, squareSize) {
	constructor(element, options) {

		this.domElement = document.querySelector(element);

		if (typeof options == 'undefined') {

			this.width = 18;
			this.height = 14;
			this.totalMines = 40;
			this.squareSize = 34;

		} else {

			this.width = typeof options.width != 'undefined' ? options.width : 18;
			this.height = typeof options.height != 'undefined' ? options.height : 14;
			this.totalMines = typeof options.totalMines != 'undefined' ? options.totalMines : 40;
			this.squareSize = typeof options.squareSize != 'undefined' ? options.squareSize : 34;

		}

		this.inputDisabled = false;

		this.squares = {};
		this.mines = {};

		this.init();

	}

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}

	getTotalMines() {
		return this.totalMines;
	}

	getSquareSize() {
		return this.squareSize;
	}

	init() {

		this.domElement.style.width = this.getWidth() * this.getSquareSize() + 'px';
		this.domElement.style.height = this.getHeight() * this.getSquareSize() + 'px';

		this.generateLayout();
		this.generateMines();

		this.eventListeners();

	}

	restart() {

		var instance = this;

		Object.keys(this.squares).forEach(function(square) {
			
			square = instance.squares[square];
			square.type = null;

			if (square.element.classList.contains('even')) {
				square.element.setAttribute('class', 'square even');
			} else {
				square.element.setAttribute('class', 'square odd');
			}

			square.element.style.backgroundColor = '';
			square.element.innerHTML = '';

		});

		this.domElement.removeChild(this.domElement.querySelector('.overlay'));

		this.mines = {};

		this.generateMines();
		this.enableInput();

	}

	generateLayout() {

		var lastSquareClass = 'even';

		for (var y = 1; y <= this.getHeight(); y++) {

			for (var x = 1; x <= this.getWidth(); x++) {

				var square = document.createElement('div');
				
				square.setAttribute('class', 'square ' + lastSquareClass);
				square.setAttribute('data-x', x);
				square.setAttribute('data-y', y);

				square.style.width = this.getSquareSize() + 'px';
				square.style.height = this.getSquareSize() + 'px';
				square.style.top = (y - 1) * this.getSquareSize() + 'px';
				square.style.left = (x - 1) * this.getSquareSize() + 'px';

				this.squares[x + ',' + y] = {
					x: x,
					y: y,
					element: square,
					type: null
				};

				this.domElement.appendChild(square);

				if (x != this.getWidth()) {
					lastSquareClass = (lastSquareClass == 'odd') ? 'even' : 'odd';
				}

			}

		}

	}

	generateMines() {

		for (var m = 1; m <= this.getTotalMines(); m++) {
			
			var mine = this.generateNewMine();
			var squareKey = mine.x + ',' + mine.y;

			this.mines[squareKey] = mine;
			this.squares[squareKey].type = 'mine';

		}

	}

	checkAllSquares() {

		var instance = this;
		var allPlayed = true;

		Object.keys(this.squares).forEach(function(square) {

			square = instance.squares[square];

			if (!square.element.classList.contains('active')) {
				allPlayed = false;
			}

		});

		if (allPlayed) {
			this.endGame();
		}

	}

	validSquare(squareKey) {
		return squareKey in this.squares;
	}

	mineExists(mine) {

		var mineKey = mine.x + ',' + mine.y;

		if (mineKey in this.mines) {
			return true;
		}

		return false;

	}

	generateMine() {

		var x = Math.floor(Math.random() * this.getWidth());
		var y = Math.floor(Math.random() * this.getHeight());

		return {
			x: x,
			y: y,
			square: this.squares[x + ',' + y]
		};

	}

	generateNewMine() {

		var mine = this.generateMine();

		if (!this.validSquare(mine.x + ',' + mine.y) || this.mineExists(mine)) {
			mine = this.generateNewMine();
		}

		return mine;

	}

	eventListeners() {

		var instance = this;

		document.addEventListener('click', function(event) {

			event.preventDefault();

			if (!instance.inputDisabled) {

				if (event.target.matches('.square') && !event.target.classList.contains('active')) {

					var x = event.target.getAttribute('data-x');
					var y = event.target.getAttribute('data-y');

					instance.clickedSquare(instance.squares[x + ',' + y]);
					instance.checkAllSquares();

					return;

				}

			}

			if (event.target.matches('#retry')) {
				instance.restart();
			}

		});

		document.addEventListener('contextmenu', function(event) {

			event.preventDefault();

			if (!instance.inputDisabled) {

				if (event.target.matches('.square')) {

					var x = event.target.getAttribute('data-x');
					var y = event.target.getAttribute('data-y');

					if (!event.target.classList.contains('active') || event.target.classList.contains('has-flag')) {
						instance.toggleFlag(instance.squares[x + ',' + y]);
						instance.checkAllSquares();
					}

				}

			}

		});

	}

	clickedSquare(square) {

		switch (square.type) {

			case 'mine':
				this.triggeredMine(this.mines[square.x + ',' + square.y]);
				return;
			break;

			default:

				if (this.squareTouchesMine(square)) {
					this.showSquareCounter(square);
				} else {
					this.generateSquareCounters(square);
				}

				square.element.classList.add('active');

			break;

		}

	}

	minesInTouch(square) {

		var minesInTouch = 0;

		var surroundSquares = this.squareSurrounds(square);

		var instance = this;

		Object.keys(surroundSquares).forEach(function(surroundSquare) {

			surroundSquare = surroundSquares[surroundSquare];

			if (surroundSquare !== null) {

				if (instance.mineExists({x: surroundSquare.x, y: surroundSquare.y})) {
					minesInTouch += 1;
				}

			}

		});

		return minesInTouch;

	}

	squareTouchesMine(square) {
		return this.minesInTouch(square) > 0;
	}

	squareSurrounds(square) {

		return {
			'topleft': this.getSquareNeighbour(square, 'topleft'),
			'top': this.getSquareNeighbour(square, 'top'),
			'topright': this.getSquareNeighbour(square, 'topright'),
			'left': this.getSquareNeighbour(square, 'left'),
			'right': this.getSquareNeighbour(square, 'right'),
			'bottomleft': this.getSquareNeighbour(square, 'bottomleft'),
			'bottom': this.getSquareNeighbour(square, 'bottom'),
			'bottomright': this.getSquareNeighbour(square, 'bottomright')
		};

	}

	getSquareNeighbour(square, direction) {

		switch (direction) {

			case 'topleft':
				return this.getSquare(square.x - 1, square.y - 1);
			break;

			case 'top':
				return this.getSquare(square.x, square.y - 1);
			break;

			case 'topright':
				return this.getSquare(square.x + 1, square.y - 1);
			break;

			case 'left':
				return this.getSquare(square.x - 1, square.y);
			break;

			case 'right':
				return this.getSquare(square.x + 1, square.y);
			break;

			case 'bottomleft':
				return this.getSquare(square.x - 1, square.y + 1);
			break;

			case 'bottom':
				return this.getSquare(square.x, square.y + 1);
			break;

			case 'bottomright':
				return this.getSquare(square.x + 1, square.y + 1);
			break;

		}

	}

	getSquare(x, y) {
		return typeof this.squares[x + ',' + y] != 'undefined' ? this.squares[x + ',' + y] : null;
	}

	showSquareCounter(square) {

		var minesInTouch = this.minesInTouch(square);

		var counterClass = '';

		switch (minesInTouch) {

			case 2:
				counterClass = 'green';
			break;

			case 3:
				counterClass = 'red';
			break;

			case 4:
				counterClass = 'purple';
			break;

			case 5:
				counterClass = 'yellow';
			break;

			default:
				counterClass = 'blue';
			break;

		}

		square.element.classList.add('active');
		square.element.innerHTML = '<span class="counter ' + counterClass + '">' + minesInTouch + '</span>';

	}

	generateSquareCounters(square) {

		var instance = this;
		var surroundSquares = this.squareSurrounds(square);

		Object.keys(surroundSquares).forEach(function(surroundSquare) {

			surroundSquare = surroundSquares[surroundSquare];

			if (surroundSquare !== null && !surroundSquare.element.classList.contains('active')) {

				if (instance.squareTouchesMine(surroundSquare)) {
					instance.showSquareCounter(surroundSquare);
				} else {
					surroundSquare.element.classList.add('active');
					instance.generateSquareCounters(surroundSquare);
				}

			}

		});

	}

	toggleFlag(square) {

		if (square.element.classList.contains('has-flag')) {
			this.removeFlag(square);
		} else {
			this.addFlag(square);
		}

	}

	removeFlag(square) {
		square.element.classList.remove('active');
		square.element.classList.remove('has-flag');
		square.element.classList.remove('nobg');
		square.element.innerHTML = '';
	}

	addFlag(square) {
		square.element.classList.add('active');
		square.element.classList.add('has-flag');
		square.element.classList.add('nobg');
		square.element.innerHTML = '<span class="flag"></span>';
	}

	disableInput() {
		this.inputDisabled = true;
		this.domElement.classList.add('input-disabled');
	}

	enableInput() {
		this.inputDisabled = false;
		this.domElement.classList.remove('input-disabled');
	}

	showOverlay(message, buttonText) {

		var tryAgainOverlay = document.createElement('div');
		tryAgainOverlay.setAttribute('class', 'overlay');
		tryAgainOverlay.innerHTML = '<div>' + message + '<br><button id="retry">' + buttonText + '</button></div>';

		this.domElement.appendChild(tryAgainOverlay);

		setTimeout(function() {
			tryAgainOverlay.classList.add('show');
		}, 50, tryAgainOverlay);

	}

	triggeredMine(triggeredMine) {

		this.disableInput();

		var showMineDelay = 150;

		var instance = this;
		var timeout = showMineDelay;

		this.showMine(triggeredMine);

		setTimeout(function() {
			instance.showOverlay('Game over', 'Retry?');
		}, showMineDelay * this.getTotalMines(), instance);

		Object.keys(this.mines).forEach(function(mine) {

			mine = instance.mines[mine];

			if (!mine.square.element.classList.contains('active') || mine.square.element.classList.contains('has-flag')) {

				setTimeout(function() {
					instance.showMine(mine);
				}, timeout, mine, instance);

				timeout += showMineDelay;

			}

		});

	}

	showMine(mine) {

		mine.square.element.style.backgroundColor = this.randomColour();
		mine.square.element.classList.add('active');
		mine.square.element.innerHTML = '<span class="mine"></span>';

	}

	endGame() {

		console.log('end game');

	}

	randomColour() {

		var colours = [
			'#a855ea',
			'#5586e6',
			'#edc344',
			'#a0edf4',
			'#ca423e',
			'#eba55a',
			'#db54b1',
			'#e68935',
			'#3a844b'
		];

		return colours[Math.floor(Math.random() * colours.length)];

	}

}