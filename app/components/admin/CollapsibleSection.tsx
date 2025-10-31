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
        <View style={{ marginBottom: 18 }}>
            <Pressable
                onPress={toggle}
                style={styles.collapseHeader}
            >
                <Text style={styles.collapseTitle}>{title}</Text>
                <Text style={styles.collapseArrow}>{collapsed ? '▼' : '▲'}</Text>
            </Pressable>
            {!collapsed && (
                <View style={styles.collapseContent}>
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    collapseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 4,
    },
    collapseTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },
    collapseArrow: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginLeft: 6,
    },
    collapseContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        paddingTop: 4,
    },
});