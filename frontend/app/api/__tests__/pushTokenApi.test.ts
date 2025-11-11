import { apiClient } from '../apiClient';
import {
  registerPushToken,
  removePushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../pushTokenApi';

// Mock the apiClient
jest.mock('../apiClient');

describe('Push Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPushToken', () => {
    it('should register push token successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Push token registered successfully',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await registerPushToken('ExponentPushToken[test-token]');

      expect(result).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/api/users/push-token', {
        pushToken: 'ExponentPushToken[test-token]',
      });
    });

    it('should handle registration errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(
        new Error('Registration failed')
      );

      await expect(
        registerPushToken('ExponentPushToken[test-token]')
      ).rejects.toThrow('Registration failed');
    });

    it('should log errors to console', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      (apiClient.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        registerPushToken('ExponentPushToken[test-token]')
      ).rejects.toThrow();

      expect(consoleError).toHaveBeenCalledWith(
        'Error registering push token:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('removePushToken', () => {
    it('should remove push token successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Push token removed successfully',
      };

      (apiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await removePushToken();

      expect(result).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/users/push-token');
    });

    it('should handle removal errors', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValue(
        new Error('Removal failed')
      );

      await expect(removePushToken()).rejects.toThrow('Removal failed');
    });
  });

  describe('getNotificationPreferences', () => {
    it('should get notification preferences successfully', async () => {
      const mockPreferences = {
        newMessages: true,
        matchDrops: false,
        mutualNudges: true,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await getNotificationPreferences();

      expect(result).toEqual(mockPreferences);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/users/notification-preferences'
      );
    });

    it('should handle fetch errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(
        new Error('Fetch failed')
      );

      await expect(getNotificationPreferences()).rejects.toThrow(
        'Fetch failed'
      );
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: {
          newMessages: false,
          matchDrops: true,
          mutualNudges: true,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateNotificationPreferences({
        newMessages: false,
      });

      expect(result).toEqual(mockResponse.preferences);
      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/users/notification-preferences',
        { newMessages: false }
      );
    });

    it('should update multiple preferences at once', async () => {
      const mockResponse = {
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: {
          newMessages: false,
          matchDrops: false,
          mutualNudges: true,
        },
      };

      (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await updateNotificationPreferences({
        newMessages: false,
        matchDrops: false,
      });

      expect(result).toEqual(mockResponse.preferences);
      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/users/notification-preferences',
        {
          newMessages: false,
          matchDrops: false,
        }
      );
    });

    it('should handle update errors', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        updateNotificationPreferences({ newMessages: false })
      ).rejects.toThrow('Update failed');
    });
  });
});
