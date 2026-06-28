import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

export function InputField({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  error,
  label,
  autoCapitalize = 'none',
}) {
  const { isDark } = useTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: themeColors.muted[colorScheme] }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            borderColor: error ? themeColors.destructive : themeColors.border[colorScheme],
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : themeColors.secondary.light,
          },
        ]}
      >
        {Icon && <Icon size={16} color={themeColors.muted[colorScheme]} style={styles.icon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={themeColors.muted[colorScheme]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            {
              color: themeColors.foreground[colorScheme],
            },
          ]}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  error: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});
