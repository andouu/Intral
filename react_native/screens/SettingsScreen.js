import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../components/authContext';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    StyleSheet,
    Switch,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
    Pressable,
} from 'react-native';

const HomePage = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const { signOut } = useContext(AuthContext);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
        <View style = {{flex:1, flexDirection: 'column', justifyContent: 'center', padding: 15}}>
            <View style = {styles.setting_box}>
                <Text style = {{flex: 2, marginLeft: 20, fontSize: 20, fontFamily: 'Raleway-Medium', color: '#373737', height: 32}}>Darkmode:</Text>
                    <Switch 
                        trackColor = {{false: '#373737', true: '#53C446'}}
                        thumbColor = {'#f4f3f4'}
                        onValueChange = {toggleSwitch}
                        value = {isEnabled}
                        style = {{
                            marginRight: 10,
                        }}
                    />
            </View>
            <View style = {[styles.setting_box, {backgroundColor: null}]}>
                <Pressable 
                    style = {({pressed}) => [{opacity: pressed ? 0.5 : 1}, styles.logout_button]}
                    onPress = {() => signOut()}
                >
                    <Text>Sign Out</Text>
                </Pressable>
            </View>
        </View>
    )
}

const SettingsStack = createStackNavigator();

const SettingsScreen = ({ navigation }) => {
    return(
        <SettingsStack.Navigator> 
            <SettingsStack.Screen 
                name = 'Home' 
                component = { HomePage } 
                options = {{
                    title: 'Settings',
                    headerLeft: () => (
                        <Icon.Button name = 'ios-menu' size = {25} backgroundColor = 'white' color = 'black' onPress = {() => navigation.openDrawer()} />
                    )
                }}
            />
        </SettingsStack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    setting_box: {
        width: Dimensions.get('window').width - 40,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        margin: 15,
        borderRadius: 5,
        backgroundColor: '#EAEAEA',
    },
    profilePic: {
        width: 150,
        height: 150,
        borderRadius: 90,
        overflow: 'hidden',
    },
    logout_button: {
        minHeight: 75,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 5,
        backgroundColor: "#EAEAEA",
    },
});

export default SettingsScreen;