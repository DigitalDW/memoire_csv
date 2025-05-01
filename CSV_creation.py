import os
import csv

rootdir = './results/'
resultdir = './CSV_data/'

conversion_table = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25, 26, 27]
]

for subdir, dirs, _ in os.walk(rootdir):
    for d in dirs:
        with open(resultdir+d+".csv", 'w', encoding='UTF-8') as outputFile:
            writer = csv.writer(outputFile)
            idx = 0
            for _, _, files in os.walk(rootdir+d):
                for i, file in enumerate(files):
                    idxrow = 0
                    with open(rootdir+d+"/"+file, 'r') as inputFile:
                        readData = inputFile.read()
                        rows = readData.split('\n')
                        for row in rows:
                            rowData = row.split(',')
                            if len(rowData) > 1:
                                if idx == 0 and idxrow == 0:
                                    rowData.insert(0, 'level_id')
                                    writer.writerow(rowData)
                                elif idx != 0 and idxrow != 0:
                                    rowData.insert(
                                        0, conversion_table[int(rowData[0])-1][int(rowData[1])-1])
                                    writer.writerow(rowData)
                            idx += 1
                            idxrow += 1
