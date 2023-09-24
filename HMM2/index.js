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
/** returns the index */
function randFromCumulativeProbabilityArray(probabilities) {
    var rand = Math.random();
    for (var i = 0; i < probabilities.length; i++) {
        if (rand < probabilities[i])
            return i;
    }
    return probabilities.length - 1;
}
var Bot = /** @class */ (function () {
    function Bot() {
        this.decayFactor = 0.9;
        this.transitions = new Map();
        for (var _i = 0, possibleMoves_3 = possibleMoves; _i < possibleMoves_3.length; _i++) {
            var move = possibleMoves_3[_i];
            this.setTransition([null, move], 1);
        }
    }
    Bot.prototype.getTransition = function (key) {
        var _a;
        return (_a = this.transitions.get(JSON.stringify(key))) !== null && _a !== void 0 ? _a : 0;
    };
    Bot.prototype.incrementTransition = function (key) {
        this.transitions.set(JSON.stringify(key), this.getTransition(key) + 1);
    };
    Bot.prototype.setTransition = function (key, value) {
        this.transitions.set(JSON.stringify(key), value);
    };
    Bot.prototype.makeMove = function (gamestate) {
        var game = gameFromJson(gamestate);
        var move = this.nextMove(game);
        return moveToString(move);
    };
    Bot.prototype.nextMove = function (gamestate) {
        var _a, _b;
        // not the first move
        if (gamestate.rounds.length > 0)
            this.update(gamestate.rounds[gamestate.rounds.length - 1], (_a = gamestate.rounds[gamestate.rounds.length - 2]) !== null && _a !== void 0 ? _a : null);
        var predictions = this.predictOpponentsMove((_b = gamestate.rounds[gamestate.rounds.length - 1]) !== null && _b !== void 0 ? _b : null);
        var ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    };
    Bot.prototype.setParam = function (n) {
        this.decayFactor = n;
    };
    /** update transition matrix (this.transitions) */
    Bot.prototype.update = function (round, lastRound) {
        var _this = this;
        this.incrementTransition([lastRound, round.p2]);
        this.transitions.forEach(function (v, k) {
            _this.transitions.set(k, v * _this.decayFactor);
        });
    };
    /** return opponentMove prediction based on transition matrix (this.transitions) */
    Bot.prototype.predictOpponentsMove = function (lastRound) {
        var probabilities = new Map();
        var totalOccurrences = 0;
        for (var _i = 0, possibleMoves_4 = possibleMoves; _i < possibleMoves_4.length; _i++) {
            var move = possibleMoves_4[_i];
            var occurences = this.getTransition([lastRound, move]);
            totalOccurrences += occurences;
            probabilities.set(move, occurences);
        }
        probabilities.forEach(function (v, k) {
            probabilities.set(k, v / totalOccurrences);
        });
        return probabilities;
    };
    /** return ourMove based on opponentMove prediction */
    Bot.prototype.idealMoveForOpponentsMove = function (predictions, game) {
        var moveList = [];
        var probabilityRange = [];
        predictions.forEach(function (v, k) {
            var _a;
            moveList.push(k);
            probabilityRange.push(((_a = probabilityRange[probabilityRange.length - 1]) !== null && _a !== void 0 ? _a : 0) + v);
        });
        var index = randFromCumulativeProbabilityArray(probabilityRange);
        var move = moveList[index];
        switch (move) {
            case Move.Rock:
                return Move.Paper;
            case Move.Paper:
                return Move.Scissors;
            case Move.Scissors:
                return Move.Rock;
            case Move.Dynamite:
                return Move.WaterBalloon;
            case Move.WaterBalloon:
                return Move.Rock;
        }
    };
    Bot.prototype.clear = function () {
        this.transitions.clear();
    };
    return Bot;
}());
module.exports = new Bot();
