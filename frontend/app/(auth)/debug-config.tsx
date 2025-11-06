import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '@/constants/constants';

/**
 * Debug Configuration Screen
 *
 * Navigate to this screen in TestFlight to verify environment configuration.
 * Access via deep link: redi://debug-config
 * Or add a temporary button in your app to navigate here during testing.
 */
export default function DebugConfigScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Environment Configuration</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <InfoRow label="API_BASE_URL" value={API_BASE_URL} />
        <InfoRow
          label="Is Localhost?"
          value={API_BASE_URL.includes('localhost') ? '⚠️ YES' : '✅ NO'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expo Constants</Text>
        <InfoRow
          label="App Ownership"
          value={Constants.appOwnership || 'undefined'}
        />
        <InfoRow label="Is Device" value={Constants.isDevice ? 'Yes' : 'No'} />
        <InfoRow label="__DEV__" value={__DEV__ ? 'true' : 'false'} />
        <InfoRow
          label="Release Channel"
          value={Constants.expoConfig?.releaseChannel || 'undefined'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expo Config Extra</Text>
        <InfoRow
          label="apiBaseUrl"
          value={Constants.expoConfig?.extra?.apiBaseUrl || 'undefined'}
        />
        <InfoRow
          label="EAS Project ID"
          value={Constants.expoConfig?.extra?.eas?.projectId || 'undefined'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <InfoRow
          label="App Name"
          value={Constants.expoConfig?.name || 'undefined'}
        />
        <InfoRow
          label="Version"
          value={Constants.expoConfig?.version || 'undefined'}
        />
        <InfoRow
          label="iOS Build Number"
          value={Constants.expoConfig?.ios?.buildNumber || 'undefined'}
        />
        <InfoRow
          label="Bundle ID"
          value={Constants.expoConfig?.ios?.bundleIdentifier || 'undefined'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Expo Config (Extra)</Text>
        <Text style={styles.json}>
          {JSON.stringify(Constants.expoConfig?.extra, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const isWarning = value.includes('localhost') || value === 'undefined';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, isWarning && styles.warning]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  warning: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  json: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
});
