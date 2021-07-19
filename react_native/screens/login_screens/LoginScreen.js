import React from 'react';
import { NavigationContainer, NavigationHelpersContext, PrivateValueStore } from '@react-navigation/native';
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
  Touchable,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';

const LoginScreen = ({ navigation }) => {

    const [userName, setUserName] = React.useState("");
    const [password, setPassword] = React.useState("");

    return (
        <View style = {styles.container}>
            <Text>Login Screen</Text>
            <TextInput                
                placeholder = "Username"
                onChangeText={x => setUserName(x)}
            />
            <TextInput
                placeholder = "Password"
                onChangeText={x => setPassword(x)}
                secureTextEntry = {true}
            />
            <TouchableOpacity onPress = {navigation.navigate("GradebookScreen")}>Login</TouchableOpacity>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});