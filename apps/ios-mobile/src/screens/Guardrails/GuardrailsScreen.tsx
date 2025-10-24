import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

export default function GuardrailsScreen() {
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await apiClient.get('/children');
      return response.data;
    },
  });

  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children]);

  const { data: guardrails, isLoading: guardrailsLoading } = useQuery({
    queryKey: ['guardrails', selectedChild],
    queryFn: async () => {
      if (!selectedChild) return null;
      const response = await apiClient.get(`/children/${selectedChild}/guardrails`);
      return response.data;
    },
    enabled: !!selectedChild,
  });

  const [formData, setFormData] = useState({
    ageRating: 'G',
    blockedKeywords: '',
    dailyMinutesMax: '',
    quietStartMin: '',
    quietEndMin: '',
    customInstructions: '',
  });

  useEffect(() => {
    if (guardrails) {
      setFormData({
        ageRating: guardrails.ageRating || 'G',
        blockedKeywords: (guardrails.blockedKeywords || []).join(', '),
        dailyMinutesMax: guardrails.dailyMinutesMax?.toString() || '',
        quietStartMin: guardrails.quietStartMin ? Math.floor(guardrails.quietStartMin / 60).toString() : '',
        quietEndMin: guardrails.quietEndMin ? Math.floor(guardrails.quietEndMin / 60).toString() : '',
        customInstructions: guardrails.customInstructions || '',
      });
    }
  }, [guardrails]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedChild) throw new Error('No child selected');
      const response = await apiClient.put(`/children/${selectedChild}/guardrails`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardrails', selectedChild] });
      Alert.alert('Success', 'Guardrails updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update guardrails');
    },
  });

  async function handleSave() {
    const data: any = {
      ageRating: formData.ageRating,
      blockedKeywords: formData.blockedKeywords.split(',').map((k) => k.trim()).filter(Boolean),
    };

    if (formData.dailyMinutesMax) {
      data.dailyMinutesMax = parseInt(formData.dailyMinutesMax);
    }

    if (formData.quietStartMin) {
      data.quietStartMin = parseInt(formData.quietStartMin) * 60;
    }

    if (formData.quietEndMin) {
      data.quietEndMin = parseInt(formData.quietEndMin) * 60;
    }

    if (formData.customInstructions) {
      data.customInstructions = formData.customInstructions;
    }

    updateMutation.mutate(data);
  }

  async function handleSyncToDevice() {
    if (!selectedChild) return;

    try {
      const { data: devices } = await apiClient.get('/devices');
      const device = devices.find((d: any) => d.childId === selectedChild);

      if (!device) {
        Alert.alert('Error', 'No device linked to this child');
        return;
      }

      await apiClient.post(`/devices/${device.id}/policy/push`);
      Alert.alert('Success', 'Policy synced to device');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to sync policy');
    }
  }

  if (childrenLoading || guardrailsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Safety Guardrails</Text>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Age Rating</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['G', 'PG', 'PG13'].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={{
                  flex: 1,
                  backgroundColor: formData.ageRating === rating ? '#3B82F6' : '#F3F4F6',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => setFormData({ ...formData, ageRating: rating })}
              >
                <Text style={{ color: formData.ageRating === rating ? 'white' : '#4B5563', fontWeight: '600' }}>
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Blocked Keywords</Text>
          <TextInput
            style={{
              backgroundColor: '#F9FAFB',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            placeholder="violence, location, phone number"
            value={formData.blockedKeywords}
            onChangeText={(text) => setFormData({ ...formData, blockedKeywords: text })}
            multiline
          />
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Separate with commas</Text>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Time Limits</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Daily Minutes Max</Text>
          <TextInput
            style={{
              backgroundColor: '#F9FAFB',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 16,
            }}
            placeholder="45"
            value={formData.dailyMinutesMax}
            onChangeText={(text) => setFormData({ ...formData, dailyMinutesMax: text })}
            keyboardType="numeric"
          />

          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Quiet Hours</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Start (hour)</Text>
              <TextInput
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                placeholder="20"
                value={formData.quietStartMin}
                onChangeText={(text) => setFormData({ ...formData, quietStartMin: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>End (hour)</Text>
              <TextInput
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                placeholder="7"
                value={formData.quietEndMin}
                onChangeText={(text) => setFormData({ ...formData, quietEndMin: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Custom Instructions</Text>
          <TextInput
            style={{
              backgroundColor: '#F9FAFB',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              height: 100,
            }}
            placeholder="Additional guidance for the AI assistant..."
            value={formData.customInstructions}
            onChangeText={(text) => setFormData({ ...formData, customInstructions: text })}
            multiline
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#3B82F6',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 12,
          }}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 40,
          }}
          onPress={handleSyncToDevice}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Sync to Device
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
