import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import LogoScreen from "./login_screens/LogoScreen";
import LoginScreen from "./login_screens/LoginScreen";

const MainStack = createStackNavigator();

const RootStackScreen = ({ navigation }) => (
    <MainStack.Navigator>
        <MainStack.Screen name = "Welcome" component = { LogoScreen }/>
        <MainStack.Screen name = "Login" component = { LoginScreen }/>
    </MainStack.Navigator>
);

export default RootStackScreen;