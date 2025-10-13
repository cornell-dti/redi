import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import Sheet from './Sheet';
import ListItem from './ListItem';

interface SearchableMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string; // Text to show when nothing selected (e.g., "All majors")
  label?: string;
}

export default function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Search...',
  emptyText = 'All options',
  label,
}: SearchableMultiSelectProps) {
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

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const removeItem = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  return (
    <View style={styles.container}>
      {label && <AppText style={styles.label}>{label}</AppText>}

      {/* Display Button */}
      <TouchableOpacity
        style={styles.displayButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <AppText
          style={[
            styles.displayText,
            selected.length === 0 && { color: AppColors.foregroundDimmer },
          ]}
        >
          {selected.length === 0 ? emptyText : `${selected.length} selected`}
        </AppText>
      </TouchableOpacity>

      {/* Selected Items Display */}
      {selected.length > 0 && (
        <View style={styles.selectedContainer}>
          {selected.map((item) => (
            <View key={item} style={styles.selectedChip}>
              <AppText
                style={styles.chipText}
                numberOfLines={1}
                color="inverse"
              >
                {item}
              </AppText>
              <TouchableOpacity
                onPress={() => removeItem(item)}
                style={styles.chipRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={AppColors.backgroundDefault} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Sheet Modal */}
      <Sheet
        visible={isOpen}
        onDismiss={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
        title={label || 'Select options'}
        height="80%"
      >
        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={AppColors.foregroundDimmer}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />

        {/* Options List */}
        <FlatList
          data={filteredOptions}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <ListItem
              title={item}
              selected={selected.includes(item)}
              onPress={() => toggleOption(item)}
              right={
                selected.includes(item) ? (
                  <Check size={20} color={AppColors.accentDefault} />
                ) : null
              }
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>No results found</AppText>
            </View>
          )}
          style={styles.list}
        />

        {/* Actions */}
        <View style={styles.actions}>
          {selected.length > 0 && (
            <Button title="Clear All" onPress={clearAll} variant="secondary" />
          )}
          <Button
            title="Done"
            onPress={() => setIsOpen(false)}
            variant="primary"
          />
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.foregroundDefault,
  },
  displayButton: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 16,
    color: AppColors.foregroundDefault,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accentDefault,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 14,
    marginRight: 8,
    flex: 1,
  },
  chipRemove: {
    padding: 2,
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
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    gap: 12,
  },
});
