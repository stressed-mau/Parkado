import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CustomModalProps {
  visible: boolean;
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export default function CustomModal({
  visible,
  type,
  message,
  onClose,
}: CustomModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Ionicons
            name={type === "success" ? "checkmark-circle" : "alert-circle"}
            size={64}
            color={type === "success" ? "#22C55E" : "#EF4444"}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.title}>
            {type === "success" ? "Registro Exitoso" : "Error al Registrar"}
          </Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: type === "success" ? "#22C55E" : "#EF4444" },
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});