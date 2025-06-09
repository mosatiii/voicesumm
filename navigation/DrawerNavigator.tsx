import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AuthStack from './AuthStack';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

function SignInButton() {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignIn}
      style={{ marginRight: 15, flexDirection: 'row', alignItems: 'center' }}
    >
      <Ionicons name="log-in-outline" size={24} color="#4F46E5" />
      <Text style={{ marginLeft: 8, color: '#4F46E5', fontWeight: '500' }}>Sign In</Text>
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

  const handleSupport = () => {
    Alert.alert(
      "Need Help?",
      "For now, please contact the development team directly for support.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.drawerItem}
        onPress={() => props.navigation.navigate('MainHome')}
      >
        <Ionicons name="home-outline" size={24} color="#374151" />
        <Text style={styles.drawerItemText}>Home</Text>
      </TouchableOpacity>
      
      <View style={styles.separator} />
      
      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>Legal & Support</Text>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => props.navigation.navigate('Privacy')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
          <Text style={styles.drawerItemText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={handleSupport}
        >
          <Ionicons name="mail-outline" size={24} color="#374151" />
          <Text style={styles.drawerItemText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={signOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#374151" />
            <Text style={styles.drawerItemText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export default function DrawerNavigator() {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerActiveBackgroundColor: '#4F46E5',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#374151',
      }}
    >
      <Drawer.Screen 
        name="MainHome" 
        component={TabNavigator}
        options={{
          title: 'Home',
          headerRight: () => !user ? <SignInButton /> : null,
        }}
      />
      <Drawer.Screen 
        name="Privacy" 
        component={PrivacyPolicyScreen}
        options={{
          title: 'Privacy Policy',
          drawerItemStyle: { height: 0 }
        }}
      />
      {!user && (
        <Drawer.Screen
          name="Auth"
          component={AuthStack}
          options={{
            headerShown: false,
            drawerItemStyle: { height: 0 },
            swipeEnabled: false
          }}
        />
      )}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  userInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  bottomSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  drawerItemText: {
    marginLeft: 32,
    fontSize: 16,
    color: '#374151',
  },
});