import React from 'react';
import AppInput from '../ui/AppInput';
import CustomButton from '../ui/CustomButton';
import SectionCard from '../ui/SectionCard';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
  buttonTitle?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search...',
  loading = false,
  buttonTitle = 'Search',
}) => {
  return (
    <SectionCard>
      <AppInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
      />
      <CustomButton
        title={buttonTitle}
        onPress={onSearch}
        loading={loading}
        fullWidth
      />
    </SectionCard>
  );
};

export default SearchBar;
