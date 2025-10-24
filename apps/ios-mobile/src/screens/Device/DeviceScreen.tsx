import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

export default function DeviceScreen() {
  const queryClient = useQueryClient();

  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await apiClient.get('/devices');
      return response.data;
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const sendCommandMutation = useMutation({
    mutationFn: async ({ deviceId, type }: { deviceId: string; type: string }) => {
      const response = await apiClient.post(`/devices/${deviceId}/commands`, {
        type,
        args: {},
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Command sent to device');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send command');
    },
  });

  async function handlePing(deviceId: string) {
    sendCommandMutation.mutate({ deviceId, type: 'ping' });
  }

  async function handleSyncPolicy(deviceId: string) {
    try {
      await apiClient.post(`/devices/${deviceId}/policy/push`);
      Alert.alert('Success', 'Policy synced to device');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to sync policy');
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const device = devices?.[0];

  if (!device) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No Device Paired</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
          Pair an AI Toy device to get started
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => Alert.alert('Pairing', 'BLE pairing requires a physical iPhone device')}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Pair Device</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{device.displayName || 'AI Toy'}</Text>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Status</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Device ID</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.id}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Firmware</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.firmwareVersion || 'Unknown'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>TPU Present</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: device.tpuPresent ? '#10B981' : '#EF4444' }}>
              {device.tpuPresent ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Battery</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.batteryPct}%</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Last Seen</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>
              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Usage</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Play Time</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.playTimeMin} minutes</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Adventures</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.adventuresCount}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Policy Version</Text>
            <Text style={{ fontSize: 14, fontWeight: '500' }}>{device.policyVersion}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Actions</Text>

          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={() => handlePing(device.id)}
            disabled={sendCommandMutation.isPending}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Ping Device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => handleSyncPolicy(device.id)}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Sync Safety Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
