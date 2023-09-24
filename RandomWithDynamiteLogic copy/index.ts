enum Move {
    Rock, Paper, Scissors, WaterBalloon, Dynamite
}

const possibleMoves = [
    Move.Rock,
    Move.Paper,
    Move.Scissors,
    Move.WaterBalloon,
    Move.Dynamite,
];

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

    constructor() { }

    makeMove(gamestate: Serialized): string {
        const game = gameFromJson(gamestate);
        const move = this.nextMove(game);
        return moveToString(move);
    }

    dynamiteRemaining = 100;
    theirDynamiteRemaining = 100;
    tieCounter = 0;

    nextMove(gamestate: Game): Move {
        if (gamestate.rounds.length > 0) {
            const lastRound = gamestate.rounds[gamestate.rounds.length - 1];
            if (lastRound.p1 === Move.Dynamite) this.dynamiteRemaining--;
            if (lastRound.p2 === Move.Dynamite) this.theirDynamiteRemaining--;
            if (lastRound.p1 === lastRound.p2) {this.tieCounter++;} else {this.tieCounter = 0}
        }

        const dynamiteFactor = (this.dynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;
        const waterBalloonFactor = (this.theirDynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;

        const probabilites = [
            0.25 - dynamiteFactor/3 - waterBalloonFactor/3,
            0.25 - dynamiteFactor/3 - waterBalloonFactor/3,
            0.25 - dynamiteFactor/3 - waterBalloonFactor/3,
            waterBalloonFactor,
            dynamiteFactor,
        ];

        const moveIdx = randFromRelativeProbabilityArray(probabilites);
        return possibleMoves[moveIdx];

    }
}

module.exports = new Bot();

function dynamiteSigmoidTransferFunction(n: number) {
    const a = 1.2;
    const b = 4;
    const c = 1;
    return 1 / (
        1 + (b * Math.exp(a - (c * n)))
    );
}

/** returns the index */
function randFromRelativeProbabilityArray(probabilities: number[]): number {
    let total = 0;
    let cumulative: number[] = [];
    for (let p of probabilities) {
        cumulative.push(p + total);
        total += p;
    }
    const rand = Math.random() * total;
    for (let i = 0; i < cumulative.length; i++) {
        if (rand < cumulative[i]) return i;
    }
    return cumulative.length - 1;
}