const div = document.getElementById("level");
const select = document.getElementById("level_select");
const d_sectors = document.getElementById("d_sectors");
const order = document.getElementById("order");
const v_points = document.getElementById("vert_points");
const front = document.getElementById("front");
const back = document.getElementById("back");
const line_dir = document.getElementById("line_dir");

select.addEventListener("change", changed);
d_sectors.addEventListener("change", changed);
order.addEventListener("change", changed);
v_points.addEventListener("change", changed);
front.addEventListener("change", changed);
back.addEventListener("change", changed);
line_dir.addEventListener("change", changed);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", "100%")
  .attr("height", 5000);

markerBoxWidth = 20;
markerBoxHeight = 20;
refX = 3;
refY = 1.5;
arrowPoints = [
  [0, 0],
  [0, 3],
  [3, 1.5],
];

svg
  .append("defs")
  .append("marker")
  .attr("id", "arrow")
  .attr("viewBox", [0, 0, markerBoxWidth, markerBoxHeight])
  .attr("refX", refX)
  .attr("refY", refY)
  .attr("markerWidth", markerBoxWidth)
  .attr("markerHeight", markerBoxHeight)
  .attr("orient", "auto-start-reverse")
  .append("path")
  .attr("d", d3.line()(arrowPoints))
  .attr("stroke", "black");

const level = svg.append("g");
const sectors = level.append("g").attr("id", "sectors");
const linedefs = level.append("g").attr("id", "linedefs");
const things = level.append("g").attr("id", "things");
const vertices = level.append("g").attr("id", "vertices");

function draw(d_sectors, order, v_points, front, back, line_dir) {
  d3.csv("../CSV_data/vertexes_data.csv").then((vertex_data) => {
    d3.csv("../CSV_data/linedefs_data.csv").then((linedefs_data) => {
      d3.csv("../CSV_data/sidedefs_data.csv").then((sidedefs_data) => {
        d3.csv("../CSV_data/things_data.csv").then((things_data) => {
          d3.csv("../CSV_data/sectors_data.csv").then((sectors_data) => {
            /* ###########
            DATA FILTERING
            ########### */
            const filtered_vertex = vertex_data.filter(
              (row) =>
                row.episode == select.value[1] && row.mission == select.value[3]
            );

            const filtered_linedefs = linedefs_data.filter(
              (row) =>
                row.episode == select.value[1] && row.mission == select.value[3]
            );

            const filtered_sidedefs = sidedefs_data.filter(
              (row) =>
                row.episode == select.value[1] && row.mission == select.value[3]
            );

            const filtered_sectors = sectors_data.filter(
              (row) =>
                row.episode == select.value[1] && row.mission == select.value[3]
            );

            const player = things_data.filter(
              (row) =>
                row.episode == select.value[1] &&
                row.mission == select.value[3] &&
                row.type == 1
            );

            /* ####
            SACLING
            #### */
            let min_x = Math.min(
              ...filtered_vertex.map((row) => Number(row.x_position))
            );
            let max_x = Math.max(
              ...filtered_vertex.map((row) => Number(row.x_position))
            );
            let min_y = Math.min(
              ...filtered_vertex.map((row) => Number(row.y_position))
            );
            let max_y = Math.max(
              ...filtered_vertex.map((row) => Number(row.y_position))
            );

            let ratio_x_y = (max_y - min_y) / (max_x - min_x);

            let range_x = [min_x, max_x];
            let range_y = [min_y, max_y];

            let min = 10;
            let max = 1500;
            let desired_range_x = [min, max];
            let desired_range_y = [min, max * ratio_x_y];

            /* ###############
            COORDINATE SCALING
            ############### */
            filtered_vertex.forEach((row) => {
              row.x_position = convert_range(
                row.x_position,
                range_x,
                desired_range_x
              );
              row.y_position = convert_range(
                row.y_position,
                range_y,
                desired_range_y
              );
            });

            player[0].x_position = convert_range(
              player[0].x_position,
              range_x,
              desired_range_x
            );
            player[0].y_position = convert_range(
              player[0].y_position,
              range_y,
              desired_range_y
            );

            /* ################# 
            ADDING DATA TO LINES
            ################# */
            const lineGenerator = d3.line();
            filtered_linedefs.forEach((row) => {
              const vertex_1 = filtered_vertex[Number(row.vertex_1)];
              const vertex_2 = filtered_vertex[Number(row.vertex_2)];
              row["vertex_1_pos"] = [vertex_1.x_position, vertex_1.y_position];
              row["vertex_2_pos"] = [vertex_2.x_position, vertex_2.y_position];
              row["path"] = lineGenerator([
                [vertex_1.x_position, vertex_1.y_position],
                [vertex_2.x_position, vertex_2.y_position],
              ]);
              const right_sidedef = filtered_sidedefs[Number(row.front_side)];
              const left_sidedef =
                Number(row.back_side) == 65535
                  ? "-"
                  : filtered_sidedefs[Number(row.back_side)];
              row["right_sidedef"] = right_sidedef.sector;
              row["left_sidedef"] =
                left_sidedef == "-" ? "--" : left_sidedef.sector;
            });

            /* ###########
            DRAW FUNCTIONS
            ########### */
            draw_vertices(filtered_vertex, v_points);

            draw_start(player);

            draw_sectors(
              filtered_linedefs,
              filtered_sectors,
              filtered_vertex,
              lineGenerator,
              order,
              d_sectors
            );

            draw_linedefs(filtered_linedefs, front, back, line_dir);
          });
        });
      });
    });
  });
}

