import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab
      }}
    >
      {/* INICIO */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          )
        }}
      />

      {/* PRODUCCIÓN */}
      <Tabs.Screen
        name="produccion"
        options={{
          title: "Producción",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          )
        }}
      />

      {/* PERSONAL (HexaMacetaUI.tsx) */}
      <Tabs.Screen
        name="HexaMacetaUI"
        options={{
          title: "Personal",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.3.fill" color={color} />
          )
        }}
      />

      {/* PLANIFICADOR DIARIO */}
      <Tabs.Screen
        name="PlanificadorDiario"
        options={{
          title: "Planificador Diario",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={26}
              name="calendar.badge.clock"
              color={color}
            />
          )
        }}
      />
    </Tabs>
  );
}
