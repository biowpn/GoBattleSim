from __future__ import print_function, division
import pokelibrary as plib
import csv


inputfilename = "GAME_MASTER.json"
outputfilename = "result.csv"

# choose typical IVs for atkr
IVs = [15,15,15]

# choose enemy DPS1
enemyDPS1_mean = 900


fmovedata, cmovedata, speciesdata, cpMultiplier, typeadvantages = plib.importGM(inputfilename)

output = []

for dex, mon in enumerate(speciesdata):
    if dex == 0: continue

    for fm in mon.fmoves:
        if fm.name.lower() in ["transform", "splash", "struggle", "struggle bug"]: continue
        
        for cm in mon.cmoves:
            if cm.name.lower() in ["transform", "splash", "struggle", "struggle bug"]: continue

            atk_ = (mon.bstats[0] + IVs[0]) * 0.79
            def_ = (mon.bstats[1] + IVs[1]) * 0.79
            sta_ = (mon.bstats[2] + IVs[2]) * 0.79

            fSTAB = 1
            if fm.dtype in [mon.type1, mon.type2]:
                fSTAB = 1.2
            cSTAB = 1
            if cm.dtype in [mon.type1, mon.type2]:
                cSTAB = 1.2

            # use DEF=160 as a base
            FDmg = 0.5*atk_*fm.power*fSTAB/160 + 0.5
            CDmg = 0.5*atk_*cm.power*cSTAB/160 + 0.5
            FDur = fm.duration/1000
            CDur = cm.duration/1000
            FE = fm.energygain
            CE = cm.energycost

            # Energy left (x) and enemy DPS (y)
            x = 0.5*CE + 0.5*FE
            y = enemyDPS1_mean / def_
            

            # Step 1: Get the Survival Time
            ST = sta_ / y

            # Step 2: Apply punishment for one-bar charge moves overcharge
            if CE == 100:
                CE += 0.5 * FE + 0.5 * y * (cm.dws/1000) 
            
            # Step 3: Get the total number of fast moves
            n = (ST*CE + CDur*(x-0.5*sta_))/(FDur*CE + CDur*FE)

            # Step 4: Get the total number of charge moves
            m = (ST*FE - FDur*(x-0.5*sta_))/(FDur*CE + CDur*FE)   

            # Step 5: Get TDO
            compTDO = n * FDmg + m * CDmg

            # DPS
            compDPS = compTDO/ST

            # rounding
            compDPS = round(compDPS, 3)
            compTDO = round(compTDO, 3)

            # put the current result to output
            output += [[dex, mon.name, fm.name, cm.name, compDPS, compTDO]]



# delete duplicates caused by moves being in more than one legacy:
output2 = []
output2IDs = []
for n in range(len(output)):
    if not (output[n][1:4] in output2IDs):
        output2IDs += [output[n][1:4]]
        output2 += [output[n]]


colHeaders = ["Dex", "Pokemon", "Fast Move", "Charged Move", "DPS", "TDO"]


print("Writing to file %s... " % outputfilename, end="")
with open(outputfilename, 'w', newline='') as csvfile:
    mywriter = csv.writer(csvfile)
    mywriter.writerow(colHeaders)
    for line in output2:
        mywriter.writerow(line)
    csvfile.close()
print("done.")

