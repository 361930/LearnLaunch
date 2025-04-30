import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Title, 
  Paragraph,
  useTheme,
  Snackbar,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { demoUsers } from '../seed/demoUsers';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, error, clearError } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setShowSnackbar(true);
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setSnackbarMessage('Please enter both email and password.');
      setShowSnackbar(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      // Navigation to Dashboard will happen automatically via the AppNavigator
      // based on the user state in AuthContext
    } catch (error) {
      // Error is handled in the AuthContext and displayed via the error state
      console.log('Error during login:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'teacher') => {
    const demoUser = demoUsers.find(user => user.role === role);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword(demoUser.password);
      
      try {
        setIsSubmitting(true);
        await login(demoUser.email, demoUser.password);
      } catch (error) {
        // We'll show a special message for demo accounts
        Alert.alert(
          'Demo Account',
          'Demo accounts need to be registered first. Would you like to register this demo account?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes', 
              onPress: () => navigation.navigate('Register')
            },
          ]
        );
      } finally {
        setIsSubmitting(false);
      }
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
          <Title style={styles.title}>GlobalEduConnect</Title>
          <Paragraph style={styles.subtitle}>
            Connect, Learn, Grow Anywhere
          </Paragraph>
        </View>

        <View style={styles.formContainer}>
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
            error={!!error}
          />

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
            error={!!error}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Log In
          </Button>

          <View style={styles.registerContainer}>
            <Text>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => {
                clearError();
                navigation.navigate('Register');
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.registerText, { color: theme.colors.primary }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Try Demo Accounts:</Text>
            <View style={styles.demoButtons}>
              <Button
                mode="outlined"
                onPress={() => handleDemoLogin('student')}
                style={[styles.demoButton, { borderColor: theme.colors.primary }]}
                disabled={isSubmitting}
              >
                Student Demo
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleDemoLogin('teacher')}
                style={[styles.demoButton, { borderColor: theme.colors.primary }]}
                disabled={isSubmitting}
              >
                Teacher Demo
              </Button>
            </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
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
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  registerText: {
    fontWeight: 'bold',
  },
  demoContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  demoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default LoginScreen;