function draw_sectors(
  filtered_linedefs,
  filtered_sectors,
  filtered_vertex,
  lineGenerator,
  order,
  d_sectors
) {
  sectors.selectAll(".sec").remove();
  if (d_sectors) {
    // TODO: get polygons
    const lines = filtered_linedefs.map((row, i) => {
      const sector_r = Number(row.right_sidedef);
      const sector_l = Number(row.left_sidedef);
      return {
        v: [+row.vertex_1, +row.vertex_2],
        v_xy: [row.vertex_1_pos, row.vertex_2_pos],
        h_r: [
          filtered_sectors[sector_r].floor_height,
          filtered_sectors[sector_l]?.floor_height ?? "--",
        ],
        s: [sector_r, sector_l ?? "--"],
        i: i,
      };
    });

    const polygons = get_polygons(
      lines,
      filtered_sectors,
      filtered_vertex,
      lineGenerator
    );

    polygons.forEach((polygon, idx) => {
      polygon["h"] = Number(filtered_sectors[polygon.sector].floor_height);
    });

    const heights = polygons.map((poly) => poly.h);
    const h_range = [Math.max(...heights), Math.min(...heights)];
    const color_range = [360, 200];

    polygons.forEach(
      (poly, p) =>
        (polygons[p].h = convert_range(polygons[p].h, h_range, color_range))
    );

    sectors
      .selectAll(".sec")
      .data(polygons)
      .enter()
      .append("path")
      .attr("class", "sec")
      .attr("stroke", "none")
      .attr("fill", (d) => `hsl(${d.h}, 80%, 50%)`)
      .attr("stroke-width", "2px")
      .attr("d", (d) => d.path)
      .on("mouseover", (e) => (e.target.style.opacity = "0.7"))
      .on("mouseout", (e) => (e.target.style.opacity = "1"));
  }
}

