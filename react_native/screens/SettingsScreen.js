import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeContext } from '../components/themeContext';
import { AuthContext } from '../components/authContext';
import { toRGBA, widthPctToDP } from '../components/utils';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
//import DropDownPicker from 'react-native-dropdown-picker'; for picking themes
import {
    StyleSheet,
    View,
    Text,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const Card = ({ customStyle, outlined=false, children, animatedStyle, theme }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                height: 150,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 30,
                borderWidth: outlined ? 1.5 : 0,
                borderColor: outlined ? theme.s2 : 'transparent',
                padding: 15,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();
    const widthDP = widthPctToDP('100%', 0);

    return (
        <Animated.View style={[cardStyle.card, customStyle, animatedStyle]}>
            {children}
        </Animated.View>
    );
}

const PressableCard = ({ customStyle, outlined=false, children, onPress, animatedStyle, theme }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                height: 150,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: outlined ? 'transparent' : theme.s2,
                borderRadius: 30,
                borderWidth: outlined ? 1.5 : 0,
                borderColor: outlined ? theme.s2 : 'transparent',
                padding: 10,
                marginBottom: 20,
            },
        });
    }
    const cardStyle = getStyle();
    const widthDP = widthPctToDP('100%', 0);

    return (
        <Animated.View style={[cardStyle.card, customStyle, animatedStyle]}>
            <Pressable
                style={({pressed}) => [
                    styles.pressableCard_btn, {backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent'}
                ]}
                onPress={onPress}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

const Header = ({ navigation, theme, type }) => {

    return (
        <View style={styles.optionsBar}>
            <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                <MaterialDesignIcon.Button 
                    underlayColor={toRGBA(theme.s4, 0.5)}
                    activeOpacity={0.5}
                    right={type === 'menu' ? 2 : 4}
                    bottom={4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name={type === 'menu' ? 'menu' : 'arrow-left'}
                    color={toRGBA(theme.s4, 1)} 
                    size={35}
                    backgroundColor='transparent'
                    onPress={() => type === 'menu' ? navigation.openDrawer() : navigation.goBack()} 
                    style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                />
            </View>
        </View>
    );
}

const HomeScreen = ({ navigation }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const { signOut } = useContext(AuthContext); // TODO: move signout button to drawer
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;
    const toggleSwitch = () => setIsEnabled(!isEnabled);

    return (
        <View style = {[styles.container]}>
            <Header theme={theme} navigation={navigation} type='menu' />
            <View style={styles.main_container}>
                <Text style={[styles.header_text, {color: theme.s6}]}>Settings:</Text>
                <PressableCard 
                    theme={theme} 
                    customStyle={{
                        width: '100%', 
                        height: 50, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: 0,
                        marginBottom: 10
                    }} 
                    onPress={() => navigation.navigate('Functions')}
                    outlined
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Functions Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='radar' size={30} color={theme.s8} style={{right: -18}} />
                    </View>
                </PressableCard>
                <PressableCard 
                    theme={theme} 
                    customStyle={{
                        width: '100%', 
                        height: 50, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: 0,
                        marginBottom: 10
                    }} 
                    onPress={() => navigation.navigate('Cosmetics')}
                    outlined
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Cosmetic Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='palette' size={30} color={theme.s11} style={{right: -18}} />
                    </View>
                </PressableCard>
            </View>
        </View>
    )
}

const FunctionsScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: theme.s4, bottom: 70}}>This is the functions settings page!</Text>
            </View>
        </View>
    );
}

const CosmeticsScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={styles.main_container}>
                <Card theme={theme} customStyle={{height: 65, alignItems: 'flex-start', marginBottom: 10}} outlined>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Theme: </Text>
                    {/* TODO: dropdown for themes here */}
                </Card>
                <Card theme={theme} customStyle={{height: 65, alignItems: 'flex-start', marginBottom: 10}} outlined>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Outlined cards: </Text>
                    {/* TODO: incorporate this setting to themeContext so all components that use Card are synced */}
                </Card>
                <Card theme={theme} customStyle={{height: 65, alignItems: 'flex-start', marginBottom: 10}} outlined>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Transparent NavBar: </Text>
                </Card>
            </View>
        </View>
    );
}

const SettingsStack = createStackNavigator();

const SettingsScreen = ({ navigation }) => {
    return(
        <SettingsStack.Navigator> 
            <SettingsStack.Screen 
                name = 'Home' 
                component = { HomeScreen } 
                options = {{
                    title: 'Settings',
                    headerShown: false,
                }}
            />
            <SettingsStack.Screen 
                name = 'Functions' 
                component = { FunctionsScreen } 
                options = {{
                    title: 'Functions Settings',
                    headerShown: false,
                }}
            />
            <SettingsStack.Screen 
                name = 'Cosmetics' 
                component = { CosmeticsScreen } 
                options = {{
                    title: 'Cosmetic Settings',
                    headerShown: false,
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
    },
    main_container: {
        flex: 1, 
        width: '100%', 
        height: '100%', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start', 
        flexDirection: 'column',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 0,
    },
    setting_box: {
        width: "100%",
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
    optionsBar: {
        height: 100,
        top: 0,
        paddingLeft: 15,
        paddingRight: 15,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },  
    menu_button: {
        alignSelf: 'center',
        padding: 0,
        marginRight: 'auto',
        width: 45,
        maxHeight: 45,
        borderRadius: 40,
        borderWidth: 1,
    },
    settings_main_text: {
        fontSize: 20,
        fontFamily: 'ProximaNova-Regular',
    },
    settings_icon: {
        position: 'absolute',
        width: '100%',
        alignItems: 'flex-end',
    },
    pressableCard_btn: {
        width: '100%', 
        height: '100%', 
        borderRadius: 28,
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingLeft: 15,
        paddingRight: 15,
    },
    header_text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginBottom: 20,
    },
    cardHeader_text: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 20,
        marginBottom: 15,
        left: 2,
    },
});

export default SettingsScreen;