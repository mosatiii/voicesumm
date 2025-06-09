import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RecorderScreen from '../screens/RecorderScreen';
import TodoScreen from '../screens/TodoScreen';
import RecordingsScreen from '../screens/RecordingsScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 40 : 75;
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 16;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: 'white',
          height: TAB_BAR_HEIGHT + BOTTOM_INSET,
          paddingBottom: BOTTOM_INSET,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          position: 'relative',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tab.Screen
        name="Recordings"
        component={RecordingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ marginTop: -4 }}>
              <MaterialCommunityIcons name="headphones" color={color} size={size} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: -4,
          },
        }}
      />
      <Tab.Screen
        name="Recorder"
        component={RecorderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{
              width: 64,
              height: 64,
              backgroundColor: '#3B82F6',
              borderRadius: 32,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Platform.OS === 'ios' ? 40 : 50,
              shadowColor: '#3B82F6',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
              borderWidth: 4,
              borderColor: 'white',
            }}>
              <MaterialCommunityIcons name="microphone" color="white" size={28} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="Todo"
        component={TodoScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ marginTop: -4 }}>
              <MaterialCommunityIcons name="checkbox-marked-outline" color={color} size={size} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: -4,
          },
        }}
      />
    </Tab.Navigator>
  );
}