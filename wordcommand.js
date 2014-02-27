function dist2(x1, y1, x2, y2) {
	return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}
function choice(list) {
	return list[Math.floor(Math.random() * list.length)];
}

//var scrabbleLetters = "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ";
var scrabbleLetters = "NNNNNNRRRRRRTTTTTTLLLLSSSSDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ";

function randLetter () {
	var c = choice(scrabbleLetters);
	return {l: c, i: Math.random()};
	//return choice(choice(words)).toUpperCase();
}

function Ctrl ($scope) {
	$scope.vowel = function (c) {
		return ("AEIOU".indexOf(c.toUpperCase()) >= 0);
	}
	$scope.screen = false;
	$scope.highScore = window.localStorage['highScore'] || 0;

	$scope.score = function (s) {
		if (s > $scope.highScore) {
			$scope.highScore = window.localStorage['highscore'] = s;
		}
	}

	$scope.endRound = function () {
		$scope.resetable = 1;
	}

	$scope.nextRound = function () {
		$scope.resetable = 2;
		$scope.endRound();
		if (!$scope.screen) {
			$scope.score();
			$scope.reset();
			$scope.paused = false;
			$scope.screen = true;
		} else {
			$scope.resetable = 1;
		}
	}

	$scope.start = function (mode) {
		$scope.initCounter();
		$scope.nextRound();
	};

	$scope.counter = false;
	$scope.initCounter = function (time) {
		if ($scope.counter) {
			$scope.paused = false;
			return;
		}
		$scope.counter = true;
		window.requestAnimationFrame(function tick () {
			window.requestAnimationFrame(tick);
			if ($scope.paused) return;

			for (var i = 0; i < $scope.letters.length; i++) {
				while ($scope.letters[i] && $scope.letters[i].tick()) {
					$scope.fail($scope.letters[i].l);
					$scope.letters.splice(i, 1);
				}

				for (var j = 0; j < $scope.letters.length; j++) {
					if (j == i) continue;
					var d = dist2($scope.letters[i].x, $scope.letters[i].y,
						$scope.letters[j].x, $scope.letters[j].y);

					var k = -10;
					if ($scope.letters[i].x > $scope.letters[j].x) {
						k = 10;
					}

					$scope.letters[i].vx += k / d;
				}
			}
			if (Math.random() < 0.01) {
				$scope.toss(randLetter());
			}
			$scope.$digest();
		});
	}

	$scope.W = 640;
	$scope.H = 420;


	$scope.fail = function (c) {
		if ($scope.vowel(c)) return;
		$scope.hp--;
		$scope.setResult('hp', 'red', '&times;');
		if ($scope.hp <= 0) {
			$scope.timeOut();
		}
	}

	function Letter(c, x, y) {
		this.l = c.l;
		this.i = c.i;
		this.x = x;
		this.y = y;
		this.vx = 0;
		this.vy = .5;

		this.tick = function () {
			this.vx *= 0.99;
			this.x += this.vx;
			if (this.x < 0) {
				this.x = 0;
				this.vx *= -.9;
			}
			if (this.x > $scope.W - 60) {
				this.x = $scope.W - 60;
				this.vx *= -.9;
			}
			this.y += this.vy;
			return this.y > $scope.H;
		}
	}

	$scope.toss = function (c) {
		$scope.letters.push(new Letter(c, Math.random() * ($scope.W - 60), -40));
	}

	$scope.reset = function () {
		$scope.paused = false;
		$scope.points = 0;
		$scope.resetable = 2;
		$scope.wordsPlayed = [];
		$scope.hp = 3;
		$scope.letters = [];
	}
	$scope.reset();

	$scope.timeOut = function () {
		$scope.paused = true;
		$scope.resetable = 1;
		$scope.nextRound();
	}

	$scope.played = [];

	$scope.key = function (e) {
		if (e.keyCode == 8) {
			// backspace
			e.preventDefault();
			if ($scope.played.length == 0) return;
			var c = $scope.played.pop();
			for (var i = $scope.letters.length - 1; i > -1; i--) {
				if ($scope.letters[i].selected && $scope.letters[i].l == c) {
					$scope.letters[i].selected = false;
				}
			}
			return;
		} else if (e.keyCode == 13 || e.keyCode == 32) {
			$scope.enter();
		}

		var k = e.keyCode;
		if (k >= 97 && k <= 122) k -= 32;
		if (k >= 65 && k <= 90) {
			var c = String.fromCharCode(k);
			if ($scope.vowel(c)) {
				$scope.played.push(c);
				return;
			}
			for (var i = 0; i < $scope.letters.length; i++) {
				if ($scope.letters[i].l == c && !$scope.letters[i].selected) {
					$scope.letters[i].selected = true;
					$scope.played.push(c);
					break;
				}
			}
		}
	}

	$scope.setResult = function (type, color, msg) {
		var r = $('<div class=result>');
		r.css('color', color);
		r.html(msg);
		r.stop();
		r.css('bottom', 0);
		r.css('opacity', 1);
		r.animate({ bottom: 16, opacity: 0 }, 1200, 'linear', function () {
			$(this).remove();
		});
		$('#'+type+' #res').append(r);
	}

	$scope.deselectAll = function () {
		for (var i = 0; i < $scope.letters.length; i++) {
			$scope.letters[i].selected = false;
		}
	}
	$scope.scoreLength = function (word) {
		var l = 0;
		for (var i = 0; i < word.length; i++) {
			if (!$scope.vowel(word[i])) l++;
		}
		console.log(word, l);

		var p = Math.pow(2, l-1);
		$scope.points += p;
		$scope.setResult('points', 'green', '+ ' + p);
		return p;
	}

	$scope.enter = function () {
		if (!$scope.screen) {
			$scope.start();
			return;
		}

		if ($scope.resetable <= 1) {
			if ($scope.resetable == 1) {
				$scope.resetable = 0;
				return;
			}
			$scope.screen = false;
			return;
		}

		var h = $scope.played.join('').toLowerCase();
		$scope.played = [];
		if (words.indexOf(h) < 0) {
			$scope.deselectAll();
			$scope.setResult('points', 'red', '&times;');
			return;
		}

		for (var i = 0; i < $scope.letters.length; i++) {
			while ($scope.letters[i] && $scope.letters[i].selected) {
				$scope.letters.splice(i, 1);
			}
		}
		var p = $scope.scoreLength(h);
		$scope.wordsPlayed.push({
			word: h,
			points: p
		});
	}
}

angular.module('app', []);
