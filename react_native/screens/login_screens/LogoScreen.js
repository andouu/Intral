import React from 'react';
import { useNavigation } from '@react-navigation/core';
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
import { TouchableOpacity } from 'react-native-gesture-handler';

const LogoScreen = () => {
    const navigation = useNavigation();

    return (
        <View style = {styles.container}>
            <Text>Intral!!!</Text>
            <View style = {{width: 200}}>
                <TouchableOpacity style = {styles.signIn_button} onPress = {() => navigation.navigate('Login')}><Text>Sign In</Text></TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        flexDirection: "column",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
    },
    signIn_button: {
        height: 60,
        marginTop: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: "100%",
        backgroundColor: "#EAEAEA",
        borderRadius: 5,
    }
});

export default LogoScreen;
