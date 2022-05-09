const div = document.getElementById('level');
const select = document.getElementById('level_select');
const order = document.getElementById('order');
const v_points = document.getElementById('vert_points');
const front = document.getElementById('front');
const back = document.getElementById('back');
const line_dir = document.getElementById('line_dir');

select.addEventListener('change', changed);
order.addEventListener('change', changed);
v_points.addEventListener('change', changed);
front.addEventListener('change', changed);
back.addEventListener('change', changed);
line_dir.addEventListener('change', changed);

const svg = d3
  .select('body')
  .append('svg')
  .attr('width', '100%')
  .attr('height', 5000);

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
  .append('defs')
  .append('marker')
  .attr('id', 'arrow')
  .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
  .attr('refX', refX)
  .attr('refY', refY)
  .attr('markerWidth', markerBoxWidth)
  .attr('markerHeight', markerBoxHeight)
  .attr('orient', 'auto-start-reverse')
  .append('path')
  .attr('d', d3.line()(arrowPoints))
  .attr('stroke', 'black');

const level = svg.append('g');
const sectors = level.append('g').attr('id', 'sectors');
const linedefs = level.append('g').attr('id', 'linedefs');
const things = level.append('g').attr('id', 'things');
const vertices = level.append('g').attr('id', 'vertices');

