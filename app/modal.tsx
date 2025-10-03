import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView >
      <ThemedText type="title">This is a modal</ThemedText>
        <ThemedText type="link">Go to home screen</ThemedText>
    </ThemedView>
  );
}
