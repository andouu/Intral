import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import { LogoScreen } from "./login_screens/LogoScreen";
import { LoginScreen } from "./login_screens/LoginScreen";

const MainStack = createStackNavigator();

const MainStackScreen = ({ navigation }) => (
    <MainStack.Navigator>
        <RootStack.Screen name = "LogoScreen" component = {LogoScreen}/>
        <RootStack.Screen name = "LoginScreen" component = {LoginScreen}/>
    </MainStack.Navigator>
);

export default MainStackScreen;