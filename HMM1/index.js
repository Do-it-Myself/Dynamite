var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
function stringToMove(s) {
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
    return {
        rounds: __spreadArray([], json.rounds.map(function (_a) {
            var p1 = _a.p1, p2 = _a.p2;
            return { p1: stringToMove(p1), p2: stringToMove(p2) };
        }), true)
    };
}
var Bot = /** @class */ (function () {
    function Bot() {
        this.transitions = new Map();
        for (var i = 0; i < possibleMoves.length; i++) {
            this.setTransition([null, possibleMoves[i]], 1);
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
        var predictions = this.predictOpponentsMove((_b = gamestate.rounds[gamestate.rounds.length - 2]) !== null && _b !== void 0 ? _b : null);
        var ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    };
    /** update transition matrix (this.transitions) */
    Bot.prototype.update = function (round, lastRound) {
        var _this = this;
        var decayFactor = 0.9;
        this.incrementTransition([lastRound, round.p2]);
        this.transitions.forEach(function (v, k) {
            _this.transitions.set(k, v * decayFactor);
        });
    };
    /** return opponentMove prediction based on transition matrix (this.transitions) */
    Bot.prototype.predictOpponentsMove = function (currRound) {
        var predictedMove = possibleMoves[0];
        for (var _i = 0, possibleMoves_1 = possibleMoves; _i < possibleMoves_1.length; _i++) {
            var possibleMove = possibleMoves_1[_i];
            if (this.getTransition([currRound, possibleMove]) > this.getTransition([currRound, predictedMove])) {
                predictedMove = possibleMove;
            }
        }
        return predictedMove;
    };
    /** return ourMove based on opponentMove prediction */
    Bot.prototype.idealMoveForOpponentsMove = function (opponentsPredictedMove, game) {
        switch (opponentsPredictedMove) {
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
