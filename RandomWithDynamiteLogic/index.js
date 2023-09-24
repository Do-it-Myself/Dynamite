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
        this.dynamite = 0;
        this.dynamiteRemaining = 100;
        this.theirDynamiteRemaining = 100;
        this.tieCounter = 0;
    }
    Bot.prototype.makeMove = function (gamestate) {
        var game = gameFromJson(gamestate);
        var move = this.nextMove(game);
        return moveToString(move);
    };
    Bot.prototype.nextMove = function (gamestate) {
        if (gamestate.rounds.length > 0) {
            var lastRound = gamestate.rounds[gamestate.rounds.length - 1];
            if (lastRound.p1 === Move.Dynamite)
                this.dynamiteRemaining--;
            if (lastRound.p2 === Move.Dynamite)
                this.theirDynamiteRemaining--;
            if (lastRound.p1 === lastRound.p2) {
                this.tieCounter++;
            }
            else {
                this.tieCounter = 0;
            }
        }
        var dynamiteFactor = (this.dynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;
        var waterBalloonFactor = (this.theirDynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;
        var probabilites = [
            0.25 - dynamiteFactor / 3 - waterBalloonFactor / 3,
            0.25 - dynamiteFactor / 3 - waterBalloonFactor / 3,
            0.25 - dynamiteFactor / 3 - waterBalloonFactor / 3,
            waterBalloonFactor,
            dynamiteFactor,
        ];
        var moveIdx = randFromRelativeProbabilityArray(probabilites);
        return possibleMoves[moveIdx];
    };
    return Bot;
}());
module.exports = new Bot();
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
