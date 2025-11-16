import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, TouchableOpacity, View } from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function CommentSection({ visible, onClose, children }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <>
      {/* Fondo oscuro */}
      {visible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0 bg-black/40 z-40"
        />
      )}

      {/* Contenedor deslizante */}
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 z-50 max-h-[85%]"
      >
        {children}
      </Animated.View>
    </>
  );
}
