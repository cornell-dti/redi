import { House } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { apiClient } from '../../api/apiClient';
import { AppColors } from '../AppColors';
import AppInput from './AppInput';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';

interface GeoapifyResult {
  city?: string;
  state?: string;
  country?: string;
  formatted: string;
}

interface CityAutocompleteProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder?: string;
}

export default function CityAutocomplete({
  value,
  onSelect,
  placeholder = 'E.g. New York City',
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoapifyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchCities = async (text: string) => {
    if (!text.trim() || text.trim().length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.get<{ results: GeoapifyResult[] }>(
        `/api/geocode/cities?q=${encodeURIComponent(text)}`
      );

      if (data.results) {
        setResults(data.results);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    onSelect(text);
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(text), 300);
  };

  const handleSelect = (result: GeoapifyResult) => {
    const displayValue = [result.city, result.state, result.country]
      .filter(Boolean)
      .join(', ');
    const selected = displayValue || result.formatted;
    setQuery(selected);
    onSelect(selected);
    setResults([]);
  };

  return (
    <View>
      <View style={styles.inputWrapper}>
        <AppInput
          placeholder={placeholder}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="words"
          maxLength={80}
          style={{ paddingRight: 44 }}
        />
        <View style={styles.inputIcon} pointerEvents="none">
          <House size={18} color={AppColors.foregroundDimmer} />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={AppColors.foregroundDimmer} />
        </View>
      )}

      {!loading && results.length > 0 && (
        <ScrollView
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <ListItemWrapper>
            {results.map((result, index) => (
              <ListItem
                key={`${result.formatted}-${index}`}
                title={
                  [result.city, result.state, result.country]
                    .filter(Boolean)
                    .join(', ') || result.formatted
                }
                onPress={() => handleSelect(result)}
                selected={false}
              />
            ))}
          </ListItemWrapper>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  resultsList: {
    maxHeight: 260,
    marginTop: 12,
  },
});
