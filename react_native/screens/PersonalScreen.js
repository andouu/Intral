import React, { useEffect, useState, useContext } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getStudentInfo } from '../components/api.js';
import { AuthContext } from '../components/context';
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

const credentials = require('../credentials.json') // WARNING: temporary solution

const username = credentials.username // temporary for testing, authentication isn't up yet
const password = credentials.password

const SettingsScreen = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const { signOut } = useContext(AuthContext);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    
    return(
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
    );
}

const ProfileScreen = () => {
    const [studentInfo, setStudentInfo] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshInfo = async() => {
        try {
            let info = await getStudentInfo(username, password);
            setStudentInfo(info);
            setIsLoading(false);
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        refreshInfo();
    }, [])

    if(isLoading) {
        return (
            <View style = {styles.container}>
                <ActivityIndicator size = 'large' color = 'black' />
            </View> 
        );
    }

    return (
        <View style = {styles.container}>
            <View style = {[styles.container, {flexDirection: 'column'}]}>
                <View>
                    <Image source={{uri: `data:image/png;base64, ${studentInfo.StudentInfo.Photo}`}} style={styles.profilePic} />
                </View>
                <Text>This is your profile page</Text>
            </View>
        </View>
    )
}

const Drawer = createDrawerNavigator();

function PersonalScreen() {
    return (
        <Drawer.Navigator initialRouteName = 'Home'>
            <Drawer.Screen name = 'Home' component = {ProfileScreen} />
            <Drawer.Screen name = 'Settings' component = {SettingsScreen} />
        </Drawer.Navigator>
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

export default PersonalScreen;