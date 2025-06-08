import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

function SignInButton() {
  const { signIn } = useAuth();

  return (
    <TouchableOpacity
      onPress={signIn}
      style={{ marginRight: 15, flexDirection: 'row', alignItems: 'center' }}
    >
      <Ionicons name="log-in-outline" size={24} color="#4F46E5" />
      <Text style={{ marginLeft: 8, color: '#4F46E5', fontWeight: '500' }}>Sign In</Text>
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props) {
  const { user, signOut } = useAuth();

  const handleSupport = () => {
    Alert.alert(
      "Need Help?",
      "For now, please contact the development team directly for support.",
      [{ text: "OK" }]
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      )}
      <DrawerItem
        label="Home"
        icon={({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        )}
        onPress={() => props.navigation.navigate('MainHome')}
      />
      
      <View style={styles.separator} />
      
      <View style={styles.bottomSection}>
        <Text style={styles.sectionTitle}>Legal & Support</Text>
        <DrawerItem
          label="Privacy Policy"
          icon={({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Privacy')}
        />
        <DrawerItem
          label="Contact Support"
          icon={({ color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          )}
          onPress={handleSupport}
        />
      </View>

      {user && (
        <>
          <View style={styles.separator} />
          <DrawerItem
            label="Sign Out"
            icon={({ color, size }) => (
              <Ionicons name="log-out-outline" size={size} color={color} />
            )}
            onPress={signOut}
          />
        </>
      )}
    </DrawerContentScrollView>
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
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
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
});