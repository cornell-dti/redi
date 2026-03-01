import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../AppColors';
import AppInput from './AppInput';
import AppText from './AppText';
import Button from './Button';
import ListItem from './ListItem';
import ListItemWrapper from './ListItemWrapper';
import Sheet from './Sheet';

const GEOAPIFY_API_KEY =
  (Constants.expoConfig?.extra?.geoapifyApiKey as string) || '';

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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoapifyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchCities = async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      setResults([]);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setPending(false);
    setLoading(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&type=city&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });
      const data = await response.json();

      if (data.features) {
        const mapped: GeoapifyResult[] = data.features.map((f: any) => ({
          city: f.properties.city || f.properties.name,
          state: f.properties.state,
          country: f.properties.country,
          formatted: f.properties.formatted,
        }));

        const seen = new Set<string>();
        setResults(
          mapped.filter((r) => {
            if (seen.has(r.formatted)) return false;
            seen.add(r.formatted);
            return true;
          })
        );
      }
    } catch (e: any) {
      // Ignore aborted requests — they're intentional cancellations
      if (e?.name !== 'AbortError') setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setPending(true);
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(text), 300);
  };

  const handleSelect = (result: GeoapifyResult) => {
    const displayValue = [result.city, result.state, result.country]
      .filter(Boolean)
      .join(', ');
    onSelect(displayValue || result.formatted);
    handleDismiss();
  };

  const handleCustom = () => {
    if (query.trim()) {
      onSelect(query.trim());
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <AppText style={[!value && { color: AppColors.foregroundDimmer }]}>
          {value || placeholder}
        </AppText>
      </TouchableOpacity>

      <Sheet
        visible={isOpen}
        onDismiss={handleDismiss}
        title="Where are you from?"
        bottomRound={false}
        height="50%"
      >
        <AppInput
          placeholder="Search city or town..."
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          autoCapitalize="words"
          maxLength={80}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={AppColors.foregroundDimmer} />
          </View>
        )}

        {!loading && results.length > 0 && (
          <ListItemWrapper style={styles.list}>
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
        )}

        {!loading && !pending && results.length === 0 && query.trim().length >= 2 && (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>No cities found</AppText>
            <Button
              title={`Use "${query.trim()}"`}
              onPress={handleCustom}
              variant="primary"
            />
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: AppColors.backgroundDimmer,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.backgroundDimmer,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  list: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.foregroundDimmer,
  },
});
