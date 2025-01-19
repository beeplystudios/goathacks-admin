export interface PositionType {
  lat: number;
  lng: number;
};

export interface Path {
  directions: google.maps.DirectionsResult[];
  stops: PositionType[];
  dist: number;
};

export const generateRoute = async (dirServ: google.maps.DirectionsService, distMat: google.maps.DistanceMatrixService, geom: google.maps.GeometryLibrary, points: PositionType[]): Promise<Path> => {
  const distances = new Map<string, number>();
  const approxDistances = new Map<string, { dest: PositionType, dist: number, idx: number }[]>();
  const cache = new Map<string, google.maps.DirectionsResult>();

  for (let i = 0; i < points.length; i++) {
    const dists: { dest: PositionType, dist: number, idx: number }[] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;

      dists.push({ dest: points[j], dist: geom.spherical.computeDistanceBetween(points[i], points[j]), idx: j });
    }
    approxDistances.set(`${points[i].lat},${points[i].lng}`, dists.sort((a, b) => a.dist - b.dist));
  }

  for (let i = 0; i < points.length; i++) {
    const dests = approxDistances.get(`${points[i].lat},${points[i].lng}`)!.map((el) => el.dest).slice(0, 10);
    await distMat.getDistanceMatrix({
      origins: [points[i]],
      destinations: dests,
      travelMode: google.maps.TravelMode.DRIVING,
    }).then((mat) => {
      for (let j = 0; j < dests.length; j++) {
        distances.set(`${points[i].lat},${points[i].lng},${dests[j].lat},${dests[j].lng}`, mat.rows[0].elements[j].distance.value);
      }
    });
  }

  const RAD2DEG = 180 / Math.PI;
  const DEG2RAD = Math.PI / 180;
  const cartesianPoints = points.map((point) => [
    Math.cos(DEG2RAD * point.lat) * Math.cos(DEG2RAD * point.lng),
    Math.cos(DEG2RAD * point.lat) * Math.sin(DEG2RAD * point.lng),
    Math.sin(DEG2RAD * point.lat)
  ]);
  const [x, y, z] = cartesianPoints.reduce((acc, pos) => [acc[0] + pos[0], acc[1] + pos[1], acc[2] + pos[2]], [0, 0, 0])
    .map((coord) => coord / cartesianPoints.length);

  const avgLatLng = {
    lat: RAD2DEG * Math.atan2(z, Math.sqrt(x * x + y * y)),
    lng: RAD2DEG * Math.atan2(y, x)
  };

  const possibleStartingPoints = points.map((point, i) => ({ i, point }))
    .sort(({ i: _i, point: a }, { i: _j, point: b }) => geom.spherical.computeDistanceBetween(avgLatLng, b) - geom.spherical.computeDistanceBetween(avgLatLng, a))
    .slice(0, 4);

  let bestStops: PositionType[] = [];
  // let bestDirections: google.maps.DirectionsResult[] = [];
  let minDist: number = Infinity;

  for (let { i: currentIdx, point: currentPoint } of possibleStartingPoints) {
    const availablePoints = new Map<number, PositionType>()
    points.forEach((point, idx) => {
      availablePoints.set(idx, point);
    });

    const stops: PositionType[] = [];
    let dist = 0;

    stops.push(availablePoints.get(currentIdx)!);
    while (availablePoints.size > 1) {
      availablePoints.delete(currentIdx);

      const approxClosest = approxDistances.get(`${currentPoint.lat},${currentPoint.lng}`)!.filter((el) => availablePoints.has(el.idx)).slice(0, 10);
      const actualDistances = new Map<number, number>();
      for (const { idx: i, dest: point } of approxClosest) {
        const key = `${currentPoint.lat},${currentPoint.lng},${point.lat},${point.lng}`;
        let d = distances.get(key);
        if (d === undefined) {
          const res = await dirServ.route({
            origin: currentPoint,
            destination: point,
            travelMode: google.maps.TravelMode.DRIVING
          });
          cache.set(key, res!);
          d = res.routes[0].legs[0].distance!.value;
        }
        actualDistances.set(i, d);
      }
      const [nextIdx, d] = [...actualDistances.entries()].sort(([_i, a], [_j, b]) => a - b)[0];

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
    const res = cache.get(`${points[i].lat},${points[i].lng},${points[i + 1].lat},${points[i + 1].lng}`);
    if (res) {
      directions.push(res);
    } else {
      directions.push(await dirServ.route({
        origin: points[i],
        destination: points[i + 1],
        travelMode: google.maps.TravelMode.DRIVING
      }));
    }
  }

  return { directions, stops: bestStops, dist: minDist };
};
