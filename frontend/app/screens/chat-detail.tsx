import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

// Mock chat messages
const mockMessages = [
  {
    id: '1',
    text: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 3600000),
    isOwn: false,
  },
  {
    id: '2',
    text: "Hi there! I'm doing great, thanks for asking! How about you?",
    timestamp: new Date(Date.now() - 3580000),
    isOwn: true,
  },
  {
    id: '3',
    text: "Pretty good! I saw you're in CS too. What year are you?",
    timestamp: new Date(Date.now() - 3560000),
    isOwn: false,
  },
  {
    id: '4',
    text: "I'm a junior! What about you?",
    timestamp: new Date(Date.now() - 3540000),
    isOwn: true,
  },
  {
    id: '5',
    text: 'Same here! Have you taken CS 4820 yet?',
    timestamp: new Date(Date.now() - 3520000),
    isOwn: false,
  },
  {
    id: '6',
    text: 'Yes, I took it last semester. Really challenging but fun!',
    timestamp: new Date(Date.now() - 3500000),
    isOwn: true,
  },
  {
    id: '7',
    text: "Want to grab coffee at CTB this weekend? I'd love to hear more about your experience with the class",
    timestamp: new Date(Date.now() - 120000),
    isOwn: false,
  },
];

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export default function ChatDetailScreen() {
  const { userId, name } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        timestamp: new Date(),
        isOwn: true,
      };
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
      <Text
        style={[
          styles.messageTime,
          item.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
        ]}
      >
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerStatus}>Active now</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="videocam-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialIcons name="add" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={newMessage.trim() ? 'white' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Match Info Banner (for new matches) */}
      <View style={styles.matchBanner}>
        <MaterialIcons name="favorite" size={20} color="#FF6B6B" />
        <Text style={styles.matchBannerText}>
          You and {name} liked each other!
        </Text>
        <TouchableOpacity>
          <Text style={styles.matchBannerAction}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 8,
  },
  ownMessageTime: {
    color: '#999',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 24,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  sendButtonInactive: {
    backgroundColor: '#F0F0F0',
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F9',
    borderTopWidth: 1,
    borderTopColor: '#FFE1E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  matchBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  matchBannerAction: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
