import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 12, backgroundColor: '#0ea5e9', borderRadius: 4 }}>
      <Text style={{ color: 'white', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
};
