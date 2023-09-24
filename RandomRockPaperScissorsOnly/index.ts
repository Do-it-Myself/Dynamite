enum Move {
    Rock, Paper, Scissors, WaterBalloon, Dynamite
}

function stringToMove(s: string) {
    switch (s) {
        case "R":
            return Move.Rock;
        case "P":
            return Move.Paper
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

function moveToString(m: Move) {
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

type Game = {
    rounds: {
        p1: Move,
        p2: Move
    }[];
};

type Serialized = { rounds: { p1: string, p2: string }[] };

function gameFromJson(json: Serialized) {
    return {
        rounds: [...json.rounds.map(({ p1, p2 }) => {
            return { p1: stringToMove(p1), p2: stringToMove(p2) };
        })]
    }
}

class Bot {

    dynamite = 0;

    constructor() {}

    makeMove(gamestate: Serialized) : string {
        const game = gameFromJson(gamestate);
        const move = this.nextMove(game);
        return moveToString(move);
    }

    nextMove(gamestate: Game): Move {
        const randNum = Math.floor(Math.random() * 3);
        switch (randNum) {
            case 0:
                return Move.Rock;
            case 1:
                return Move.Paper;
            case 2:
                return Move.Scissors;
            default:
                throw new Error("Will not happen");
        }
    }
}

module.exports = new Bot();