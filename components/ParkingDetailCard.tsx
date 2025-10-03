import { View, Text, TouchableOpacity } from "react-native";
import { Parking } from "../scripts/parking";

type Props = {
  parking: Parking;
  onClose: () => void;
};

export const ParkingDetailCard = ({ parking, onClose }: Props) => {
  return (
    <View className="absolute bottom-10 left-5 right-5 bg-white p-4 rounded-2xl shadow-lg">
      <Text className="text-lg font-bold">{parking.name}</Text>
      <Text className="text-sm text-gray-600">{parking.address}</Text>
      <Text className="mt-2 text-blue-600 font-semibold">
        {parking.availability}
      </Text>

      <TouchableOpacity
        className="mt-4 bg-blue-500 py-2 rounded-xl"
        onPress={onClose}
      >
        <Text className="text-center text-white font-semibold">Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
};
