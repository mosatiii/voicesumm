import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RecorderScreen from '../screens/RecorderScreen';
import TodoScreen from '../screens/TodoScreen';
import { Mic, CheckSquare } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {

    
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          height: 60,
          paddingBottom: 5,
        },
      }}
    >
      <Tab.Screen
        name="Recorder"
        component={RecorderScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Todo"
        component={TodoScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}