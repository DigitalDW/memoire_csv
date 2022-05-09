import os
import re
rootdir = './'
resultdir = './results/sectors_data/'
hexRegex = re.compile(r'[^\x00-\x7f]')
spacesRegex = re.compile(r'[ ]+')
secondWordStartRegex = re.compile(r'(?<=\d)[A-Z]')

for subdir, dirs, files in os.walk(rootdir):
    for file in files:
        currFile = os.path.join(subdir, file)
        if 'SECTORS' in currFile and len(currFile) <= 18:
            newFile = subdir.removeprefix('.') + '_sector_data.txt'
            with open(currFile, 'rb') as inputFile:
                data = inputFile.read()
                text = "episode mission sector_floor sector_ceil\n"
                final = ''
                for byteInt in data:
                    byte = byteInt.to_bytes(
                        (byteInt.bit_length() + 7) // 8, 'big')
                    byteStrUTF8 = byte.decode("cp437").encode(
                        'utf-8', errors='ignore').decode()
                    byteStrUTF8 = re.sub(hexRegex, " ", byteStrUTF8)
                    if not byteStrUTF8.islower() and (byteStrUTF8.isalnum() or byteStrUTF8 == '_' or byteStrUTF8 == " ") and not (byteStrUTF8 == "X" or byteStrUTF8 == "P" or byteStrUTF8 == "H"):
                        final += byteStrUTF8
                final = re.sub(spacesRegex, "\n", final)
                finalArr = final.split('\n')

                for el in finalArr:
                    if len(el) > 4:
                        matches = [(m.start(0), m.end(0))
                                   for m in re.finditer(secondWordStartRegex, el)]
                        start = 0
                        indexesList = []
                        for i in matches:
                            indexesList.append(i)
                        for indexes in indexesList:
                            i = indexes[0] + start
                            el = el[:i] + " " + el[i:] + "\n"
                            start += 1

                        elList = el.split(' ')
                        for i, e in enumerate(elList):
                            if len(e) < 4:
                                elList.pop(i)

                        el = ""
                        el += newFile[2] + " "
                        el += newFile[4] + " "
                        for i, e in enumerate(elList):
                            if i % 2 == 0:
                                if i >= 2:
                                    el += newFile[2] + " "
                                    el += newFile[4] + " "
                                el += e + " "
                            else:
                                el += e + "\n"

                        text += el

                with open(resultdir+newFile, 'w', encoding='UTF-8') as outputFile:
                    text = re.sub(r"STE", r"STEP", text)
                    text = re.sub(r" ", r",", text)
                    text = re.sub(r"\n+", r"\n", text)
                    outputFile.write(text)
