import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Main Screens
import DashboardStudent from '../screens/DashboardStudent';
import DashboardTeacher from '../screens/DashboardTeacher';
import ClassListScreen from '../screens/ClassListScreen';
import ClassDetailScreen from '../screens/ClassDetailScreen';
import DiscussionScreen from '../screens/DiscussionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import CreateClassScreen from '../screens/CreateClassScreen';

// Stack types
type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

type MainStackParamList = {
  StudentTabs: undefined;
  TeacherTabs: undefined;
  ClassDetail: { classId: number };
  Discussion: { classId: number };
  CreateClass: undefined;
  Search: { query?: string };
};

type StudentTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Profile: undefined;
};

type TeacherTabParamList = {
  Dashboard: undefined;
  Classes: undefined;
  Profile: undefined;
};

// Create the navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();
const TeacherTab = createBottomTabNavigator<TeacherTabParamList>();

// Auth stack navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Student tab navigator
const StudentTabNavigator = () => {
  return (
    <StudentTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Classes') {
            iconName = 'school';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }
          
          return (
            <MaterialCommunityIcons 
              name={iconName || 'help-circle'} 
              size={size} 
              color={color} 
            />
          );
        },
      })}
    >
      <StudentTab.Screen name="Dashboard" component={DashboardStudent} />
      <StudentTab.Screen name="Classes" component={ClassListScreen} />
      <StudentTab.Screen name="Profile" component={ProfileScreen} />
    </StudentTab.Navigator>
  );
};

// Teacher tab navigator
const TeacherTabNavigator = () => {
  return (
    <TeacherTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Classes') {
            iconName = 'teach';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }
          
          return (
            <MaterialCommunityIcons 
              name={iconName || 'help-circle'} 
              size={size} 
              color={color} 
            />
          );
        },
      })}
    >
      <TeacherTab.Screen name="Dashboard" component={DashboardTeacher} />
      <TeacherTab.Screen name="Classes" component={ClassListScreen} />
      <TeacherTab.Screen name="Profile" component={ProfileScreen} />
    </TeacherTab.Navigator>
  );
};

// Main stack navigator
const MainNavigator = () => {
  const { user } = useAuth();
  
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === 'teacher' ? (
        <MainStack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
      ) : (
        <MainStack.Screen name="StudentTabs" component={StudentTabNavigator} />
      )}
      <MainStack.Screen 
        name="ClassDetail" 
        component={ClassDetailScreen}
        options={{ headerShown: true, title: 'Class Details' }} 
      />
      <MainStack.Screen 
        name="Discussion"
        component={DiscussionScreen}
        options={{ headerShown: true, title: 'Discussion' }}
      />
      <MainStack.Screen 
        name="CreateClass"
        component={CreateClassScreen}
        options={{ headerShown: true, title: 'Create New Class' }}
      />
      <MainStack.Screen 
        name="Search"
        component={SearchScreen}
        options={{ headerShown: true, title: 'Search Classes' }}
      />
    </MainStack.Navigator>
  );
};

// Root navigator
export const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const scheme = useColorScheme();
  
  // If still loading auth state, you could return a splash screen here
  if (isLoading) {
    // Return Splash Screen component
    return null;
  }
  
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;