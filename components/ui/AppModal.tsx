import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type ModalType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "confirm";

interface AppModalProps {
  visible: boolean;
  type?: ModalType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  closeOnBackdrop?: boolean;
}

const typeConfig = {
  success: {
    icon: "check-circle",
    iconColor: "#22C55E",
  },
  error: {
    icon: "close-circle",
    iconColor: "#EF4444",
  },
  warning: {
    icon: "alert-circle",
    iconColor: "#F59E0B",
  },
  info: {
    icon: "information",
    iconColor: "#3B82F6",
  },
  confirm: {
    icon: "help-circle",
    iconColor: "#0EA5E9",
  },
};

export default function AppModal({
  visible,
  type = "info",
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  closeOnBackdrop = true,
}: AppModalProps) {
  const config = typeConfig[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={() => {
          if (closeOnBackdrop && onCancel) onCancel();
        }}
      >
        {/* Card */}
        <Pressable className="w-full max-w-md rounded-2xl bg-white p-6">
          {/* Icon */}
          <View className="items-center mb-4">
            <MaterialCommunityIcons
              name={config.icon as any}
              size={56}
              color={config.iconColor}
            />
          </View>

          {/* Title */}
          {title && (
            <Text className="text-xl font-bold text-center text-gray-800 mb-2">
              {title}
            </Text>
          )}

          {/* Message */}
          <Text className="text-center text-gray-600 mb-6">
            {message}
          </Text>

          <View className="flex-row justify-between items-center mt-2">
  {onCancel && (
    <TouchableOpacity
      onPress={onCancel}
      className="px-5 py-2 rounded-xl bg-gray-200"
    >
      <Text className="text-gray-700 font-semibold">
        {cancelText}
      </Text>
    </TouchableOpacity>
  )}

  <TouchableOpacity
    onPress={onConfirm}
    className="px-5 py-2 rounded-xl bg-sky-500"
  >
    <Text className="text-white font-semibold">
      {confirmText}
    </Text>
  </TouchableOpacity>
</View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}
