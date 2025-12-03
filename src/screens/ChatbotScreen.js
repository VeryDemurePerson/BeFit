import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { sendMessageToGemini, getQuickTip } from '../services/geminiApi';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';

const ChatbotScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your AI fitness coach. Ask me anything about workouts, nutrition, or your fitness journey! 💪",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const scrollViewRef = useRef();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userProfile = userDoc.exists() ? userDoc.data() : {};

      const workoutsQuery = query(
        collection(db, 'workouts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workouts = workoutsSnapshot.docs.map(doc => doc.data());
      
      workouts.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyWorkouts = workouts.filter(w => {
        const date = w.createdAt?.toDate?.() || new Date(w.createdAt);
        return date >= oneWeekAgo;
      }).length;

      const today = new Date().toISOString().split('T')[0];
      const nutritionDoc = await getDoc(
        doc(db, 'nutrition', `${auth.currentUser.uid}_${today}`)
      );
      const todayCalories = nutritionDoc.exists() 
        ? nutritionDoc.data().totalCalories || 0 
        : 0;

      setUserData({
        totalWorkouts: userProfile.totalWorkouts || 0,
        goals: userProfile.goals || {},
        recentWorkouts: workouts.slice(0, 5),
        weeklyWorkouts,
        todayCalories,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const aiResponse = await sendMessageToGemini(inputText.trim(), userData);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    setLoading(true);
    try {
      let response;
      switch (action) {
        case 'workout':
          response = await sendMessageToGemini(
            'Suggest a workout for me today based on my history',
            userData
          );
          break;
        case 'nutrition':
          response = await sendMessageToGemini(
            'Give me nutrition advice based on my current intake',
            userData
          );
          break;
        case 'tip':
          response = await getQuickTip('general');
          break;
        case 'progress':
          response = await sendMessageToGemini(
            'Analyze my fitness progress and give me feedback',
            userData
          );
          break;
        default:
          response = 'How can I help you today?';
      }

      const aiMessage = {
        id: Date.now(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isAI = message.sender === 'ai';
    return (
      <View
        style={[
          styles.messageBubble,
          isAI ? styles.aiMessage : styles.userMessage,
          {
            backgroundColor: isAI ? colors.card : colors.accent,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isAI ? colors.text : '#FFFFFF' },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { color: isAI ? colors.subtext : '#FFFFFF' },
          ]}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const QuickActionButton = ({ title, icon, onPress }) => (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={[styles.quickActionText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Fitness Coach</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.quickActionsTitle, { color: colors.subtext }]}>
              Quick Actions:
            </Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                title="Workout Plan"
                icon="💪"
                onPress={() => handleQuickAction('workout')}
              />
              <QuickActionButton
                title="Nutrition Tips"
                icon="🥗"
                onPress={() => handleQuickAction('nutrition')}
              />
              <QuickActionButton
                title="Quick Tip"
                icon="💡"
                onPress={() => handleQuickAction('tip')}
              />
              <QuickActionButton
                title="My Progress"
                icon="📊"
                onPress={() => handleQuickAction('progress')}
              />
            </View>
          </View>

          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.subtext }]}>
                Thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.subtext}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? colors.accent : colors.border,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 10 },
  quickActionsContainer: { marginBottom: 20 },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionIcon: { fontSize: 16, marginRight: 6 },
  quickActionText: { fontSize: 13, fontWeight: '500' },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  timestamp: { fontSize: 11, opacity: 0.7 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: { marginLeft: 10, fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
});

export default ChatbotScreen;