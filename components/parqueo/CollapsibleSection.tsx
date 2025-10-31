import React, { useState } from 'react';
import { LayoutAnimation, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
        <View className="mb-[18px]">
            <TouchableOpacity onPress={toggle} className="flex-row items-center justify-between bg-[#f0f0f0] rounded-[8px] px-[14px] py-[10px] mb-1" activeOpacity={0.7}>
                <Text className="text-[17px] font-bold text-[#222]">{title}</Text>
                <Text className="text-[18px] font-bold text-[#888] ml-[6px]">{collapsed ? '▼' : '▲'}</Text>
            </TouchableOpacity>
            {!collapsed && <View className="bg-white rounded-[8px] p-2 pt-1">{children}</View>}
        </View>
    );
}
