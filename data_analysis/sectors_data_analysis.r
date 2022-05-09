if(!require("tidyverse"))install.packages("tidyverse")
library(tidyverse)

# Lire le fichier csv
df <- read.table(paste(getwd(), "/mémoire/CSV_data/sectors_data.csv", sep=""), header = TRUE, sep = ",")

colnames(df)

# Les variables sont dépendantes, mais attention : le test est sensible à la taille d'échantillon
chisq.test(df$sector_floor, df$sector_ceil)

for (i in 1:max(df$level_id)) {
  currData <- df[df$level_id == i,]
  print(table(factor(currData$sector_floor)))
}