function draw_vertices(filtered_vertex, v_points) {
  /* ##########
  DRAW VERTICES
  ########## */
  vertices.selectAll(".vertices").remove();
  vertices
    .selectAll(".vertices")
    .data(filtered_vertex)
    .enter()
    .append("circle")
    .attr("class", "vertices")
    .attr("cx", (d) => Number(d.x_position))
    .attr("cy", (d) => Number(d.y_position))
    .attr("r", 2)
    .attr("fill", "black");

  if (v_points) {
    vertices.selectAll(".vertices_number").remove();
    vertices
      .selectAll(".vertices_number")
      .data(filtered_vertex)
      .enter()
      .append("text")
      .attr("class", "vertices_number")
      .attr("x", (d) => Number(d.x_position) + 2)
      .attr("y", (d) => Number(d.y_position) - 2)
      .text((d, i) => i)
      .attr("font-size", 8)
      .attr("fill", "grey");
  } else {
    vertices.selectAll(".vertices_number").remove();
  }
}

function draw_linedefs(filtered_linedefs, front, back, line_dir) {
  /* ##########
  DRAW LINEDEFS
  ########## */
  if (line_dir) {
    linedefs.selectAll(".lines").remove();
    linedefs
      .selectAll(".lines")
      .data(filtered_linedefs)
      .enter()
      .append("path")
      .attr("class", "lines")
      .attr("id", (_, i) => `line_${i}`)
      .attr("stroke", (d) =>
        d.action_special == 11 || d.action_special == 52 ? "red" : "black"
      )
      .attr("stroke-width", "2px")
      .attr("d", (d) => d.path)
      .attr("marker-end", "url(#arrow)");
  } else {
    linedefs.selectAll(".lines").remove();
    linedefs
      .selectAll(".lines")
      .data(filtered_linedefs)
      .enter()
      .append("path")
      .attr("class", "lines")
      .attr("id", (_, i) => `line_${i}`)
      .attr("stroke", (d) =>
        d.action_special == 11 || d.action_special == 52 ? "red" : "black"
      )
      .attr("stroke-width", "2px")
      .attr("d", (d) => d.path);
  }

  if (front) {
    linedefs.selectAll(".right_sectors_numbers").remove();
    linedefs
      .selectAll(".right_sectors_numbers")
      .data(filtered_linedefs)
      .enter()
      .append("text")
      .attr("dx", 3)
      .attr("dy", 7)
      .attr("class", "right_sectors_numbers")
      .append("textPath")
      .attr("xlink:href", (_, i) => `#line_${i}`)
      .text((d) => d.right_sidedef)
      .attr("font-size", 8)
      .attr("side", "right");
  } else {
    linedefs.selectAll(".right_sectors_numbers").remove();
  }

  if (back) {
    linedefs.selectAll(".left_sectors_numbers").remove();
    linedefs
      .selectAll(".left_sectors_numbers")
      .data(filtered_linedefs)
      .enter()
      .append("text")
      .attr("dx", 3)
      .attr("dy", -3)
      .attr("class", "left_sectors_numbers")
      .append("textPath")
      .attr("xlink:href", (_, i) => `#line_${i}`)
      .text((d) => d.left_sidedef)
      .attr("font-size", 8)
      .attr("side", "right");
  } else {
    linedefs.selectAll(".left_sectors_numbers").remove();
  }
}

function draw_start(player) {
  /* #######
  DRAW START
  ####### */
  things.selectAll(".things").remove();
  things
    .selectAll(".things")
    .data(player)
    .enter()
    .append("circle")
    .attr("class", "things")
    .attr("cx", (d) => d.x_position)
    .attr("cy", (d) => d.y_position)
    .attr("fill", "green")
    .attr("r", 4);
}

draw(
  d_sectors.checked,
  order.checked,
  v_points.checked,
  front.checked,
  back.checked,
  line_dir.checked
);

function changed(event) {
  draw(
    d_sectors.checked,
    order.checked,
    v_points.checked,
    front.checked,
    back.checked,
    line_dir.checked
  );
}

function convert_range(value, r1, r2) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

