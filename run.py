import os
import subprocess

def runBot(a, b):
    cmd = r'.\node.exe .\tournament.js .\{}\index.js .\{}\index.js'.format(a,b,a,b)
    os.system(cmd)

if __name__ == "__main__":
    bots = ["Rock", "Paper", "Scissors", "Random", "RandomWithDynamiteLogic", "RandomRockPaperScissorsOnly", "RandomWithEvenlySpreadDynamite", "RepeatOpponent", "10Cycle", "DefeatOpponent", "HMM1", "HMM2", "HMM3"]
    # bots = [f"HMM{x}" for x in range(5,6)]
    # bots = ["HMM4"]
    iterations = 10

    for opponent in bots:
        for _ in range(iterations):
            print(f"\nVS {opponent}")
            runBot("TheBestOne", opponent)
            print("")

    # runBot("HMM4", "HMM5")
