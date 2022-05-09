import os
import re
rootdir = './'
resultdir = './results/nodes_data/'
hexRegex = re.compile(r'[^\x00-\x7f]')
spacesRegex = re.compile(r'[ ]+')
secondWordStartRegex = re.compile(r'(?<=\d)[A-Z]')

for subdir, dirs, files in os.walk(rootdir):
    for file in files:
        currFile = os.path.join(subdir, file)
        if 'NODES' in currFile:
            newFile = subdir.removeprefix('.') + '_node_data.txt'
            with open(currFile, 'rb') as inputFile:
                data = inputFile.read()
                final = 'episode mission partition_x partition_y partition_x_diff partition_y_diff rbox_top rbox_bottom rbox_left rbox_right lbox_top lbox_bottom lbox_left lbox_right rchild lchild\n'
                offsets = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                compteur = 0
                compteurOffset = 0
                while compteur < len(data):
                    if compteurOffset == 0:
                        final += newFile[2] + " "
                        final += newFile[4] + " "
                    col = data[compteur:compteur+offsets[compteurOffset]]
                    col.replace(b'\x00', b'')
                    if len(col) == 2:
                        if compteurOffset == len(offsets) - 2 or compteurOffset == len(offsets) - 1:
                            final += str(int.from_bytes(col,
                                                        byteorder='little')) + " "
                        else:
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
