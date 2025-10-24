import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ChatHistoryScreen() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await apiClient.get('/children');
      return response.data;
    },
  });

  React.useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children]);

  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', selectedChild],
    queryFn: async () => {
      if (!selectedChild) return [];
      const response = await apiClient.get(`/conversations/${selectedChild}/sessions`);
      return response.data;
    },
    enabled: !!selectedChild,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedChild, selectedSession],
    queryFn: async () => {
      if (!selectedChild || !selectedSession) return [];
      const response = await apiClient.get(`/conversations/${selectedChild}/sessions/${selectedSession}/messages`);
      return response.data;
    },
    enabled: !!selectedChild && !!selectedSession,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchSessions();
    setRefreshing(false);
  }, []);

  async function exportConversations(format: 'json' | 'csv') {
    if (!selectedChild) return;

    try {
      const response = await apiClient.get(`/export/child/${selectedChild}/conversations.${format}`, {
        responseType: 'blob',
      });

      const filename = `conversations-${selectedChild}.${format}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, response.data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Exported to ${filename}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export conversations');
    }
  }

  if (childrenLoading || sessionsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (selectedSession) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <TouchableOpacity onPress={() => setSelectedSession(null)}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back to Sessions</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {messages?.map((msg: any) => (
            <View
              key={msg.id}
              style={{
                backgroundColor: msg.role === 'CHILD' ? '#DBEAFE' : 'white',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                alignSelf: msg.role === 'CHILD' ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#6B7280' }}>
                {msg.role}
              </Text>
              <Text style={{ fontSize: 14 }}>{msg.content}</Text>
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Chat History</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => exportConversations('csv')}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {sessions && sessions.length > 0 ? (
          sessions.map((session: any) => (
            <TouchableOpacity
              key={session.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
              onPress={() => setSelectedSession(session.id)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  {new Date(session.startedAt).toLocaleDateString()}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {session.messages?.length || 0} messages
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                {new Date(session.startedAt).toLocaleTimeString()}
              </Text>
              {session.messages?.[0] && (
                <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }} numberOfLines={2}>
                  {session.messages[0].content}
                </Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 40 }}>
            No conversations yet
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
