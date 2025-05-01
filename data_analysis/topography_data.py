import csv
import json
import math

resultdir = '../CSV_data/'

SEC_DAT = {}

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

all_heights_data = {}

for i in range(1, 28):
    currLvl = "level_"+str(i)
    all_heights_data[currLvl] = {}
    all_heights_data[currLvl]["floor"] = []
    all_heights_data[currLvl]["ceil"] = []
    for row in SEC_DAT[currLvl]:
        f = int(row["floor_height"])
        all_heights_data[currLvl]["floor"].append(f)
        c = int(row["ceiling_height"])
        all_heights_data[currLvl]["ceil"].append(c)

topography_data = {}

for k, v in all_heights_data.items():
    topography_data[k] = {}
    floor_ceil_diff = []
    for i in range(0, len(v["floor"])):
        floor_ceil_diff.append(v["ceil"][i]-v["floor"][i])
    mean_floor = sum(v["floor"])/len(v["floor"])
    topography_data[k]["mean_floor"] = mean_floor
    f = [int(num) for num in v["floor"]]
    f.sort()
    topography_data[k]["median_floor"] = f[round(len(f)/2)]
    variance_floor = 0
    for floor in v["floor"]:
        variance_floor += (floor - mean_floor)**2
    n = len(v["floor"])
    variance_floor = variance_floor / n
    stdr_dev_floor = math.sqrt(variance_floor)
    topography_data[k]["stdr_dev_floor"] = stdr_dev_floor
    topography_data[k]["max_floor"] = max(v["floor"])
    topography_data[k]["min_floor"] = min(v["floor"])
    topography_data[k]["diff_min_max_floor"] = max(v["floor"])-min(v["floor"])
    mean_ceil = sum(v["ceil"])/len(v["ceil"])
    topography_data[k]["mean_ceil"] = mean_ceil
    variance_ceil = 0
    for ceil in v["ceil"]:
        variance_ceil += (ceil - mean_ceil)**2
    n = len(v["ceil"])
    variance_ceil = variance_ceil / n
    stdr_dev_ceil = math.sqrt(variance_ceil)
    topography_data[k]["stdr_dev_ceil"] = stdr_dev_ceil
    topography_data[k]["max_ceil"] = max(v["ceil"])
    topography_data[k]["min_ceil"] = min(v["ceil"])
    topography_data[k]["diff_min_max_ceil"] = max(v["ceil"])-min(v["ceil"])
    topography_data[k]["mean_diff_floor_ceil"] = sum(
        floor_ceil_diff) / len(floor_ceil_diff)
    topography_data[k]["max_diff_floor_ceil"] = max(floor_ceil_diff)
    topography_data[k]["min_diff_floor_ceil"] = min(floor_ceil_diff)

# Serializing json
json_object = json.dumps(all_heights_data, indent=4)

# Writing to sample.json
with open("topography.json", "w") as outfile:
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

with open(resultdir+"topography.csv", 'w', encoding='UTF-8') as outputFile:
    writer = csv.writer(outputFile)
    writer.writerow(["level_id", "name"] +
                    list(topography_data["level_1"].keys()))
    for key, row in topography_data.items():
        writer.writerow([key, names[key]]+[v for v in row.values()])
