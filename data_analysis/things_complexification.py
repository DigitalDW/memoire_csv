import csv
import json

resultdir = '../CSV_data/'

THI_DAT = {}

with open('../CSV_data/things_data.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if row[0] != "level_id":
            if "level_"+row[0] not in THI_DAT.keys():
                THI_DAT["level_" + row[0]] = []
            THI_DAT["level_"+row[0]].append({
                "episode": row[1],
                "mission": row[2],
                "x_position": row[3],
                "y_position": row[4],
                "direction": row[5],
                "type": row[6],
                "flags": row[7],
            })

new_things = {}

for i in range(1, 28):
    currLvl = "level_"+str(i)
    things = []
    wall_tex = []
    new_things[currLvl] = []
    for row in THI_DAT[currLvl]:
        t_is_new_thing = True
        t = row["type"].upper()
        for v in new_things.values():
            if t in v:
                t_is_new_thing = False
        if t_is_new_thing:
            things.append(t)
    new_things[currLvl] += list(dict.fromkeys(things))

# Serializing json
json_object = json.dumps(new_things, indent=4)

# Writing to sample.json
with open("new_things.json", "w") as outfile:
    outfile.write(json_object)

names = {
    "level_1": "E1M1",
    "level_2": "E1M2",
    "level_3": "E1M3",
    "level_4": "E1M4",
    "level_5": "E1M5",
    "level_6": "E1M6",
    "level_7": "E1M7",
    "level_8": "E1M8",
    "level_9": "E1M9",
    "level_10": "E2M1",
    "level_11": "E2M2",
    "level_12": "E2M3",
    "level_13": "E2M4",
    "level_14": "E2M5",
    "level_15": "E2M6",
    "level_16": "E2M7",
    "level_17": "E2M8",
    "level_18": "E2M9",
    "level_19": "E3M1",
    "level_20": "E3M2",
    "level_21": "E3M3",
    "level_22": "E3M4",
    "level_23": "E3M5",
    "level_24": "E3M6",
    "level_25": "E3M7",
    "level_26": "E3M8",
    "level_27": "E3M9",
}

with open(resultdir+"new_things.csv", 'w', encoding='UTF-8') as outputFile:
    writer = csv.writer(outputFile)
    writer.writerow(["level_id", "name", "n_new_thing"])
    for key, row in new_things.items():
        writer.writerow([key, names[key], len(row)])
