from calendar import c
import csv
import json
import math
from os import cpu_count

resultdir = '../CSV_data/'

SEC_DAT = {}
LIN_DAT = {}
SID_DAT = {}
THI_DAT = {}
VER_DAT = {}

with open('../CSV_data/sectors_data.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if row[0] != "level_id":
            if "level_"+row[0] not in SEC_DAT.keys():
                SEC_DAT["level_" + row[0]] = []
            SEC_DAT["level_"+row[0]].append({
                "episode": row[1],
                "mission": row[2],
                "floor_height": row[3],
                "ceiling_height": row[4],
                "sector_floor": row[5],
                "sector_ceil": row[6],
                "light_level": row[7],
                "speial": row[8],
                "tag": row[9]
            })

with open('../CSV_data/linedefs_data.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if row[0] != "level_id":
            if "level_"+row[0] not in LIN_DAT.keys():
                LIN_DAT["level_" + row[0]] = []
            LIN_DAT["level_"+row[0]].append({
                "episode": row[1],
                "mission": row[2],
                "vertex_1": row[3],
                "vertex_2": row[4],
                "flags": row[5],
                "action_special": row[6],
                "sector_tag": row[7],
                "front_side": row[8],
                "back_side": row[9],
            })

with open('../CSV_data/sidedefs_data.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if row[0] != "level_id":
            if "level_"+row[0] not in SID_DAT.keys():
                SID_DAT["level_" + row[0]] = []
            SID_DAT["level_"+row[0]].append({
                "episode": row[1],
                "mission": row[2],
                "x_offset": row[3],
                "y_offset": row[4],
                "upper_texture": row[5],
                "lower_texture": row[6],
                "middle_texture": row[7],
                "sector": row[8],
            })

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

with open('../CSV_data/vertexes_data.csv') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if row[0] != "level_id":
            if "level_"+row[0] not in VER_DAT.keys():
                VER_DAT["level_" + row[0]] = []
            VER_DAT["level_"+row[0]].append({
                "episode": row[1],
                "mission": row[2],
                "number": row[3],
                "x_position": int(row[4]),
                "y_position": int(row[5]),
            })


def change_dat(dat, n, x, y, v, d, p):
    # print("Remplacement dans "+dat+" pour la position de joueur [" + str(p[x]) + "," + str(p[y]) + "] :\n",
    #       "* number passe de " +
    #       closest_vertices[currLvl][dat][n] + " à " + v[n] + "\n",
    #       "* x passe de " +
    #       str(closest_vertices[currLvl][dat][x]) + " à " + str(v[x]) + "\n",
    #       "* y passe de " +
    #       str(closest_vertices[currLvl][dat][y]) + " à " + str(v[y]) + "\n",
    #       "* la distance passe de " + str(closest_vertices[currLvl][dat]["dist"]) + " à " + str(d) + "\n")
    closest_vertices[currLvl][dat][n] = v[n]
    closest_vertices[currLvl][dat][x] = v[x]
    closest_vertices[currLvl][dat][y] = v[y]
    closest_vertices[currLvl][dat]["dist"] = d


levels = []
exits = {}
for i in range(1, 28):
    currLvl = "level_"+str(i)
    exits[currLvl] = []
    for row in LIN_DAT[currLvl]:
        t = row["action_special"].upper()
        if t == "11" or t == "52":
            exits[currLvl] += [row["front_side"]]
    compteur = 0
    for row in SID_DAT[currLvl]:
        for idx, ex in enumerate(exits[currLvl]):
            if str(compteur) == ex:
                exits[currLvl][idx] = row["sector"]
        compteur += 1

for k, e in exits.items():
    if len(exits[k]) < 1:
        exits[k].append('-1')
    exits[k] = list(dict.fromkeys(e))
    if len(exits[k]) == 1:
        exits[k] = int(exits[k][0])

sectors = {}
for i in range(1, 28):
    currLvl = "level_"+str(i)
    e = exits[currLvl]
    sectors[currLvl] = ''
    compteur = 0
    for row in SEC_DAT[currLvl]:
        if compteur == e and e != 0:
            sectors[currLvl] = row["floor_height"]
        compteur += 1

player_starts = {}
for i in range(1, 28):
    currLvl = "level_"+str(i)
    player_starts[currLvl] = 0
    for row in THI_DAT[currLvl]:
        for k, v in row.items():
            if k == "type" and v == "1":
                player_starts[currLvl] = {
                    "x_position": int(row["x_position"]), "y_position": int(row["y_position"])}

closest_vertices = {}
for i in range(1, 28):
    currLvl = "level_"+str(i)
    p = player_starts[currLvl]
    x = "x_position"
    y = "y_position"
    n = "number"
    closest_vertices[currLvl] = {
        "v1": {n: '', x: 0, y: 0, "dist": 0},
        "v2": {n: '', x: 0, y: 0, "dist": 0},
        "v3": {n: '', x: 0, y: 0, "dist": 0},
        "v4": {n: '', x: 0, y: 0, "dist": 0},
        "player_start": p,
    }
    coeff = 5000
    comp_px = p[x]
    comp_py = p[y]
    comp_px += coeff
    comp_py += coeff
    for v in VER_DAT[currLvl]:
        comp_vx = v[x] + coeff
        comp_vy = v[y] + coeff
        vector = [comp_vx - comp_px, comp_vy - comp_py]
        norm = math.sqrt(vector[0]**2 + vector[1]**2)
        d = [vector[0] / norm, vector[1] / norm]

        if d[0] < 0 and d[1] > 0:
            if closest_vertices[currLvl]["v1"][n] == '':
                change_dat("v1", n, x, y, v, norm, p)
            if closest_vertices[currLvl]["v1"]["dist"] > norm:
                change_dat("v1", n, x, y, v, norm, p)

        elif d[0] > 0 and d[1] > 0:
            if closest_vertices[currLvl]["v2"][n] == '':
                change_dat("v2", n, x, y, v, norm, p)
            if closest_vertices[currLvl]["v2"]["dist"] > norm:
                change_dat("v2", n, x, y, v, norm, p)

        elif d[0] < 0 and d[1] < 0:
            if closest_vertices[currLvl]["v3"][n] == '':
                change_dat("v3", n, x, y, v, norm, p)
            if closest_vertices[currLvl]["v3"]["dist"] > norm:
                change_dat("v3", n, x, y, v, norm, p)

        elif d[0] > 0 and d[1] < 0:
            if closest_vertices[currLvl]["v4"][n] == '':
                change_dat("v4", n, x, y, v, norm, p)
            if closest_vertices[currLvl]["v4"]["dist"] > norm:
                change_dat("v4", n, x, y, v, norm, p)

# Serializing json
json_object = json.dumps(closest_vertices, indent=4)

# Writing to sample.json
with open("clostest_vertices.json", "w") as outfile:
    outfile.write(json_object)

heights = {}
found_exits = [70, 48, 5, 57, 113, 31, 112, 66, 45, 32, 9, 113, 168,
               116, 164, 59, 0, 16, 28, 37, 174, 59, 154, 30, 139, 0, 60]
found_starts = [29, 38, 62, 72, 60, 122, 60, 9, 94, 77, 173, 6,
                198, 128, 148, 181, 5, 17, 30, 60, 19, 18, 64, 41, 36, 15, 15]
found_data = {}
for lvl_n in range(1, 28):
    currLvl = "level_"+str(lvl_n)
    vertices = []
    print("### "+currLvl+" ###")
    print("### VERTICES ###")
    for values in closest_vertices[currLvl].values():
        if "number" in values.keys():
            print(values["number"])
            vertices.append(values["number"])

    print("\n### SIDEDEFS ###")
    lines = []
    for i in vertices:
        for row in LIN_DAT[currLvl]:
            if row["vertex_1"] == i:
                print(row)
                lines.append(row["front_side"])

    print("\n### SECTORS ###")
    sidedefs = []
    for line in lines:
        print(SID_DAT[currLvl][int(line)]["sector"])
        sidedefs.append(SID_DAT[currLvl][int(line)]["sector"])

    print("\n### MOST OCCURENCES ###")
    vals = {}
    for sidedef in sidedefs:
        if sidedef not in vals.keys():
            vals[str(sidedef)] = 0
        vals[str(sidedef)] += 1

    max_val = 0
    most_occurrences = ''
    for k, v in vals.items():
        if v > max_val:
            max_val = v
            most_occurrences = k

    print(most_occurrences)

    print("\n### HEIGHTS CALCULATIONS ###")
    print("### EVERY HEIGHT ###")
    height = 0
    heights[currLvl] = []
    for sidedef in sidedefs:
        print(SEC_DAT[currLvl][int(sidedef)]["floor_height"])
        heights[currLvl].append(
            int(SEC_DAT[currLvl][int(sidedef)]["floor_height"]))

    mean = sum(heights[currLvl])/len(heights[currLvl])
    print("### MEAN HEIGHT ###")
    print(mean)

    height = SEC_DAT[currLvl][int(most_occurrences)]["floor_height"]
    print("### MOST OCCURENCE HEIGHT ###")
    print(height)

    heights[currLvl] = {"most_occurrences": height, "mean": mean}

    found_data[currLvl] = {}
    found_data[currLvl]["found_start_height"] = SEC_DAT[currLvl][found_starts[lvl_n-1]]["floor_height"]
    found_data[currLvl]["found_exits_height"] = SEC_DAT[currLvl][found_exits[lvl_n-1]]["floor_height"]
    print("###     END    ###")
    print("\n")

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

with open(resultdir+"elevation_changes.csv", 'w', encoding='UTF-8') as outputFile:
    writer = csv.writer(outputFile)
    for i in range(1, 28):
        currLvl = "level_"+str(i)
        sector = sectors[currLvl]
        height = heights[currLvl]
        found = found_data[currLvl]
        # print(height, currLvl)
        if sector == '':
            sector = '0'
        writer.writerow([currLvl, names[currLvl], int(sector),
                         int(height["most_occurrences"]), int(height["mean"]),
                         int(found["found_start_height"]), int(found["found_exits_height"])])
