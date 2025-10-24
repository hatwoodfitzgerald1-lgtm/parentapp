import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  async function handleRegister() {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, firstName, lastName);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' }}>
          Join to monitor your child's interactions
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
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <TextInput
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

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
          placeholder="Password (min 8 characters)"
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
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ textAlign: 'center', color: '#3B82F6', fontSize: 14 }}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
