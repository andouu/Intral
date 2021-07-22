import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import SplashScreen from "./login_screens/SplashScreen";
import LoginScreen from "./login_screens/LoginScreen";
import { colors } from "react-native-elements";

const MainStack = createStackNavigator();

const RootStackScreen = ({ navigation }) => (
    <MainStack.Navigator initialRouteName='Welcome' screenOptions={{detachPreviousScreen: false, headerHideShadow: true}}>
        <MainStack.Screen name = "Welcome" component = { SplashScreen } options={{ headerShown: false, animationEnabled: false }} />
        <MainStack.Screen name = "Login" component = { LoginScreen } 
        style={{backgroundColor: 'blue'}}
        options={{
            title: '',
            headerStyle: { backgroundColor: '#7FB685' },
            headerTintColor: 'white',
            animationEnabled: false,
        }} />
    </MainStack.Navigator>
);

export default RootStackScreen;