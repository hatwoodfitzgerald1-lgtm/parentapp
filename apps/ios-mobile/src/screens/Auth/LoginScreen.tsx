import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          Parents App
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' }}>
          Monitor your child's AI Toy interactions
        </Text>

        <TextInput
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={{
            backgroundColor: loading ? '#93C5FD' : '#3B82F6',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={{ textAlign: 'center', color: '#3B82F6', fontSize: 14 }}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 40, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Demo Accounts:</Text>
          <Text style={{ fontSize: 12, color: '#92400E' }}>Parent: parent1@demo.com / Parent123!</Text>
          <Text style={{ fontSize: 12, color: '#92400E' }}>Admin: admin@demo.com / Admin123!</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
