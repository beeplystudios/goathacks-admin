export interface PositionType {
  lat: number;
  lng: number;
};

export interface Path {
  directions: google.maps.DirectionsResult[];
  stops: PositionType[];
  dist: number;
};

const hashLatLng = (pos: PositionType): string => {
  return `${pos.lat},${pos.lng}`;
};

function linearRegression(data: number[][]) {
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const x = data[i][0];
    const y = data[i][1];

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    count++;
  }

  const m = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
  const b = sumY / count - (m * sumX) / count;

  return [m, b]; // Returns slope (m) and y-intercept (b)
}

const distances = new Map<string, number>();
const cache = new Map<string, google.maps.DirectionsResult>();

export const getDirections = async (dirServ: google.maps.DirectionsService, origin: PositionType, destination: PositionType): Promise<google.maps.DirectionsResult> => {
  const key = hashLatLng(origin) + "," + hashLatLng(destination);
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const res = await dirServ.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING
  })!;

  cache.set(key, res);
  distances.set(key, res.routes[0].legs[0].distance!.value);
  return res;
}

export const getDistance = async (dirServ: google.maps.DirectionsService, origin: PositionType, destination: PositionType): Promise<number> => {
  const key = hashLatLng(origin) + "," + hashLatLng(destination);
  if (distances.has(key)) {
    return distances.get(key)!;
  }

  const res = await dirServ.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING
  })!;

  cache.set(key, res);
  distances.set(key, res.routes[0].legs[0].distance!.value);
  return res.routes[0].legs[0].distance!.value;
};

export const generateRoute = async (
  dirServ: google.maps.DirectionsService,
  distMat: google.maps.DistanceMatrixService,
  geom: google.maps.GeometryLibrary,
  points: PositionType[]
): Promise<Path[]> => {
  // ------- INITIAL API REQUESTS + CACHING ----------
  const approxDistances = new Map<
    string,
    { dest: PositionType; dist: number; idx: number }[]
  >();
  for (let i = 0; i < points.length; i++) {
    const dists: { dest: PositionType; dist: number; idx: number }[] = [];
    const key = hashLatLng(points[i]);
    // if (approxDistances.has(key)) continue;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;

      dists.push({
        dest: points[j],
        dist: geom.spherical.computeDistanceBetween(points[i], points[j]),
        idx: j,
      });
    }
    approxDistances.set(
      key,
      dists.sort((a, b) => a.dist - b.dist)
    );
  }

  for (let i = 0; i < points.length; i++) {
    const dests = approxDistances
      .get(`${points[i].lat},${points[i].lng}`)!
      .map((el) => el.dest)
      .slice(0, 10);
    await distMat
      .getDistanceMatrix({
        origins: [points[i]],
        destinations: dests,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((mat) => {
        for (let j = 0; j < dests.length; j++) {
          const key = hashLatLng(points[i]) + ',' + hashLatLng(dests[j]);
          if (distances.has(key)) continue;
          distances.set(
            key,
            mat.rows[0].elements[j].distance.value
          );
        }
      });
  }
  // ------- INITIAL API REQUESTS + CACHING ----------

  // ------- CENTER OF POINTS ---------
  const RAD2DEG = 180 / Math.PI;
  const DEG2RAD = Math.PI / 180;
  const cartesianPoints = points.map((point) => [
    Math.cos(DEG2RAD * point.lat) * Math.cos(DEG2RAD * point.lng),
    Math.cos(DEG2RAD * point.lat) * Math.sin(DEG2RAD * point.lng),
    Math.sin(DEG2RAD * point.lat),
  ]);
  const [x, y, z] = cartesianPoints
    .reduce(
      (acc, pos) => [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]],
      [0, 0, 0]
    )
    .map((coord) => coord / cartesianPoints.length);

  const avgLatLng = {
    lat: RAD2DEG * Math.atan2(z, Math.sqrt(x * x + y * y)),
    lng: RAD2DEG * Math.atan2(y, x),
  };

  const possibleStartingPoints = points
    .map((point, i) => ({ i, point }))
    .sort(
      ({ i: _i, point: a }, { i: _j, point: b }) =>
        geom.spherical.computeDistanceBetween(avgLatLng, b) -
        geom.spherical.computeDistanceBetween(avgLatLng, a)
    )
    .slice(0, 4);
  // ------- CENTER OF POINTS ---------

  // ------- GENERATE INITIAL PATH ---------
  let bestStops: PositionType[] = [];
  // let bestDirections: google.maps.DirectionsResult[] = [];
  let minDist: number = Infinity;

  for (let { i: currentIdx, point: currentPoint } of possibleStartingPoints) {
    const availablePoints = new Map<number, PositionType>();
    points.forEach((point, idx) => {
      availablePoints.set(idx, point);
    });

    const stops: PositionType[] = [];
    let dist = 0;

    stops.push(availablePoints.get(currentIdx)!);
    while (availablePoints.size > 1) {
      availablePoints.delete(currentIdx);

      const approxClosest = approxDistances
        .get(hashLatLng(currentPoint))!
        .filter((el) => availablePoints.has(el.idx))
        .slice(0, 10);
      const actualDistances = new Map<number, number>();
      for (const { idx: i, dest: point } of approxClosest) {
        const d = await getDistance(dirServ, currentPoint, point);
        actualDistances.set(i, d);
      }
      const [nextIdx, d] = [...actualDistances.entries()].sort(
        ([_i, a], [_j, b]) => a - b
      )[0];

      currentIdx = nextIdx;
      currentPoint = availablePoints.get(currentIdx)!;
      stops.push(currentPoint);
      dist += d;
    }

    if (dist < minDist) {
      bestStops = stops;
      minDist = dist;
    }
  }

  const directions: google.maps.DirectionsResult[] = [];
  for (let i = 0; i < bestStops.length - 1; i++) {
    const res = await getDirections(dirServ, points[i], points[i + 1]);
    directions.push(res);
  }
  // ------- GENERATE INITIAL PATH ---------

  // ------- SPLITTING -------
  const steps = directions.flatMap((dir) => dir.routes[0].legs[0].steps);
  const step_bboxes = steps.map((step) => {
    let bbox = new google.maps.LatLngBounds();
    for (const latlng of step.path) {
      bbox.extend(latlng);
    }
    return bbox;
  });
  let intersections = 0;
  for (let i = 0; i < step_bboxes.length; i++) {
    for (let j = i + 1; j < step_bboxes.length; j++) {
      if (step_bboxes[i].intersects(step_bboxes[j])) {
        for (let k = 0; k < steps[j].path.length; k++) {
          if (step_bboxes[i].contains(steps[j].path[k])) {
            intersections += 1;
          }
        }
      }
    }
  }
  const totalPathPoints = steps.reduce((acc, step) => acc + step.path.length, 0);
  const OVERLAP_THRESHOLD = 0.25; // If the ratio of overlaps to points is >= OVERLAP_THRESHOLD, split

  const LENGTH_THRESHOLD = 1.75;

  if (
    points.length > 4 &&
    (
      intersections / totalPathPoints >= OVERLAP_THRESHOLD ||
      minDist / await getDistance(dirServ, bestStops[0], bestStops[bestStops.length - 1]) >= LENGTH_THRESHOLD
    )
  ) {
    // Generate multiple maps
    const coords = points.map((p) => [p.lat, p.lng]);
    const [m, b] = linearRegression(coords);
    const pointsA = [];
    const pointsB = [];
    for (let i = 0; i < points.length; i++) {
      const p = coords[i];
      // Calculate the y-coordinate of the line at the given x-coordinate
      const lineY = m * p[0] + b;
      // Check if the point is above the line
      if (p[1] > lineY) {
        pointsA.push(points[i]);
      } else {
        pointsB.push(points[i]);
      }
    }
    const routeA = await generateRoute(dirServ, distMat, geom, pointsA);
    const routeB = await generateRoute(dirServ, distMat, geom, pointsB);
    return routeA.concat(routeB);
  }
  // ------- SPLITTING -------

  return [
    {
      directions,
      stops: bestStops,
      dist: minDist,
    },
  ];
};

