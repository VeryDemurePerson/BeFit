import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../screens/ThemeContext';
import { lightTheme, darkTheme } from '../screens/themes';

const FloatingChatButton = ({ onPress }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <TouchableOpacity
      style={[styles.floatingButton, { backgroundColor: colors.accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.Text style={styles.buttonText}>🤖</Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Above the tab bar
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999,
  },
  buttonText: {
    fontSize: 28,
  },
});

export default FloatingChatButton;