import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../utils/mall";
import { AdvancedMarker, Map as GoogleMap, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { useEffect, useState } from "react";
import { generateRoute, Path, PositionType } from "../utils/algorithm";

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

  const [markers, setMarkers] = useState<PositionType[]>([]);
  const [dirServ, setDirServ] = useState<google.maps.DirectionsService>();
  const [distMat, setDistMat] = useState<google.maps.DistanceMatrixService>();
  const [dirRenderers, setDirRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
  const [dirRenderer, setDirRenderer] = useState<google.maps.DirectionsRenderer>();
  const [idxTarget, setIdxTarget] = useState<string>("");
  const [path, setPath] = useState<Path>();
  const [dragging, setDragging] = useState(false);

  // const [startIdx, setStartIdx] = useState<number>();
  // const [endIdx, setEndIdx] = useState<number>();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // const [dist, setDist] = useState<number>();
  // const [showDist, setShowDist] = useState(false);

  const routes = useMapsLibrary("routes");
  const geometry = useMapsLibrary("geometry");
  const map = useMap();

  useEffect(() => {
    if (routes && map) {
      setDirServ(new routes.DirectionsService());
      setDistMat(new routes.DistanceMatrixService());
      setDirRenderer(new routes.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: true }));
    }
  }, [routes, map]);

  // useEffect(() => {
  //   if (startIdx != null && endIdx != null && !dragging) {
  //     dirServ
  //       ?.route({
  //         origin: markers[startIdx],
  //         destination: markers[endIdx],
  //         travelMode: google.maps.TravelMode.DRIVING,
  //       })
  //       .then((resp) => {
  //         setDist(resp.routes[0].legs[0].distance?.value);
  //         dirRenderer?.setDirections(resp);
  //       });
  //   }
  // }, [dirServ, markers, startIdx, endIdx, dirRenderers, dragging]);

  // useEffect(() => {
  //   if (dirRenderer) {
  //     if (showDist) {
  //       dirRenderer.setMap(map);
  //     } else {
  //       dirRenderer.setMap(null);
  //     }
  //   }
  // }, [showDist, dirRenderer]);

  useEffect(() => {
    if (path) {
      path.directions.forEach((direction, i) => {
        dirRenderers[i].setDirections(direction);
        dirRenderers[i].setOptions({
          polylineOptions: {
            strokeColor: colors[i % colors.length],
            strokeOpacity: 0.5
          }
        });
      });
    }
  }, [path]);

  return (
    <div>
      Hello "/"!
      <Button
        onPress={() => {
          logOut();

          router.invalidate();
        }}
      >
        Log Out
      </Button>
      <div className="flex flex-row gap-2">
        <GoogleMap
          className="rounded-[10px] w-[80%] h-[95vh]"
          defaultCenter={position}
          defaultZoom={14}
          mapId={import.meta.env.VITE_MAP_ID}
          disableDefaultUI
          disableDoubleClickZoom
          onClick={() => setSelectedIdx(null)}
          onDblclick={
            (e) => {
              if (markers.length >= 1 && routes) {
                setDirRenderers([...dirRenderers, new routes.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: true })]);
              }
              setMarkers(e.detail.latLng ? [...markers, e.detail.latLng] : markers);
            }
          }
        >
          {/*avgLatLng !== undefined ?
            <AdvancedMarker
              position={avgLatLng}
            >
              <Pin
                background="yellow"
                borderColor="black"
              />
            </AdvancedMarker>
            :
            <></>
          */}
          {markers.map((m, i) => (
            <AdvancedMarker
              position={m}
              key={i}
              draggable
              onClick={() => {
                setSelectedIdx(i);
                // if (idxTarget === "start") {
                //   setStartIdx(i);
                // } else if (idxTarget === "end") {
                //   setEndIdx(i);
                // }
              }}
              onDragStart={() => setDragging(true)}
              onDragEnd={() => setDragging(false)}
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
        <div className="flex flex-col gap-2">
          <p>{`Lat: ${selectedIdx !== null ? markers[selectedIdx].lat : "None"}`}</p>
          <p>{`Lng: ${selectedIdx !== null ? markers[selectedIdx].lng : "None"}`}</p>
          <button
            disabled={selectedIdx === null}
            onClick={() => {
              setMarkers([...markers.slice(0, selectedIdx!), ...markers.slice(selectedIdx! + 1, markers.length)])
              setSelectedIdx(null);
            }}
          >
            Delete
          </button>
          <button
            disabled={!dirServ || !geometry || !distMat}
            onClick={async () => {
              setPath(await generateRoute(dirServ!, distMat!, geometry!, markers));
            }}
          >
            Generate Route
          </button>
        </div>
      </div>
    </div>
  );
}
