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
    }
    Bot.prototype.makeMove = function (gamestate) {
        var game = gameFromJson(gamestate);
        var move = this.nextMove(game);
        return moveToString(move);
    };
    Bot.prototype.nextMove = function (gamestate) {
        var randNum = Math.floor(Math.random() * 5);
        switch (randNum) {
            case 0:
                return Move.Rock;
            case 1:
                return Move.Paper;
            case 2:
                return Move.Scissors;
            case 3:
                return Move.WaterBalloon;
            case 4:
                if (this.dynamite < 100) {
                    this.dynamite += 1;
                    return Move.Dynamite;
                }
                return this.nextMove(gamestate);
            default:
                throw new Error("Will not happen");
        }
    };
    return Bot;
}());
module.exports = new Bot();
