import { createDrawerNavigator } from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RecordingsScreen from '../screens/RecordingsScreen';
import { useState } from 'react';
import SignInScreen from '../screens/SignInScreen';
import React from 'react';

const Drawer = createDrawerNavigator();




function EmptyScreen() {
    return null;
  }
  
export default function DrawerNavigator() {
    const [isSignInVisible, setSignInVisible] = useState(false);
    return (
        <>
        <Drawer.Screen name="Home" component={TabNavigator} />
          <Drawer.Navigator id={undefined}
            screenOptions={{ headerShown: true }}
            initialRouteName="Home"
            
          >
            <Drawer.Screen name="Home" component={TabNavigator} />
            <Drawer.Screen name="Recordings"
  component={EmptyScreen}
  listeners={({ navigation }) => ({
    focus: () => {
      navigation.navigate('Home', { screen: 'Recordings' });
    },
  })} />
            <Drawer.Screen name="Privacy Policy"
  component={EmptyScreen}
  listeners={({ navigation }) => ({
    focus: () => {
      navigation.navigate('Home', { screen: 'Privacy Policy' });
    },
  })} />
            <Drawer.Screen
              name="Sign In"
              component={EmptyScreen}
              listeners={{
                drawerItemPress: (e: any) => {
                  e.preventDefault(); // prevent navigation
                  setSignInVisible(true); // show modal
                },
              }}
            />
          </Drawer.Navigator>
      
          {/* ⬇️ Show modal over the navigator */}
          <SignInScreen
            visible={isSignInVisible}
            onClose={() => setSignInVisible(false)}
          />
        </>
      );
      
}