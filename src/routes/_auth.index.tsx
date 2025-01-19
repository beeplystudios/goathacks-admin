import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../utils/mall";
import {
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { connectPaths, generateRoute, Path, PositionType } from "../utils/algorithm";

export const Route = createFileRoute("/_auth/")({
  component: RouteComponent,
});

function RouteComponent() {
  const logOut = useAuthStore((s) => s.logOut);
  const router = useRouter();

  const position = {
    lat: 42.89309036394007,
    lng: -71.39225539916762,
  };

  const colors = ["red", "blue", "purple"];

  const [numBusses, setNumBusses] = useState<number>(1);

  const [markers, setMarkers] = useState<PositionType[]>([]);
  const [dirServ, setDirServ] = useState<google.maps.DirectionsService>();
  const [distMat, setDistMat] = useState<google.maps.DistanceMatrixService>();
  const [dirRenderers, setDirRenderers] = useState<
    google.maps.DirectionsRenderer[]
  >([]);
  const [paths, setPaths] = useState<Path[]>();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const routes = useMapsLibrary("routes");
  const geometry = useMapsLibrary("geometry");
  const map = useMap();

  useEffect(() => {
    if (routes && map) {
      setDirServ(new routes.DirectionsService());
      setDistMat(new routes.DistanceMatrixService());
    }
  }, [routes, map]);

  useEffect(() => {
    if (paths && routes) {
      let dirRendIdx = 0;
      paths.forEach((path, path_idx) => {
        path.directions.forEach((direction) => {
          if (dirRendIdx === dirRenderers.length) {
            dirRenderers.push(
              new routes.DirectionsRenderer({
                map,
                preserveViewport: true,
                suppressMarkers: true,
              })
            );
          }
          dirRenderers[dirRendIdx].setMap(map);
          dirRenderers[dirRendIdx].setDirections(direction);
          dirRenderers[dirRendIdx++].setOptions({
            polylineOptions: {
              strokeColor: colors[path_idx],
              strokeOpacity: 0.5,
            },
          });
        });
      });
      for (let i = dirRendIdx; i < dirRenderers.length; i++) {
        dirRenderers[i].setMap(null);
      }
      setDirRenderers(dirRenderers);
    }
  }, [paths, routes, map]);

  return (
    <div>
      <div className="flex flex-row gap-2">
        <GoogleMap
          className="w-[80%] h-[100vh]"
          defaultCenter={position}
          defaultZoom={14}
          mapId={import.meta.env.VITE_MAP_ID}
          disableDefaultUI
          disableDoubleClickZoom
          onClick={() => setSelectedIdx(null)}
          onDblclick={(e) => {
            if (markers.length >= 1 && routes) {
              setDirRenderers([
                ...dirRenderers,
                new routes.DirectionsRenderer({
                  map,
                  suppressMarkers: true,
                  preserveViewport: true,
                }),
              ]);
            }
            setMarkers(
              e.detail.latLng ? [...markers, e.detail.latLng] : markers
            );
          }}
        >
          {markers.map((m, i) => (
            <AdvancedMarker
              position={m}
              key={i}
              draggable
              onClick={() => {
                setSelectedIdx(i);
              }}
              onDrag={(e) => {
                markers[i] = {
                  lat: e.latLng!.lat(),
                  lng: e.latLng!.lng(),
                };
                setMarkers([...markers]);
              }}
            >
              <Pin
                background={selectedIdx === i ? "forestGreen" : "red"}
                glyphColor={selectedIdx === i ? "darkGreen" : "fireBrick"}
                borderColor="white"
              />
            </AdvancedMarker>
          ))}
        </GoogleMap>
        <div className="flex flex-col h-screen w-[20%] gap-5 p-3 items-center">
          <div>
            <label className="text-stone-200">Number of busses</label>
            <input
              type="number"
              value={numBusses}
              onChange={(e) => setNumBusses(e.currentTarget.valueAsNumber)}
              className="focus:outline-none p-2 rounded-md bg-stone-600 focus:bg-stone-700 w-full"
            />
          </div>

          <button
            className="bg-green-800 p-2 rounded-md hover:bg-green-900 transition-colors"
            disabled={!dirServ || !geometry || !distMat}
            onClick={async () => {
              setPaths(
                await connectPaths(dirServ!, await generateRoute(dirServ!, distMat!, geometry!, markers))
              );
            }}
          >
            Generate Route
          </button>

          <div className="flex-1" />

          {selectedIdx !== null && (
            <div className="outline outline-2 rounded-md outline-gray-600 p-2 w-full">
              <p>{`Lat: ${selectedIdx !== null ? markers[selectedIdx].lat : "None"}`}</p>
              <p>{`Lng: ${selectedIdx !== null ? markers[selectedIdx].lng : "None"}`}</p>
              <center>
                <button
                  className="mt-2 bg-red-800 p-2 rounded-md hover:bg-red-900 transition-colors"
                  disabled={selectedIdx === null}
                  onClick={() => {
                    setMarkers([
                      ...markers.slice(0, selectedIdx!),
                      ...markers.slice(selectedIdx! + 1, markers.length),
                    ]);
                    setSelectedIdx(null);
                  }}
                >
                  Delete Selected
                </button>
              </center>
            </div>
          )}

          <button
            onClick={() => {
              logOut();
              router.invalidate();
            }}
            className="bg-stone-600 p-3 w-full rounded-md hover:bg-stone-700"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
