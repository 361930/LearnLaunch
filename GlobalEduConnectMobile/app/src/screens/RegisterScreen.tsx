import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Title, 
  Paragraph,
  RadioButton,
  useTheme,
  Snackbar,
  HelperText
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { demoUsers } from '../seed/demoUsers';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Form validation states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, error, clearError } = useAuth();
  const theme = useTheme();

  // Check if email is from a demo account
  useEffect(() => {
    const demoUser = demoUsers.find(user => user.email === email);
    if (demoUser) {
      setName(demoUser.name);
      setRole(demoUser.role as 'student' | 'teacher');
    }
  }, [email]);

  // Show error from auth context
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setShowSnackbar(true);
    }
  }, [error]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      await register({
        name,
        email,
        password,
        role,
        isDemo: demoUsers.some(user => user.email === email)
      });
      
      // Navigation to Dashboard will happen automatically via AppNavigator
      // based on the user state in AuthContext
    } catch (error) {
      // Error is handled in AuthContext and displayed via error state
      console.log('Error during registration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Create Account</Title>
          <Paragraph style={styles.subtitle}>
            Join GlobalEduConnect to start your learning journey
          </Paragraph>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            disabled={isSubmitting}
            left={<TextInput.Icon icon="account" />}
            error={!!errors.name}
          />
          {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            disabled={isSubmitting}
            left={<TextInput.Icon icon="email" />}
            error={!!errors.email}
          />
          {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isSubmitting}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"} 
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
            error={!!errors.password}
          />
          {errors.password ? <HelperText type="error">{errors.password}</HelperText> : null}

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isSubmitting}
            left={<TextInput.Icon icon="lock-check" />}
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword ? <HelperText type="error">{errors.confirmPassword}</HelperText> : null}

          <Text style={styles.roleLabel}>I want to join as:</Text>
          <View style={styles.roleContainer}>
            <View style={styles.roleOption}>
              <RadioButton
                value="student"
                status={role === 'student' ? 'checked' : 'unchecked'}
                onPress={() => setRole('student')}
                disabled={isSubmitting}
                color={theme.colors.primary}
              />
              <Text onPress={() => setRole('student')}>Student</Text>
            </View>
            <View style={styles.roleOption}>
              <RadioButton
                value="teacher"
                status={role === 'teacher' ? 'checked' : 'unchecked'}
                onPress={() => setRole('teacher')}
                disabled={isSubmitting}
                color={theme.colors.primary}
              />
              <Text onPress={() => setRole('teacher')}>Teacher</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Create Account
          </Button>

          <View style={styles.loginContainer}>
            <Text>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => {
                clearError();
                navigation.navigate('Login');
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.loginText, { color: theme.colors.primary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Snackbar
          visible={showSnackbar}
          onDismiss={() => {
            setShowSnackbar(false);
            clearError();
          }}
          action={{
            label: 'OK',
            onPress: () => {
              setShowSnackbar(false);
              clearError();
            },
          }}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
  },
  roleLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  loginText: {
    fontWeight: 'bold',
  },
});

export default RegisterScreen;