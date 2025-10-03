import React from "react";
import { Marker } from "react-native-maps";
import { Image } from "react-native";
import { Parking } from "../scripts/parking";

type Props = {
  parking: Parking;
  onPress: () => void;
};

export const ParkingMarker = ({ parking, onPress }: Props) => {
  return (
    <Marker
      coordinate={{ latitude: parking.latitude, longitude: parking.longitude }}
      title={parking.name}
      onPress={onPress}
    >
      <Image
        source={require("../assets/images/paring_marker.png")} // icono P
        style={{ width: 32, height: 32 }}
        resizeMode="contain"
      />
    </Marker>
  );
};
