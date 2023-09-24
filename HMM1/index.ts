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

type Round = {
    p1: Move,
    p2: Move
}

type Game = {
    rounds: Round[];
};

type Serialized = { rounds: { p1: string, p2: string }[] };

function gameFromJson(json: Serialized) : Game {
    return {
        rounds: [...json.rounds.map(({ p1, p2 }) => {
            return { p1: stringToMove(p1), p2: stringToMove(p2) };
        })]
    }
}

class Bot {
    constructor() {
        this.transitions = new Map();
        for (let i = 0; i < possibleMoves.length; i++) {
            this.setTransition([null, possibleMoves[i]], 1);
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
        
        const predictions = this.predictOpponentsMove(gamestate.rounds[gamestate.rounds.length - 2] ?? null);
        const ourMove = this.idealMoveForOpponentsMove(predictions, gamestate);
        return ourMove;
    }
    
    /** update transition matrix (this.transitions) */ 
    update(round: Round, lastRound: Round | null) {
        const decayFactor = 0.9;
        this.incrementTransition([lastRound, round.p2]);
        this.transitions.forEach((v,k) => {
            this.transitions.set(k, v*decayFactor);
        });
    }
    
    /** return opponentMove prediction based on transition matrix (this.transitions) */
    predictOpponentsMove(currRound : Round | null) : Move {
        let predictedMove = possibleMoves[0]
        for (let possibleMove of possibleMoves) {
            if (this.getTransition([currRound,possibleMove]) > this.getTransition([currRound,predictedMove])) {
                predictedMove = possibleMove;
            }
        }
        return predictedMove;
    }


    /** return ourMove based on opponentMove prediction */
    idealMoveForOpponentsMove(opponentsPredictedMove: Move, game: Game) : Move {
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
    }

    public clear() {
        this.transitions.clear();
    }
}

module.exports = new Bot();