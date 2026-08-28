import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type GenericModalProps = {
  triggerText?: string;      // Texto del botón que abre el modal
  title?: string;            // Título dentro del modal
  message?: string;          // Texto del cuerpo del modal
  confirmText?: string;      // Texto del botón dentro del modal
  onConfirm?: () => void;    // Acción al pulsar el botón del modal
};

const GenericModal: React.FC<GenericModalProps> = ({
  triggerText = "Abrir modal",
  title = "Título del modal",
  message = "Este es un texto genérico dentro del modal.",
  confirmText = "Aceptar",
  onConfirm,
}) => {
  const [visible, setVisible] = useState(false);

  const close = () => setVisible(false);

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    close();
  };

  return (
    <>
      {/* Botón que abre el modal */}
      <Pressable
        onPress={() => setVisible(true)}
        className="px-4 py-3 rounded-lg bg-[#FD721D]"
      >
        <Text className="text-white font-semibold text-base text-center">
          {triggerText}
        </Text>
      </Pressable>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.45)]">
          <View className="w-11/12 max-w-md rounded-2xl p-6 bg-[#7BB3CD]">
            <Text className="text-white text-xl font-bold mb-2 text-center">
              {title}
            </Text>

            <Text className="text-white text-base mb-5 text-center">
              {message}
            </Text>

            <View className="flex-row justify-center gap-x-3">
              {/* Botón cerrar */}
              <Pressable
                onPress={close}
                className="flex-1 px-3 py-2 rounded-lg bg-[#F6EEE4]"
              >
                <Text className="text-center font-semibold text-[#FD721D]">
                  Cancelar
                </Text>
              </Pressable>

              {/* Botón principal del modal */}
              <Pressable
                onPress={handleConfirm}
                className="flex-1 px-3 py-2 rounded-lg bg-[#B2A83F]"
              >
                <Text className="text-center font-semibold text-black">
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default GenericModal;