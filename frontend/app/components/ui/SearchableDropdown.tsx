import React, { useEffect, useState } from 'react';
import { useThemeAware } from "../../contexts/ThemeContext";
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppInput from './AppInput';
import AppText from './AppText';
import Button from './Button';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  allowOther?: boolean; // Allow custom text input
  autoOpen?: boolean; // Automatically open the sheet on mount
  onDismiss?: () => void; // Called when sheet is dismissed
}

export default function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder = 'Search...',
  label,
  allowOther = false,
  autoOpen = false,
  onDismiss,
}: SearchableDropdownProps) {
  useThemeAware(); // Force re-render when theme changes
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options]);

  const handleSelect = (option: string) => {
    onSelect(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleOther = () => {
    if (allowOther && searchQuery.trim()) {
      onSelect(searchQuery.trim());
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {!autoOpen && (
        <>
          {label && (
            <AppText variant="subtitle" style={styles.label}>
              {label}
            </AppText>
          )}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.7}
          >
            <AppText
              style={[
                styles.inputText,
                !value && { color: AppColors.foregroundDimmer },
              ]}
            >
              {value || placeholder}
            </AppText>
          </TouchableOpacity>
        </>
      )}

      <Sheet
        visible={isOpen}
        onDismiss={() => {
          setIsOpen(false);
          setSearchQuery('');
          onDismiss?.();
        }}
        title={label || 'Select an option'}
        height="50%"
        bottomRound={false}
      >
        <AppInput
          placeholder={placeholder}
          placeholderTextColor={AppColors.foregroundDimmer}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          maxLength={allowOther ? 60 : undefined}
        />

        {filteredOptions.length > 0 ? (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <ListItemWrapper style={styles.list}>
              {filteredOptions.map((item, index) => (
                <ListItem
                  key={`${item}-${index}`}
                  title={item}
                  onPress={() => handleSelect(item)}
                  selected={false}
                />
              ))}
            </ListItemWrapper>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>No results found</AppText>
            {allowOther && searchQuery.trim() && (
              <Button
                title={`Use "${searchQuery}"`}
                onPress={handleOther}
                variant="primary"
              />
            )}
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  list: {
    marginBottom: 16,
  },
  scrollView: {
    marginTop: 16,
    maxHeight: '100%',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
    marginBottom: 16,
  },
});
