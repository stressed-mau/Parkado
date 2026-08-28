import Ionicons from "@expo/vector-icons/Ionicons";
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface GenericModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  containerClassName?: string;
  overlayClassName?: string;
}

export default function GenericModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  containerClassName = "",
  overlayClassName = "",
}: GenericModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Fondo semitransparente */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View 
          className={`flex-1 justify-center items-center bg-black/50 px-6 ${overlayClassName}`}
        >
          <TouchableWithoutFeedback>
            <View 
              className={`bg-white rounded-2xl w-full max-w-md p-6 ${containerClassName}`}
            >
              {/* Header del modal */}
              <View className="flex-row justify-between items-center mb-4">
                {title && (
                  <Text className="text-xl font-bold text-gray-800 flex-1">
                    {title}
                  </Text>
                )}
                
                {showCloseButton && (
                  <TouchableOpacity 
                    onPress={onClose}
                    className="p-2 ml-2"
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Contenido del modal */}
              <View>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}