import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import MapView from "react-native-maps";
import { Parking } from "../scripts/parking";
import { ParkingMarker } from "../components/ParkingMarker";
import { ParkingDetailCard } from "../components/ParkingDetailCard";

const initialParkings: Parking[] = [
  {
    id: "1",
    name: "Sky box",
    address: "Av. heroinas esq. C, C. Antezana",
    latitude: -17.391,
    longitude: -66.152,
    availability: "5 espacios libres",
  },
  {
    id: "2",
    name: "Parqueo Galeno",
    address: "Calle Ecuador esq C, C. Antezana",
    latitude: -17.3896666667,
    longitude: -66.1532222222,
    availability: "2 espacios libres",
  },
];

export default function ParkingMapScreen() {
  const [selectedParking, setSelectedParking] = useState<Parking | null>(null);

  return (
    <View className="flex-1">
      <MapView
        style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}
        initialRegion={{
          latitude: -16.5,
          longitude: -68.15,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {initialParkings.map((p) => (
          <ParkingMarker
            key={p.id}
            parking={p}
            onPress={() => setSelectedParking(p)}
          />
        ))}
      </MapView>

      {selectedParking && (
        <ParkingDetailCard
          parking={selectedParking}
          onClose={() => setSelectedParking(null)}
        />
      )}
    </View>
  );
}
