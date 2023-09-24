var fs = require("fs");
var Move;
(function (Move) {
    Move[Move["Rock"] = 0] = "Rock";
    Move[Move["Paper"] = 1] = "Paper";
    Move[Move["Scissors"] = 2] = "Scissors";
    Move[Move["WaterBalloon"] = 3] = "WaterBalloon";
    Move[Move["Dynamite"] = 4] = "Dynamite";
})(Move || (Move = {}));
var possibleMoves = [
    Move.Rock,
    Move.Paper,
    Move.Scissors,
    Move.WaterBalloon,
    Move.Dynamite,
];
var possibleRounds = [];
for (var _i = 0, possibleMoves_1 = possibleMoves; _i < possibleMoves_1.length; _i++) {
    var move = possibleMoves_1[_i];
    for (var _a = 0, possibleMoves_2 = possibleMoves; _a < possibleMoves_2.length; _a++) {
        var move2 = possibleMoves_2[_a];
        possibleRounds.push({ p1: move, p2: move2 });
    }
}
function stringToMove(s) {
    if (s === undefined)
        throw new Error("stringToMove: argument undefined");
    switch (s) {
        case "R":
            return Move.Rock;
        case "P":
            return Move.Paper;
        case "S":
            return Move.Scissors;
        case "W":
            return Move.WaterBalloon;
        case "D":
            return Move.Dynamite;
        default:
            throw new Error("Deserialisation Error");
    }
}
function moveToString(m) {
    switch (m) {
        case Move.Rock:
            return "R";
        case Move.Paper:
            return "P";
        case Move.Scissors:
            return "S";
        case Move.WaterBalloon:
            return "W";
        case Move.Dynamite:
            return "D";
    }
}
function gameFromJson(json) {
    var newRounds = [];
    for (var _i = 0, _a = json.rounds; _i < _a.length; _i++) {
        var round = _a[_i];
        newRounds.push({ p1: stringToMove(round.p1), p2: stringToMove(round.p2) });
    }
    return {
        rounds: newRounds
    };
}
function errorMap(m) {
    var s = "";
    m.forEach(function (v, k) { return s += "".concat(k, ": ").concat(v, ","); });
    throw new Error(s);
}
var Bot = /** @class */ (function () {
    function Bot() {
        /** update transition matrix (this.transitions) */
        this.secondaryDecayFactor = 0.95;
        this.tieCounter = 0;
        this.dynamiteRemaining = 100;
        this.theirDynamiteRemaining = 100;
        this.transitions = new Map();
        this.secondaryTransitions = new Map();
        for (var _i = 0, possibleMoves_3 = possibleMoves; _i < possibleMoves_3.length; _i++) {
            var move = possibleMoves_3[_i];
            this.setTransition([null, move], 1);
        }
    }
    Bot.prototype.getTransition = function (key) {
        var _a;
        return (_a = this.transitions.get(JSON.stringify(key))) !== null && _a !== void 0 ? _a : 0;
    };
    Bot.prototype.getSecondaryTransition = function (key) {
        var _a;
        return (_a = this.secondaryTransitions.get(JSON.stringify(key))) !== null && _a !== void 0 ? _a : 0;
    };
    Bot.prototype.incrementTransition = function (key) {
        this.transitions.set(JSON.stringify(key), this.getTransition(key) + 1);
    };
    Bot.prototype.incrementSecondaryTransition = function (key) {
        this.secondaryTransitions.set(JSON.stringify(key), this.getSecondaryTransition(key) + 1);
    };
    Bot.prototype.setTransition = function (key, value) {
        this.transitions.set(JSON.stringify(key), value);
    };
    Bot.prototype.setSecondaryTransition = function (key, value) {
        this.secondaryTransitions.set(JSON.stringify(key), value);
    };
    Bot.prototype.makeMove = function (gamestate) {
        var game = gameFromJson(gamestate);
        var move = this.nextMove(game);
        return moveToString(move);
    };
    Bot.prototype.nextMove = function (gamestate) {
        // not the first move
        if (gamestate.rounds.length > 0)
            this.update(gamestate);
        var predictions = this.predictOpponentsMove(gamestate);
        var ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    };
    Bot.prototype.setParam = function (n) {
        this.secondaryDecayFactor = n;
    };
    Bot.prototype.update = function (game) {
        var _this = this;
        var _a, _b;
        var primaryDecayFactor = 0.8;
        var oneRoundAgo = game.rounds[game.rounds.length - 1];
        var twoRoundsAgo = (_a = game.rounds[game.rounds.length - 2]) !== null && _a !== void 0 ? _a : null;
        var threeRoundsAgo = (_b = game.rounds[game.rounds.length - 3]) !== null && _b !== void 0 ? _b : null;
        // one prev state
        this.incrementTransition([twoRoundsAgo, oneRoundAgo.p2]);
        this.transitions.forEach(function (v, k) {
            _this.transitions.set(k, v * primaryDecayFactor);
        });
        // two prev states
        this.incrementSecondaryTransition([threeRoundsAgo, twoRoundsAgo, oneRoundAgo.p2]);
        this.transitions.forEach(function (v, k) {
            _this.transitions.set(k, v * _this.secondaryDecayFactor);
        });
        if (oneRoundAgo.p1 == oneRoundAgo.p2) {
            this.tieCounter += 1;
        }
        else {
            this.tieCounter = 0;
        }
        if (oneRoundAgo.p1 === Move.Dynamite)
            this.dynamiteRemaining--;
        if (oneRoundAgo.p2 === Move.Dynamite)
            this.theirDynamiteRemaining--;
    };
    /** return opponentMove prediction based on transition matrix (this.transitions) */
    Bot.prototype.predictOpponentsMove = function (game) {
        var _a;
        var relativeProbabilities = [];
        var oneRoundAgo = game.rounds[game.rounds.length - 1];
        var twoRoundsAgo = (_a = game.rounds[game.rounds.length - 2]) !== null && _a !== void 0 ? _a : null;
        var secondaryOccurenceFactor = 5;
        for (var _i = 0, possibleMoves_4 = possibleMoves; _i < possibleMoves_4.length; _i++) {
            var move = possibleMoves_4[_i];
            var occurences = this.getTransition([oneRoundAgo, move]);
            var secondaryOccurences = this.getSecondaryTransition([twoRoundsAgo, oneRoundAgo, move]);
            relativeProbabilities.push(occurences + secondaryOccurences * secondaryOccurenceFactor);
        }
        relativeProbabilities[4] *= (this.theirDynamiteRemaining / 100.0);
        return relativeProbabilities;
    };
    /** return ourMove based on opponentMove prediction */
    Bot.prototype.idealMoveForOpponentsMove = function (predictions, game) {
        var probabilityRange = [];
        predictions.forEach(function (v) {
            probabilityRange.push(v);
        });
        var dynamiteFactor = (this.dynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;
        var moveProbabilities = [
            [0.0, 1.0 - dynamiteFactor, 0.0, 0.0, dynamiteFactor],
            [0.0, 0.0, 1.0 - dynamiteFactor, 0.0, dynamiteFactor],
            [1.0 - dynamiteFactor, 0.0, 0.0, 0.0, dynamiteFactor],
            [0.33, 0.33, 0.33, 0.01, 0.0],
            [0.0, 0.0, 0.0, 1.0 - dynamiteFactor, dynamiteFactor], // dynamite
        ];
        var ourMoveProbabilities = [0.0, 0.0, 0.0, 0.0, 0.0];
        // use the predictions as weighting to decide on our probabilites for each move
        for (var theirMoveIndex = 0; theirMoveIndex < possibleMoves.length; theirMoveIndex++) {
            var prediction = predictions[theirMoveIndex];
            for (var ourMoveIndex = 0; ourMoveIndex < possibleMoves.length; ourMoveIndex++) {
                ourMoveProbabilities[ourMoveIndex] += prediction * moveProbabilities[theirMoveIndex][ourMoveIndex];
            }
        }
        // if (this.dynamiteRemaining === 0) console.log(`1: ${ourMoveProbabilities}`);
        normalise(ourMoveProbabilities);
        // if (this.dynamiteRemaining === 0) console.log(`2: ${ourMoveProbabilities}`);
        for (var i = 0; i < ourMoveProbabilities.length; i++)
            ourMoveProbabilities[i] = inverseSigmoidActivationFunction(ourMoveProbabilities[i]);
        // if (this.dynamiteRemaining === 0) console.log(`3: ${ourMoveProbabilities}`);
        return possibleMoves[randFromRelativeProbabilityArray(ourMoveProbabilities)];
    };
    Bot.prototype.clear = function () {
        this.transitions.clear();
        this.secondaryTransitions.clear();
        this.dynamiteRemaining = 100;
        this.theirDynamiteRemaining = 100;
        this.tieCounter = 0;
    };
    return Bot;
}());
function normalise(probabilites) {
    var total = 0;
    for (var _i = 0, probabilites_1 = probabilites; _i < probabilites_1.length; _i++) {
        var p = probabilites_1[_i];
        total += p;
    }
    for (var i = 0; i < probabilites.length; i++) {
        probabilites[i] /= total;
    }
}
function inverseSigmoidActivationFunction(n) {
    var d = -0.02;
    var f = 0.975;
    var g = 0.3114;
    var h = 0.09;
    if (n < 1e-7)
        return 0;
    return (h * Math.log((f * n - d) / (1 - (f * n - d)))) + g;
}
function dynamiteSigmoidTransferFunction(n) {
    var a = 1.2;
    var b = 4;
    var c = 1;
    return 1 / (1 + (b * Math.exp(a - (c * n))));
}
/** returns the index */
function randFromRelativeProbabilityArray(probabilities) {
    var total = 0;
    var cumulative = [];
    for (var _i = 0, probabilities_1 = probabilities; _i < probabilities_1.length; _i++) {
        var p = probabilities_1[_i];
        cumulative.push(p + total);
        total += p;
    }
    var rand = Math.random() * total;
    for (var i = 0; i < cumulative.length; i++) {
        if (rand < cumulative[i])
            return i;
    }
    return cumulative.length - 1;
}
module.exports = new Bot();
