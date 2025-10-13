import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import ListItem from './ListItem';
import Sheet from './Sheet';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  allowOther?: boolean; // Allow custom text input
}

export default function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder = 'Search...',
  label,
  allowOther = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

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
      {label && <AppText style={styles.label}>{label}</AppText>}
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

      <Sheet
        visible={isOpen}
        onDismiss={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
        title={label || 'Select an option'}
        height="80%"
      >
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={AppColors.foregroundDimmer}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />

        <FlatList
          data={filteredOptions}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <ListItem
              title={item}
              onPress={() => handleSelect(item)}
              selected={false}
            />
          )}
          ListEmptyComponent={() => (
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
          style={styles.list}
        />
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
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
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
  searchInput: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: AppColors.foregroundDefault,
  },
  list: {
    flex: 1,
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
