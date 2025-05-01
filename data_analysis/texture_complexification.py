import csv
import json

resultdir = '../CSV_data/'

SEC_DAT = {}
SID_DAT = {}

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

new_sector_surfaces = {}

#########################
# DATA FOR NEW TEXTURES #
#########################

for i in range(1, 28):
    currLvl = "level_"+str(i)
    floor_and_ceil_tex = []
    wall_tex = []
    new_sector_surfaces[currLvl] = []
    for row in SEC_DAT[currLvl]:
        f_is_new_tex = True
        c_is_new_tex = True
        f = row["sector_floor"].upper()
        c = row["sector_ceil"].upper()
        for v in new_sector_surfaces.values():
            if f in v:
                f_is_new_tex = False
            if c in v:
                c_is_new_tex = False
        if f_is_new_tex:
            floor_and_ceil_tex.append(f)
        if c_is_new_tex:
            floor_and_ceil_tex.append(c)
    for row in SID_DAT[currLvl]:
        u_is_new_tex = True
        l_is_new_tex = True
        m_is_new_tex = True
        u = row["upper_texture"].upper()
        l = row["lower_texture"].upper()
        m = row["middle_texture"].upper()
        for v in new_sector_surfaces.values():
            if u in v:
                u_is_new_tex = False
            if l in v:
                l_is_new_tex = False
            if m in v:
                m_is_new_tex = False
        if u_is_new_tex and u != "-":
            wall_tex.append(u)
        if l_is_new_tex and l != "-":
            wall_tex.append(l)
        if m_is_new_tex and m != "-":
            wall_tex.append(m)
    new_sector_surfaces[currLvl] += list(dict.fromkeys(floor_and_ceil_tex))
    new_sector_surfaces[currLvl] += list(dict.fromkeys(wall_tex))

# Serializing json
json_object = json.dumps(new_sector_surfaces, indent=4)

# Writing to sample.json
with open("new_textures.json", "w") as outfile:
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

with open(resultdir+"new_textures.csv", 'w', encoding='UTF-8') as outputFile:
    writer = csv.writer(outputFile)
    writer.writerow(["level_id", "name", "n_new_texture"])
    for key, row in new_sector_surfaces.items():
        writer.writerow([key, names[key], len(row)])
