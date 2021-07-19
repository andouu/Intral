import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from "react-native-vector-icons";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';

const LogoScreen = () => {
    return (
        <View styles = {styles.container}>
            <View>
                <Card>
                    <Card.Title>Intral</Card.Title>
                    <Card.Divider/>
                    <Text>Your oppurtunity to get good fast!</Text>
                    <TouchableOpacity onPress = {() => navigation.navigate("LoginScreen")}><Text>Login</Text></TouchableOpacity>
                </Card>
            </View>
        </View>
    );
};

export default LogoScreen;

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});