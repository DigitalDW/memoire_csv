import os
import re
rootdir = './'
resultdir = './results/sidedefs_data/'
hexRegex = re.compile(r'[^\x00-\x7f]')
spacesRegex = re.compile(r'[ ]+')
secondWordStartRegex = re.compile(r'(?<=\d)[A-Z]')

for subdir, dirs, files in os.walk(rootdir):
    for file in files:
        currFile = os.path.join(subdir, file)
        if 'SIDEDEFS' in currFile:
            newFile = subdir.removeprefix('.') + '_sidedef_data.txt'
            with open(currFile, 'rb') as inputFile:
                data = inputFile.read()
                final = 'episode mission x_offset y_offset upper_texture lower_texture middle_texture sector\n'
                offsets = [2, 2, 8, 8, 8, 2]
                compteur = 0
                compteurOffset = 0
                while compteur < len(data):
                    if compteurOffset == 0:
                        final += newFile[2] + " "
                        final += newFile[4] + " "
                    col = data[compteur:compteur+offsets[compteurOffset]]
                    col.replace(b'\x00', b'')
                    if (len(col) == 2):
                        final += str(int.from_bytes(col,
                                     byteorder='little', signed=True)) + " "
                    else:
                        converted = col.decode().replace('\x00', '')
                        final += converted + " "
                    compteur += offsets[compteurOffset]
                    compteurOffset += 1
                    if compteurOffset == len(offsets):
                        compteurOffset = 0
                        final += "\n"
                with open(resultdir+newFile, 'w', encoding='UTF-8') as outputFile:
                    final = re.sub(r" ", r",", final)
                    final = re.sub(r"\n+", r"\n", final)
                    final = re.sub(r",\n", r"\n", final)
                    outputFile.write(final)
