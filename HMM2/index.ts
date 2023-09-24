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

for (const move of possibleMoves) for (const move2 of possibleMoves) possibleRounds.push({p1: move, p2: move2});

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

function gameFromJson(json: Serialized) : Game {
    const newRounds = [];
    for (const round of json.rounds) newRounds.push({p1: stringToMove(round.p1), p2: stringToMove(round.p2)});

    return {
        rounds: newRounds
    };
}

function errorMap<K,V>(m: Map<K,V>) {
    let s = "";
    m.forEach((v, k) => s += `${k}: ${v},`);
    throw new Error(s);
}

/** returns the index */
function randFromCumulativeProbabilityArray(probabilities: number[]) : number {
    const rand = Math.random();
    for (let i = 0; i < probabilities.length; i++) {
        if (rand < probabilities[i]) return i;
    }
    return probabilities.length - 1;
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

    makeMove(gamestate: Serialized) : string {
        const game = gameFromJson(gamestate);
        const move = this.nextMove(game);
        return moveToString(move);
    }
    
    nextMove(gamestate: Game) : Move {
        // not the first move
        if (gamestate.rounds.length > 0) this.update(gamestate.rounds[gamestate.rounds.length - 1], gamestate.rounds[gamestate.rounds.length - 2] ?? null);
        
        const predictions = this.predictOpponentsMove(gamestate.rounds[gamestate.rounds.length - 1] ?? null);
        const ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    }

    decayFactor: number = 0.75

    public setParam(n: number) {
        this.decayFactor = n;
    }
    
    /** update transition matrix (this.transitions) */ 
    update(round: Round, lastRound: Round | null) {
        this.incrementTransition([lastRound, round.p2]);
        this.transitions.forEach((v,k) => {
            this.transitions.set(k, v*this.decayFactor);
        });
    }
    
    /** return opponentMove prediction based on transition matrix (this.transitions) */
    predictOpponentsMove(lastRound : Round | null) : Map<Move, /** probability */ number> {
        let probabilities = new Map<Move, number>();
        let totalOccurrences = 0;
        for (const move of possibleMoves) {
            const occurences = this.getTransition([lastRound, move]);
            totalOccurrences += occurences;
            probabilities.set(move, occurences);
        }
        probabilities.forEach((v,k) => {
            probabilities.set(k, v/totalOccurrences);
        })
        return probabilities;
    }


    /** return ourMove based on opponentMove prediction */
    idealMoveForOpponentsMove(predictions: Map<Move, /** probability */ number>, game: Game) : Move {
        const moveList: Move[] = [];
        const probabilityRange : number[] = [];
        predictions.forEach((v, k) => {
            moveList.push(k)
            probabilityRange.push((probabilityRange[probabilityRange.length - 1] ?? 0) + v)
        });
        
        const index = randFromCumulativeProbabilityArray(probabilityRange);
        const move = moveList[index];
        
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
    }

    public clear() {
        this.transitions.clear();
    }
}

module.exports = new Bot();