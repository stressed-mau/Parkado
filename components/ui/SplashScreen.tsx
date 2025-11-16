import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Image} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View className="flex-1 bg-[#7BB3CD] items-center justify-center">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        <Animated.Image 
        source={require("../../assets/images/logo.png")}
        style={{
            width: 220,
            height: 220,
            resizeMode: "contain",
            marginBottom: 5,
            transform: [{ scale: pulseAnim }],
          }}
        />
        <Text className="text-[#F6EEE4] text-xl">
          Encuentra tu espacio perfecto
        </Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;