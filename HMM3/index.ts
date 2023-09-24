const fs = require("fs");

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

const possibleRounds: Round[] = []

for (const move of possibleMoves) for (const move2 of possibleMoves) possibleRounds.push({ p1: move, p2: move2 });

function stringToMove(s: string) {
    if (s === undefined) throw new Error("stringToMove: argument undefined");
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

type Round = {
    p1: Move,
    p2: Move
};

type Game = {
    rounds: Round[];
};

type Serialized = { rounds: { p1: string, p2: string }[] };

function gameFromJson(json: Serialized): Game {
    const newRounds = [];
    for (const round of json.rounds) newRounds.push({ p1: stringToMove(round.p1), p2: stringToMove(round.p2) });

    return {
        rounds: newRounds
    };
}

function errorMap<K, V>(m: Map<K, V>) {
    let s = "";
    m.forEach((v, k) => s += `${k}: ${v},`);
    throw new Error(s);
}



class Bot {
    constructor() {
        this.transitions = new Map();
        for (let move of possibleMoves) {
            this.setTransition([null, move], 1);
        }
    }

    getTransition(key: [Round | null, Move]) {
        return this.transitions.get(JSON.stringify(key)) ?? 0;
    }

    incrementTransition(key: [Round | null, Move]) {
        this.transitions.set(JSON.stringify(key), this.getTransition(key) + 1);
    }

    setTransition(key: [Round | null, Move], value: number) {
        this.transitions.set(JSON.stringify(key), value);
    }

    /** (previous_round, opponents_move) => numberOfOccurences  
     * we have to use a string as a key due to referential equality  
     * null is the start state  
     */
    transitions: Map<string, number>;

    makeMove(gamestate: Serialized): string {
        const game = gameFromJson(gamestate);
        const move = this.nextMove(game);
        return moveToString(move);
    }

    nextMove(gamestate: Game): Move {
        // not the first move
        if (gamestate.rounds.length > 0) this.update(gamestate.rounds[gamestate.rounds.length - 1], gamestate.rounds[gamestate.rounds.length - 2] ?? null);

        const predictions = this.predictOpponentsMove(gamestate.rounds[gamestate.rounds.length - 1] ?? null);
        const ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    }

    /** update transition matrix (this.transitions) */
    update(round: Round, lastRound: Round | null) {
        const decayFactor = 0.75;
        this.incrementTransition([lastRound, round.p2]);
        this.transitions.forEach((v, k) => {
            this.transitions.set(k, v * decayFactor);
        });
        if (round.p1 == round.p2) {
            this.tieCounter += 1;
        } else {
            this.tieCounter = 0;
        }

        if (round.p1 === Move.Dynamite) this.dynamiteRemaining--;
        if (round.p2 === Move.Dynamite) this.theirDynamiteRemaining--;
    }

    /** return opponentMove prediction based on transition matrix (this.transitions) */
    predictOpponentsMove(lastRound: Round | null): /** relative probability */ number[] {
        let relativeProbabilities: number[] = [];
        let totalOccurrences = 0;
        for (const move of possibleMoves) {
            const occurences = this.getTransition([lastRound, move]);
            totalOccurrences += occurences;
            relativeProbabilities.push(occurences);
        }
        return relativeProbabilities;
    }

    tieCounter = 0;

    dynamiteRemaining = 100;
    theirDynamiteRemaining = 100;


    /** return ourMove based on opponentMove prediction */
    idealMoveForOpponentsMove(predictions: /** relative probability */ number[], game: Game): Move {
        const probabilityRange: number[] = [];
        predictions.forEach((v) => {
            probabilityRange.push(v)
        });

        const dynamiteFactor = (this.dynamiteRemaining * dynamiteSigmoidTransferFunction(this.tieCounter)) / 100.0;

        const moveProbabilities: number[][] = [
            [0.0, 1.0 - dynamiteFactor, 0.0, 0.0, dynamiteFactor], // rock
            [0.0, 0.0, 1.0 - dynamiteFactor, 0.0, dynamiteFactor], // paper
            [1.0 - dynamiteFactor, 0.0, 0.0, 0.0, dynamiteFactor], // scissors
            [0.33, 0.33, 0.33, 0.01, 0.0], // water balloon
            [0.0, 0.0, 0.0, 1.0 - dynamiteFactor, dynamiteFactor], // dynamite
        ];

        const rock = 0;
        const paper = 1;
        const scissors = 2;
        const waterBalloon = 3;
        const dynamite = 4;

        const ourMoveProbabilities = [0.0, 0.0, 0.0, 0.0, 0.0];

        // use the predictions as weighting to decide on our probabilites for each move
        for (let theirMoveIndex = 0; theirMoveIndex < possibleMoves.length; theirMoveIndex++) {
            let prediction = predictions[theirMoveIndex];
            for (let ourMoveIndex = 0; ourMoveIndex < possibleMoves.length; ourMoveIndex++) {
                ourMoveProbabilities[ourMoveIndex] += prediction * moveProbabilities[theirMoveIndex][ourMoveIndex];
            }
        }

        return possibleMoves[randFromRelativeProbabilityArray(ourMoveProbabilities)];
    }

    public clear() {
        this.transitions.clear();
        this.dynamiteRemaining = 100;
        this.theirDynamiteRemaining = 100;
        this.tieCounter = 0;
    }
}

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
    let cumulative = [];
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

module.exports = new Bot();