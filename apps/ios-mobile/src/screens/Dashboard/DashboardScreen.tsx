import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

export default function DashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const { data: devices, isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await apiClient.get('/devices');
      return response.data;
    },
  });

  const { data: children, isLoading: childrenLoading, refetch: refetchChildren } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await apiClient.get('/children');
      return response.data;
    },
  });

  const { data: highlights, refetch: refetchHighlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: async () => {
      if (!children || children.length === 0) return [];
      const response = await apiClient.get(`/highlights?childId=${children[0].id}`);
      return response.data;
    },
    enabled: !!children && children.length > 0,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDevices(), refetchChildren(), refetchHighlights()]);
    setRefreshing(false);
  }, []);

  if (devicesLoading || childrenLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const device = devices?.[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
              Welcome, {user?.firstName}
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 4 }}>
              Monitor your child's AI experiences
            </Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: '#EF4444', fontSize: 14 }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {device && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Device Status
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Battery</Text>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>{device.batteryPct}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Play Time</Text>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>{device.playTimeMin} min</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Adventures</Text>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>{device.adventuresCount}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>Online</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
            Recent Highlights
          </Text>
          {highlights && highlights.length > 0 ? (
            highlights.slice(0, 3).map((highlight: any) => (
              <View key={highlight.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', textTransform: 'uppercase' }}>
                    {highlight.category}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(highlight.occurredAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                  {highlight.title}
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280' }} numberOfLines={2}>
                  {highlight.summary}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 }}>
              No highlights yet
            </Text>
          )}
        </View>

        {children && children.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Children
            </Text>
            {children.map((child: any) => (
              <View key={child.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  {child.firstName} {child.lastName}
                </Text>
                {child.className && (
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                    {child.className}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
