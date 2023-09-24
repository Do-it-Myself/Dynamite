const training = require("./HMM5/index");
const reference = require("./HMM4/index")

// import { plot } from 'nodeplotlib'
const { plot } = require("nodeplotlib");

cache = new Map();

let start = 0.75;
let end = 0.9;
const tolerance = 1e-2;
const numIterations = 20;

// while (end - start > tolerance) {
//     let mid = (start + end) / 2;
//     const startWins = numWins(start);
//     const endWins = numWins(end);
//     if (startWins > endWins) {
//         end = mid;
//     } else {
//         start = mid;
//     }
//     console.log(`Start: ${start} ${startWins}`);
//     console.log(`End: ${end} ${endWins}`);
// }

const xArray = []
const yArray = []

for (i = 0.8; i < 1.0; i += 0.01) {
    const win = numWins(i)
    console.log(`${i}: ${win}`);
    xArray.push(i)
    yArray.push(win)
}

const result = (start + end) / 2;

console.log(`${result}: ${numWins(result)}`);

function numWins(paramValue) {
    training.setParam(0.0);
    let wins = 0;

    const cacheRes = cache.get(paramValue);
    if (cacheRes) {
        return cacheRes;
    }

    for (let iteration = 0; iteration < numIterations; iteration++) {
        let game = { rounds: [] };
        let theirGame = { rounds: [] };
        let score = 0;
        let theirScore = 0;
        let tieCounter = 0;

        for (let i = 0; i < 2500; i++) {
            let theirMove = reference.makeMove(theirGame);
            const move = training.makeMove(game);
            theirGame.rounds.push({ p2: theirMove, p1: move });
            game.rounds.push({ p1: theirMove, p2: move });

            // get results
            switch (move) {
                case "R":
                    if (theirMove == "P" || theirMove == "D") {
                        theirScore += (tieCounter + 1);
                        tieCounter = 0;
                    } else if (theirMove == "S" || theirMove == "W") {
                        score += (tieCounter + 1);
                        tieCounter = 0
                    } else {
                        tieCounter += 1
                    }
                    break;
                case "P":
                    if (theirMove == "S" || theirMove == "D") {
                        theirScore += (tieCounter + 1);
                        tieCounter = 0;
                    } else if (theirMove == "R" || theirMove == "W") {
                        score += (tieCounter + 1);
                        tieCounter = 0
                    } else {
                        tieCounter += 1
                    }
                    break;
                case "S":
                    if (theirMove == "R" || theirMove == "D") {
                        theirScore += (tieCounter + 1);
                        tieCounter = 0;
                    } else if (theirMove == "P" || theirMove == "W") {
                        score += (tieCounter + 1);
                        tieCounter = 0
                    } else {
                        tieCounter += 1
                    }
                    break;
                case "D":
                    if (theirMove == "W") {
                        theirScore += (tieCounter + 1);
                        tieCounter = 0;
                    } else if (theirMove == "R" || theirMove == "P" || theirMove == "S") {
                        score += (tieCounter + 1);
                        tieCounter = 0
                    } else {
                        tieCounter += 1
                    }
                    break;
                case "W":
                    if (theirMove == "R" || theirMove == "P" || theirMove == "S") {
                        theirScore += (tieCounter + 1);
                        tieCounter = 0;
                    } else if (theirMove == "D") {
                        score += (tieCounter + 1);
                        tieCounter = 0
                    } else {
                        tieCounter += 1
                    }
                    break;
                default:
                    throw new Error(move);
            }
            if (theirScore >= 1000 || score >= 1000) break;
        }
        if (score > theirScore) wins++;

        training.clear();
        reference.clear();
    }

    cache.set(paramValue, wins);
    return wins;
}

const plotData = [
    {
        x: xArray,
        y: yArray,
        type: 'scatter',
    },
]

plot(plotData)