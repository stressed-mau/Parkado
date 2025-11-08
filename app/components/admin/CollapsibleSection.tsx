import React, { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View, StyleSheet } from 'react-native';

export default function CollapsibleSection({
    title,
    children,
    defaultCollapsed = true,
}: {
    title: string;
    children: React.ReactNode;
    defaultCollapsed?: boolean;
}) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    function toggle() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCollapsed(c => !c);
    }

    return (
        <View className="mb-4">
            <Pressable
                onPress={toggle}
                className="flex-row items-center justify-between bg-[#f0f0f0] rounded-lg px-3.5 py-2.5 mb-1"            >
                <Text className="text-[17px] font-bold text-[#222]">{title}</Text>
                <Text className="text-base font-bold text-[#888] ml-1.5">{collapsed ? '▼' : '▲'}</Text>
            </Pressable>
            {!collapsed && (
                <View className="bg-white rounded-lg p-2 pt-1">
                    {children}
                </View>
            )}
        </View>
    );
}