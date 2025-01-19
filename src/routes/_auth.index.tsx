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
import {
  connectPaths,
  generateRoute,
  Path,
  PositionType,
} from "../utils/algorithm";
import { QrCodeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";

import QRCode from "react-qr-code";

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

  const colors = ["red", "orange", "yellow", "green", "blue", "purple"];

  const [numBuses, setNumBuses] = useState<number>(1);

  const [markers, setMarkers] = useState<PositionType[]>([]);
  const [dirServ, setDirServ] = useState<google.maps.DirectionsService>();
  const [distMat, setDistMat] = useState<google.maps.DistanceMatrixService>();
  const [dirRenderers, setDirRenderers] = useState<
    google.maps.DirectionsRenderer[]
  >([]);
  const [paths, setPaths] = useState<Path[]>();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [newBusUUID, setNewBusUUID] = useState("");
  const [newDriverUUID, setNewDriverUUID] = useState("");

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
      // console.log(paths.map((path) => [path.stops, path.directions.map((dir) => ({
      //    // origin: dir.request.origin, dest: dir.request.destination }))]));
      //   origin: { lat: (dir.request.origin as unknown).location.lat(), lng: (dir.request.origin as unknown).location.lng() },
      //   dest: { lat: (dir.request.destination as unknown).location.lat(), lng: (dir.request.destination as unknown).location.lng() }}))]));
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
              strokeColor: colors[path_idx % colors.length],
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

  const createBusUUID = () => {
    const uuid = crypto.randomUUID();
    setNewBusUUID(uuid);
    // DASHIELL DO DATABASE
    return uuid;
  };

  const createDriverUUID = () => {
    const uuid = crypto.randomUUID();
    setNewDriverUUID(uuid);
    // DASHIELL DO DATABASE
    console.log(uuid);
    return uuid;
  };

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
          }}>
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
              }}>
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
            <label className="text-stone-200">Number of buses</label>
            <input
              type="number"
              value={numBuses}
              onChange={(e) => setNumBuses(e.currentTarget.valueAsNumber)}
              className="focus:outline-none p-2 rounded-md bg-stone-600 focus:bg-stone-700 w-full"
            />
          </div>

          <button
            className="bg-green-800 p-2 rounded-md hover:bg-green-900 transition-colors"
            disabled={!dirServ || !geometry || !distMat}
            onClick={async () => {
              setPaths(
                await connectPaths(
                  dirServ!,
                  await generateRoute(dirServ!, distMat!, geometry!, markers)
                )
              );
            }}>
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
                  }}>
                  Delete Selected
                </button>
              </center>
            </div>
          )}
          <Dialog>
            <DialogTrigger className="bg-stone-300 p-3 w-full rounded-md hover:bg-stone-400 text-black flex items-center justify-center gap-2">
              <QrCodeIcon />
              Generate QR Code
            </DialogTrigger>
            <DialogContent className="bg-stone-900 border-0">
              <Tabs defaultValue="bus" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger
                    value="bus"
                    className="data-[state=active]:bg-stone-900">
                    Bus
                  </TabsTrigger>
                  <TabsTrigger
                    value="driver"
                    className="data-[state=active]:bg-stone-900">
                    Driver
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="bus" className="p-2">
                  {newBusUUID ? (
                    <>
                      <h2 className="font-semibold text-lg mt-2">
                        New Bus QR code
                      </h2>
                      <div className="rounded-2xl flex items-center justify-center mt-12 w-fit bg-white/10 p-4 mr-auto ml-auto">
                        <QRCode value={newBusUUID} className="rounded-lg" />
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={createBusUUID}
                      className="bg-stone-300 p-3 w-full rounded-md hover:bg-stone-400 text-black flex items-center justify-center gap-2">
                      Get new QR Code
                    </button>
                  )}
                </TabsContent>
                <TabsContent value="driver" className="p-2">
                  {newDriverUUID ? (
                    <>
                      <h2 className="font-semibold text-lg mt-2">
                        New Driver QR code
                      </h2>
                      <div className="rounded-2xl flex items-center justify-center mt-12 w-fit bg-white/10 p-4 mr-auto ml-auto">
                        <QRCode value={newDriverUUID} className="rounded-lg" />
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={createDriverUUID}
                      className="bg-stone-300 p-3 w-full rounded-md hover:bg-stone-400 text-black flex items-center justify-center gap-2">
                      Get new QR Code
                    </button>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => {
              logOut();
              router.invalidate();
            }}
            className="bg-stone-600 p-3 w-full rounded-md hover:bg-stone-700">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
