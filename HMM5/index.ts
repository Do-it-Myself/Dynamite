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
        this.secondaryTransitions = new Map();
        for (let move of possibleMoves) {
            this.setTransition([null, move], 1);
        }
    }

    getTransition(key: [Round | null, Move]) {
        return this.transitions.get(JSON.stringify(key)) ?? 0;
    }

    getSecondaryTransition(key: [Round | null, Round | null, Move]) {
        return this.secondaryTransitions.get(JSON.stringify(key)) ?? 0;
    }

    incrementTransition(key: [Round | null, Move]) {
        this.transitions.set(JSON.stringify(key), this.getTransition(key) + 1);
    }

    incrementSecondaryTransition(key: [Round | null, Round | null, Move]) {
        this.secondaryTransitions.set(JSON.stringify(key), this.getSecondaryTransition(key) + 1);
    }
    setTransition(key: [Round | null, Move], value: number) {
        this.transitions.set(JSON.stringify(key), value);
    }

    setSecondaryTransition(key: [Round | null, Round | null, Move], value: number) {
        this.secondaryTransitions.set(JSON.stringify(key), value);
    }

    /** (previous_round, opponents_move) => numberOfOccurences  
     * we have to use a string as a key due to referential equality  
     * null is the start state  
     */
    transitions: Map<string, number>;
    secondaryTransitions: Map<string, number>;
    

    makeMove(gamestate: Serialized): string {
        const game = gameFromJson(gamestate);
        const move = this.nextMove(game);
        return moveToString(move);
    }

    nextMove(gamestate: Game): Move {
        // not the first move
        if (gamestate.rounds.length > 0) this.update(gamestate);

        const predictions = this.predictOpponentsMove(gamestate);
        const ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    }

    /** update transition matrix (this.transitions) */
    secondaryDecayFactor = 0.95;
    
    public setParam(n: number) {
        this.secondaryDecayFactor = n;
    }

    update(game: Game) {
        const primaryDecayFactor = 0.8;

        const oneRoundAgo = game.rounds[game.rounds.length - 1];
        const twoRoundsAgo = game.rounds[game.rounds.length - 2] ?? null
        const threeRoundsAgo = game.rounds[game.rounds.length - 3] ?? null

        // one prev state
        this.incrementTransition([twoRoundsAgo, oneRoundAgo.p2]);
        this.transitions.forEach((v, k) => {
            this.transitions.set(k, v * primaryDecayFactor);
        });

        // two prev states
        this.incrementSecondaryTransition([threeRoundsAgo, twoRoundsAgo, oneRoundAgo.p2]);
        this.transitions.forEach((v, k) => {
            this.transitions.set(k, v * this.secondaryDecayFactor);
        });

        
        if (oneRoundAgo.p1 == oneRoundAgo.p2) {
            this.tieCounter += 1;
        } else {
            this.tieCounter = 0;
        }

        if (oneRoundAgo.p1 === Move.Dynamite) this.dynamiteRemaining--;
        if (oneRoundAgo.p2 === Move.Dynamite) this.theirDynamiteRemaining--;
    }

    /** return opponentMove prediction based on transition matrix (this.transitions) */
    predictOpponentsMove(game: Game): /** relative probability */ number[] {
        let relativeProbabilities: number[] = [];

        const oneRoundAgo = game.rounds[game.rounds.length - 1];
        const twoRoundsAgo = game.rounds[game.rounds.length - 2] ?? null;
        const secondaryOccurenceFactor = 5;

        for (const move of possibleMoves) {
            const occurences = this.getTransition([oneRoundAgo, move]);
            const secondaryOccurences = this.getSecondaryTransition([twoRoundsAgo, oneRoundAgo, move]);
            relativeProbabilities.push(occurences + secondaryOccurences * secondaryOccurenceFactor);
        }


        relativeProbabilities[4] *= (this.theirDynamiteRemaining / 100.0);
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

        const ourMoveProbabilities = [0.0, 0.0, 0.0, 0.0, 0.0];

        // use the predictions as weighting to decide on our probabilites for each move
        for (let theirMoveIndex = 0; theirMoveIndex < possibleMoves.length; theirMoveIndex++) {
            let prediction = predictions[theirMoveIndex];
            for (let ourMoveIndex = 0; ourMoveIndex < possibleMoves.length; ourMoveIndex++) {
                ourMoveProbabilities[ourMoveIndex] += prediction * moveProbabilities[theirMoveIndex][ourMoveIndex];
            }
        }

        // if (this.dynamiteRemaining === 0) console.log(`1: ${ourMoveProbabilities}`);
        normalise(ourMoveProbabilities);
        // if (this.dynamiteRemaining === 0) console.log(`2: ${ourMoveProbabilities}`);
        for (let i = 0; i < ourMoveProbabilities.length; i++) ourMoveProbabilities[i] = inverseSigmoidActivationFunction(ourMoveProbabilities[i]);
        // if (this.dynamiteRemaining === 0) console.log(`3: ${ourMoveProbabilities}`);

        return possibleMoves[randFromRelativeProbabilityArray(ourMoveProbabilities)];
    }

    public clear() {
        this.transitions.clear();
        this.secondaryTransitions.clear();
        this.dynamiteRemaining = 100;
        this.theirDynamiteRemaining = 100;
        this.tieCounter = 0;
    }
}

function normalise(probabilites: number[]) {
    let total = 0;
    for (let p of probabilites) total += p;
    for (let i = 0; i < probabilites.length; i++) {
        probabilites[i] /= total;
    }
}

function inverseSigmoidActivationFunction(n : number) {
    const d = -0.02;
    const f = 0.975;
    const g = 0.3114;
    const h = 0.09;

    if (n < 1e-7) return 0;

    return (h * Math.log(
        (f*n - d) / (1 - (f*n - d))
    )) + g;
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