const connected = (connections: Map<number, number[]>): boolean => {
  const stack = [connections.keys().next().value];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const cur = stack.pop()!;
    seen.add(cur);

    for (const neighbor of connections.get(cur)!) {
      if (!seen.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return seen.size === connections.size;
};

export const connectPaths = async (dirServ: google.maps.DirectionsService, paths: Path[]): Promise<Path[]> => {
  const doNotConnect = new Map<number, number[]>();
  for (let i = 0; i < paths.length; i++) {
    doNotConnect.set(i, []);
  }
  while (!connected(doNotConnect)) {
    const closestPoints = new Map<string, { start: boolean, pathIdx: number, otherIdx: number, origin: PositionType, dest: PositionType, dist: number }>();
    for (let i = 0; i < paths.length; i++) {
      for (let j = 0; j < paths.length; j++) {
        if (i === j) continue;
        const dncs = doNotConnect.get(i);
        if (dncs && dncs.includes(j)) continue;

        for (const endpointIdx of [0, paths[i].stops.length - 1]) {
          const endpoint = paths[i].stops[endpointIdx];
          for (const point of paths[j].stops) {
            const dist = await getDistance(dirServ, endpoint, point);
            const key = hashLatLng(endpoint);
            const res = closestPoints.get(key);
            if ((res && dist < res.dist) || !res) {
              closestPoints.set(key, { start: endpointIdx === 0, pathIdx: i, otherIdx: j, origin: endpoint, dest: point, dist });
            }
          }
        }
      }
    }

    const { start, pathIdx, otherIdx, origin, dest, dist } = [...closestPoints.values()].sort((a, b) => a.dist - b.dist)[0];
    if (start) {
      paths[pathIdx].stops = [dest, ...paths[pathIdx].stops];
      paths[pathIdx].directions = [await getDirections(dirServ, origin, dest), ...paths[pathIdx].directions];
    } else {
      paths[pathIdx].stops = [...paths[pathIdx].stops, dest];
      paths[pathIdx].directions = [...paths[pathIdx].directions, await getDirections(dirServ, origin, dest)];
    }
    paths[pathIdx].dist += dist;
    doNotConnect.get(pathIdx)?.push(otherIdx);
    doNotConnect.get(otherIdx)?.push(pathIdx);
  }
  return paths;
};
