import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from "react"; 
import SplashScreen from "@/components/ui/SplashScreen";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  if (showSplash) { 
    return <SplashScreen onFinish={() => 
      setShowSplash(false)} 
      />; 
    }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#32B8CD' : '#21808D',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
      }}
    >
      {/* SOLO ESTOS DOS SE MOSTRARÁN */}
      <Tabs.Screen
        name="Mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="Login"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