function get_polygons(lines, sectors, vertices, lineGenerator) {
  // Il a fallu corriger à la main E3M2 (sidedef 180 => sector "21" -> "22")

  const nSectors = sectors.length;
  const lines_copy = lines
    .map((line) => line)
    .filter((line) => line.s[0] != line.s[1]);

  const polygons = [];

  for (let sector = 0; sector < nSectors; sector++) {
    // Filter les lignes dans le secteur
    const linesInSector = lines_copy.filter((line) => line.s.includes(sector));

    // Marker pour splice()
    let marker = 0;

    // Array des sommets
    const verticesInOrder = [];
    let path = "";

    // Sommet en cours de traitement
    let last_v;

    // Trouver les polgones dans ce secteur
    const polygonsInSector = [];
    while (linesInSector.length > 0) {
      // La liste qui contient le sommet en cours de traitement
      const last = linesInSector.splice(marker, 1)[0];

      if (typeof last === "undefined") console.log(marker, linesInSector);

      // Remplir la liste de sommets et choisir la valeur du prochain sommet
      if (verticesInOrder.length == 0) {
        verticesInOrder.push(last.v[0], last.v[1]);
        last_v = last.v[1];
      } else {
        last_v = last.v.find((value) => value != last_v);
        verticesInOrder.push(last_v);
      }

      // Trouver la prochaine ligne à traiter
      const match = linesInSector.filter((line) => line.v.includes(last_v));
      const matchIdx = linesInSector.indexOf(match[0]);
      if (matchIdx > -1) {
        // Tant qu'on trouve une ligne à traiter, mettre à jour le marker
        marker = matchIdx;
      } else {
        // S'il n'y en a pas, on ferme le polygone en cours, calcul le paramètre "d" de <path>, et reset la liste de sommets
        // Ce cas se présente généralement quand un polygone contient un autre (trou) ou quand il a une forme complexe (E1M1 secteur 28)
        verticesInOrder.forEach(
          (vertex, i) =>
            (verticesInOrder[i] = [
              vertices[vertex].x_position,
              vertices[vertex].y_position,
            ])
        );

        // Placer le(s) polygone(s) trouvé(s) dans la liste polygonsInSector
        polygonsInSector.push(Array.from(verticesInOrder));
        verticesInOrder.splice(0, verticesInOrder.length);
        marker = 0; // Recommencer un polygone selon la liste
      }
    }
    // Si la liste contient plusieurs polgones, on part du principe que qu'il s'agit d'un polygone avec des trous
    // Ce procédé ne change rien au rendu d'un secteur composé de plusieurs polygones séparés
    if (polygonsInSector.length > 1) {
      // Dès lors, on détermine quel est le plus grand polygone (contenant)
      const largest = findLargestPolygon(polygonsInSector);
      // Pour chaque polygone...
      polygonsInSector.forEach((polygon, i) => {
        if (i === largest) return;
        // ... on regarde s'il est dessiné dans le même sens que le contenant ...
        if (isClockwise(polygon) == isClockwise(polygonsInSector[largest]))
          // ... si c'est le cas, on l'inverse, car les trous n'apparaissent comme tel que s'ils sont dessinés dans le sens inverse du contenant
          polygonsInSector[i] = polygon.reverse();
      });
    }
    console.log(sector, polygonsInSector);
    polygonsInSector.forEach((poly) => (path += lineGenerator(poly)));
    // Ajouter le polygone
    polygons.push({
      path: path,
      sector: sector,
      h: Number(sectors[sector].floor_height),
    });
  }
  return polygons;
}

function isClockwise(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length - 1; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum < 0; // true = sens horaire, false = anti-horaire
}

function polygonArea(polygon) {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function findLargestPolygon(polygons) {
  let maxArea = -Infinity;
  let largestIndex = -1;

  polygons.forEach((poly, i) => {
    const area = polygonArea(poly);
    if (area > maxArea) {
      maxArea = area;
      largestIndex = i;
    }
  });

  return largestIndex; // index du plus grand
}
