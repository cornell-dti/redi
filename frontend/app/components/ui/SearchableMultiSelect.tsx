import { Check, Square, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppColors } from '../AppColors';
import AppInput from './AppInput';
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
  description?: string; // Extra gray text below as a description
}

export default function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Search...',
  emptyText = 'All options',
  label,
  description,
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
      <View style={styles.topTextContainer}>
        {label && <AppText variant="subtitle">{label}</AppText>}
        <AppText color="dimmer"> {description && description}</AppText>
      </View>
      {/* Display Button */}
      <ListItemWrapper>
        {/* Selected Items Display */}
        {selected.length > 0 && (
          <View style={styles.selectedContainer}>
            {selected.map((item) => (
              <Tag
                key={item}
                label={item}
                dismissible
                variant="white"
                onDismiss={() => removeItem(item)}
              />
            ))}
          </View>
        )}

        <Button
          onPress={() => setIsOpen(true)}
          variant="secondary"
          noRound
          title={
            selected.length === 0
              ? emptyText
              : `${selected.length} selected • Select more`
          }
        />
      </ListItemWrapper>

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
        <AppInput
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
                      <Check size={20} color={AppColors.backgroundDefault} />
                    ) : (
                      <Square color={AppColors.foregroundDimmer} />
                    )
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

        <ListItemWrapper style={styles.actions}>
          <Button
            title="Done"
            iconLeft={Check}
            onPress={() => setIsOpen(false)}
            variant="primary"
            fullWidth
            noRound
          />

          {selected.length > 0 && (
            <Button
              title="Clear All"
              onPress={clearAll}
              variant="negative"
              noRound
              iconLeft={X}
            />
          )}
        </ListItemWrapper>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  topTextContainer: {
    paddingLeft: 16,
    display: 'flex',
    gap: 4,
    flexDirection: 'column',
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 4,
  },
  list: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 24,
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
    paddingTop: 12,
  },
});