function draw(order, v_points, front, back, line_dir) {
  d3.csv('../CSV_data/vertexes_data.csv').then((vertex_data) => {
    d3.csv('../CSV_data/linedefs_data.csv').then((linedefs_data) => {
      d3.csv('../CSV_data/sidedefs_data.csv').then((sidedefs_data) => {
        d3.csv('../CSV_data/things_data.csv').then((things_data) => {
          d3.csv('../CSV_data/sectors_data.csv').then((sectors_data) => {
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
              row['vertex_1_pos'] = [vertex_1.x_position, vertex_1.y_position];
              row['vertex_2_pos'] = [vertex_2.x_position, vertex_2.y_position];
              row['path'] = lineGenerator([
                [vertex_1.x_position, vertex_1.y_position],
                [vertex_2.x_position, vertex_2.y_position],
              ]);
              const right_sidedef = filtered_sidedefs[Number(row.front_side)];
              const left_sidedef =
                Number(row.back_side) == 65535
                  ? '-'
                  : filtered_sidedefs[Number(row.back_side)];
              row['right_sidedef'] = right_sidedef.sector;
              row['left_sidedef'] =
                left_sidedef == '-' ? '--' : left_sidedef.sector;
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
              order
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
  order
) {
  // TODO: get polygons
  const lines = filtered_linedefs.map((row, i) => {
    const sector_r = Number(row.right_sidedef);
    const sector_l = Number(row.left_sidedef);
    return {
      v: [row.vertex_1, row.vertex_2],
      v_xy: [row.vertex_1_pos, row.vertex_2_pos],
      h_r: [
        filtered_sectors[sector_r].floor_height,
        filtered_sectors[sector_l]?.floor_height ?? '--',
      ],
      s: [sector_r, sector_l ?? '--'],
      i: i,
    };
  });

  const polygons = get_polygons(lines);
  console.log(polygons);

  polygons.forEach((poly, p) => {
    if (poly.length > 0) {
      const vertex_chain = [];
      const sec = filtered_linedefs.filter((line) => {
        // if (
        //   (line.vertex_1 == '360' &&
        //     line.vertex_2 == '361' &&
        //     line.right_sidedef == '20' &&
        //     line.left_sidedef == '36') ||
        //   (line.vertex_1 == '230' &&
        //     line.vertex_2 == '229' &&
        //     line.right_sidedef == '29' &&
        //     line.left_sidedef == '30')
        // ) {
        //   // sec = line.s[1];
        // }
        if (line.vertex_1 == poly[0] && line.vertex_2 == poly[1]) return line;
      })[0].right_sidedef;
      const h = Number(filtered_sectors[Number(sec)].floor_height);
      poly.forEach((ver, i) => {
        const found_vertex = filtered_vertex[Number(ver)];
        vertex_chain[i] = [found_vertex.x_position, found_vertex.y_position];
      });
      const path = lineGenerator(vertex_chain);
      polygons[p].push(h);
      polygons[p].push(path);
    }
  });

  polygons.sort(
    (poly_1, poly_2) => poly_1[poly_1.length - 2] - poly_2[poly_2.length - 2]
  );

  if (order) {
    polygons.reverse();
  }

  const heights = polygons.map((poly) => poly[poly.length - 2]);
  const h_range = [Math.max(...heights), Math.min(...heights)];
  const color_range = [360, 200];

  polygons.forEach(
    (poly, p) =>
      (polygons[p][poly.length - 2] = convert_range(
        polygons[p][poly.length - 2],
        h_range,
        color_range
      ))
  );

  sectors.selectAll('.sec').remove();
  sectors
    .selectAll('.sec')
    .data(polygons)
    .enter()
    .append('path')
    .attr('class', 'sec')
    .attr('stroke', 'none')
    .attr('fill', (d) => `hsl(${d[d.length - 2]}, 80%, 50%)`)
    .attr('stroke-width', '2px')
    .attr('d', (d) => d[d.length - 1]);
}

function draw_vertices(filtered_vertex, v_points) {
  /* ##########
  DRAW VERTICES
  ########## */
  vertices.selectAll('.vertices').remove();
  vertices
    .selectAll('.vertices')
    .data(filtered_vertex)
    .enter()
    .append('circle')
    .attr('class', 'vertices')
    .attr('cx', (d) => Number(d.x_position))
    .attr('cy', (d) => Number(d.y_position))
    .attr('r', 2)
    .attr('fill', 'black');

  if (v_points) {
    vertices.selectAll('.vertices_number').remove();
    vertices
      .selectAll('.vertices_number')
      .data(filtered_vertex)
      .enter()
      .append('text')
      .attr('class', 'vertices_number')
      .attr('x', (d) => Number(d.x_position) + 2)
      .attr('y', (d) => Number(d.y_position) - 2)
      .text((d, i) => i)
      .attr('font-size', 8)
      .attr('fill', 'grey');
  } else {
    vertices.selectAll('.vertices_number').remove();
  }
}

function draw_linedefs(filtered_linedefs, front, back, line_dir) {
  /* ##########
  DRAW LINEDEFS
  ########## */
  if (line_dir) {
    linedefs.selectAll('.lines').remove();
    linedefs
      .selectAll('.lines')
      .data(filtered_linedefs)
      .enter()
      .append('path')
      .attr('class', 'lines')
      .attr('id', (_, i) => `line_${i}`)
      .attr('stroke', (d) =>
        d.action_special == 11 || d.action_special == 52 ? 'red' : 'black'
      )
      .attr('stroke-width', '2px')
      .attr('d', (d) => d.path)
      .attr('marker-end', 'url(#arrow)');
  } else {
    linedefs.selectAll('.lines').remove();
    linedefs
      .selectAll('.lines')
      .data(filtered_linedefs)
      .enter()
      .append('path')
      .attr('class', 'lines')
      .attr('id', (_, i) => `line_${i}`)
      .attr('stroke', (d) =>
        d.action_special == 11 || d.action_special == 52 ? 'red' : 'black'
      )
      .attr('stroke-width', '2px')
      .attr('d', (d) => d.path);
  }

  if (front) {
    linedefs.selectAll('.right_sectors_numbers').remove();
    linedefs
      .selectAll('.right_sectors_numbers')
      .data(filtered_linedefs)
      .enter()
      .append('text')
      .attr('dx', 3)
      .attr('dy', -3)
      .attr('class', 'right_sectors_numbers')
      .append('textPath')
      .attr('xlink:href', (_, i) => `#line_${i}`)
      .text((d) => d.right_sidedef)
      .attr('font-size', 8)
      .attr('side', 'right');
  } else {
    linedefs.selectAll('.right_sectors_numbers').remove();
  }

  if (back) {
    linedefs.selectAll('.left_sectors_numbers').remove();
    linedefs
      .selectAll('.left_sectors_numbers')
      .data(filtered_linedefs)
      .enter()
      .append('text')
      .attr('dx', 3)
      .attr('dy', 6)
      .attr('class', 'left_sectors_numbers')
      .append('textPath')
      .attr('xlink:href', (_, i) => `#line_${i}`)
      .text((d) => d.left_sidedef)
      .attr('font-size', 8)
      .attr('side', 'right');
  } else {
    linedefs.selectAll('.left_sectors_numbers').remove();
  }
}

function draw_start(player) {
  /* #######
  DRAW START
  ####### */
  things.selectAll('.things').remove();
  things
    .selectAll('.things')
    .data(player)
    .enter()
    .append('circle')
    .attr('class', 'things')
    .attr('cx', (d) => d.x_position)
    .attr('cy', (d) => d.y_position)
    .attr('fill', 'green')
    .attr('r', 4);
}

draw(
  order.checked,
  v_points.checked,
  front.checked,
  back.checked,
  line_dir.checked
);

function changed(event) {
  draw(
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

function get_polygons(lines) {
  const polygons = [];
  let compteur = 0;
  while (true) {
    const polygon = [];
    let c = compteur;

    const ids = [];
    const start = lines[c];

    if (typeof start === 'undefined') console.log(c, start);
    ids.push(start.i);
    polygon.push(start.v[0], start.v[1]);
    let multi_lines = [];
    let sec = start.s[0];
    // Exception E1M7 && E1M8
    if (
      (start.v[0] == '360' &&
        start.v[1] == '361' &&
        start.s[0] == '20' &&
        start.s[1] == '36') ||
      (start.v[0] == '230' &&
        start.v[1] == '229' &&
        start.s[0] == '29' &&
        start.s[1] == '30')
    ) {
      sec = start.s[1];
    }

    while (true) {
      const last = polygon[polygon.length - 1];
      const found = [];
      lines.forEach((line) => {
        if (line.v.includes(last) && !ids.includes(line.i)) {
          found.push(line);
        }
      });
      let i = 0;

      if (found.length > 1) {
        const same_sec = found.filter((line) => line.s.includes(sec));
        if (same_sec.length == 0) {
          break;
        } else if (same_sec.length == 1) {
          found.forEach((line, idx) => {
            if (line.s.includes(sec)) {
              i = idx;
            }
          });
        } else if (same_sec.length >= 2) {
          found.forEach((line, idx) => {
            if (line.s[0] != line.s[1] && line.s.includes(sec)) {
              i = idx;
            }
          });
        } else {
        }
      }

      const next = found[i];
      const next_v = next?.v.find((value) => value != last);
      const id = next?.i;

      if (typeof next !== 'undefined') {
        polygon.push(next_v);
        c = id;
        ids.push(id);
        if (!next.s.includes('--')) {
          multi_lines.push(id);
        }
        if (next_v == polygon[0]) {
          break;
        }
      } else {
        multi_lines.forEach((idx) => {
          const id = ids.indexOf(idx);
          if (id > -1) {
            ids.splice(id, 1);
          }
        });
        break;
      }
    }

    polygons[compteur] = polygon;

    compteur++;

    if (compteur >= lines.length) {
      break;
    }
  }
  const complete_poly = [];
  polygons.forEach((p, i) => {
    if (p[0] == p[p.length - 1] && !array_in_array(p, complete_poly))
      complete_poly.push(p);
  });
  return complete_poly;
}

function array_in_array(arr, big_arr) {
  const array = [];
  arr.forEach((a) => array.push(Number(a)));
  array.pop();
  array.sort();
  const new_arr = [];
  for (let i = 0; i < big_arr.length; i++) {
    new_arr.push([]);
    big_arr[i].forEach((a, idx) => {
      if (idx < big_arr[i].length - 1) new_arr[i].push(Number(a));
    });
    new_arr[i].sort();
  }
  if (JSON.stringify(new_arr).indexOf(JSON.stringify(array)) != -1) {
    return true;
  }
  return false;
}
