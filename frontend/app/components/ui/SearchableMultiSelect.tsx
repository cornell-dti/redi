import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppText from './AppText';
import Button from './Button';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';
import Tag from './Tag';

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
            <Tag
              key={item}
              label={item}
              variant="accent"
              dismissible
              onDismiss={() => removeItem(item)}
            />
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
        {filteredOptions.length > 0 ? (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <ListItemWrapper>
              {filteredOptions.map((item, index) => (
                <ListItem
                  key={`${item}-${index}`}
                  title={item}
                  selected={selected.includes(item)}
                  onPress={() => toggleOption(item)}
                  right={
                    selected.includes(item) ? (
                      <Check size={20} color={AppColors.accentDefault} />
                    ) : null
                  }
                />
              ))}
            </ListItemWrapper>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>No results found</AppText>
          </View>
        )}

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
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
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
  scrollView: {
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
