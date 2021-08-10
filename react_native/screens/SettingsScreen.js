import React, { useEffect, useState, useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeContext } from '../components/themeContext';
import { AuthContext } from '../components/authContext';
import { toRGBA } from '../components/utils';
import { colorways } from '../components/themes';
import { Card, PressableCard } from '../components/card';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
//import DropDownPicker from 'react-native-dropdown-picker'; for picking themes
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Switch
} from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

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

const settingCardHeight = 50;

const HomeScreen = ({ navigation }) => {
    const { signOut } = useContext(AuthContext); // TODO: move signout button to drawer
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    
    const [boballs, setBoballs] = useState(1); /* !@#$% <<easter egg>> ^&*() */

    return (
        <View style = {styles.container}>
            <Header theme={theme} navigation={navigation} type='menu' />
            <View style={styles.main_container}>
                <Text
                    style={[styles.header_text, {color: theme.s6}]}
                    onPress={() => { /* !@#$% <<easter egg>> ^&*() */
                        if (boballs + 1 > 10) {
                            setBoballs(1);
                            console.log('Annihilation imminent.');
                        } else setBoballs(boballs + 1);
                    }}
                >
                    Settings:
                </Text>
                <PressableCard 
                    theme={theme} 
                    containerStyle={{
                        height: settingCardHeight
                    }}
                    pressableStyle={{
                        paddingLeft: 15,
                        paddingRight: 15
                    }}
                    onPress={() => navigation.navigate('Functions')}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Functions Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='radar' size={30} color={theme.s8} />
                    </View>
                </PressableCard>
                <PressableCard 
                    theme={theme} 
                    containerStyle={{
                        height: settingCardHeight
                    }}
                    pressableStyle={{
                        paddingLeft: 15
                    }}
                    onPress={() => navigation.navigate('Cosmetics')}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Cosmetic Settings</Text>
                    <View style={styles.settings_icon}>
                        <MaterialDesignIcon name='palette' size={30} color={theme.s11} />
                    </View>
                </PressableCard>
            </View>
        </View>
    )
}

const FunctionsScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;

    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={styles.main_container}>
                <Card
                    theme={theme}
                    customStyle={{
                        height: settingCardHeight,
                        alignItems: 'flex-start',
                        paddingLeft: 15,
                        paddingRight: 15
                    }}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Grade Refresh Rate:</Text>
                </Card>
            </View>
        </View>
    );
}

const ThemeBox = ({name}) => {
    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    const setTheme = themeContext.setTheme;

    return (
        <Pressable 
            style={({pressed}) => [{
                width: '100%', 
                height: settingCardHeight,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: theme.s4, 
                marginBottom: 0, 
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1
            }]}
            onPress={() => {
                if (name !== themeData.theme) {
                    setTheme({...themeData, theme: name, swatch: colorways[name]});
                }
            }}
        >
            <Text style={[styles.settings_main_text, {color: theme.s4, fontSize: 17, maxWidth: 250}]}>{name}</Text>
            <View style={{width: 20, height: 20, position: 'absolute', right: 0, borderRadius: 30, borderWidth: 1.5, borderColor: theme.s4, padding: 2}}>
                {name === themeData.theme
                    ? <View style={{flex: 1, borderRadius: 30, backgroundColor: theme.s3}} />
                    : null
                }
            </View>
        </Pressable>
    );
}

const CosmeticsScreen = ({ navigation }) => {
    const [openedCards, setOpenedCards] = useState({
        theme: false,
    })

    const themeContext = useContext(ThemeContext);
    const themeData = themeContext.themeData;
    const theme = themeData.swatch;
    const setTheme = themeContext.setTheme;

    const cardHeight = useSharedValue(settingCardHeight);
    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(cardHeight.value, {duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const themeDpdnOpacity = useSharedValue(0);
    const themeDpdnHeight = useSharedValue(0);
    const animatedDropdownContentStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(themeDpdnOpacity.value, {duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
            height: withTiming(themeDpdnHeight.value, {duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    useEffect(() => {
        if (openedCards.theme) {
            const headerHeight = settingCardHeight;
            const paddingBottom = 5;
            const totalHeight = Object.keys(colorways).length * settingCardHeight + headerHeight + paddingBottom;
            cardHeight.value = totalHeight;
            themeDpdnOpacity.value = 1;
            themeDpdnHeight.value = totalHeight - headerHeight;
        } else {
            cardHeight.value = settingCardHeight;
            themeDpdnOpacity.value = 0;
            themeDpdnHeight.value = 0;
        }
    }, [openedCards.theme]);

    let themeBoxes = [];
    let idx = 0;
    for(let swatch in colorways) {
        themeBoxes.push(
            <ThemeBox name={swatch} key={idx} />
        );
        idx ++;
    }

    return (
        <View style={styles.container}>
            <Header theme={theme} navigation={navigation} type='back' />
            <View style={styles.main_container}>
                <PressableCard 
                    theme={theme} 
                    containerStyle={{
                        marginBottom: 10
                    }}
                    pressableStyle={{
                        paddingLeft: 15,
                        paddingRight: 15
                    }}
                    onPress={() => {
                        setOpenedCards({
                            ...openedCards,
                            theme: !openedCards.theme
                        });
                    }}
                    animatedStyle={animatedCardStyle}
                    outlined={themeData.cardOutlined}
                >
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>
                        Theme: <Text style={{color: theme.s3}}>{themeContext.themeData.theme}</Text>
                    </Text>
                    <View style={[styles.settings_icon, {top: 15/2}]}>
                        <MaterialDesignIcon 
                            name={openedCards.theme ? 'chevron-up' : 'chevron-down'} 
                            size={30} 
                            color={theme.s4}
                        />
                    </View>
                    <Animated.View
                        style={[
                            {
                                width: '100%', 
                                top: 15,
                                overflow: 'hidden'
                            },
                            animatedDropdownContentStyle
                        ]}
                    >
                        {themeBoxes.map(box => box)}
                    </Animated.View>
                </PressableCard>
                <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Outlined cards: </Text>
                    <View style={[styles.settings_icon, {width: 50, top: themeData.cardOutlined ? 10 : 11.5, right: 12}]}>
                        <Switch 
                            trackColor={{false: theme.s11, true: theme.s10}}
                            thumbColor={theme.s6}
                            onValueChange={() => setTheme({...themeData, cardOutlined: !themeData.cardOutlined})}
                            value={themeData.cardOutlined}
                        />
                    </View>
                </Card>
                <Card theme={theme} customStyle={styles.settings_card_switch} outlined={themeData.cardOutlined}>
                    <Text style={[styles.settings_main_text, {color: theme.s4}]}>Transparent NavBar: </Text>
                    <View style={[styles.settings_icon, {width: 50, top: themeData.cardOutlined ? 10 : 11.5, right: 12}]}>
                        <Switch 
                            trackColor={{false: theme.s11, true: theme.s10}}
                            thumbColor={theme.s6}
                            onValueChange={() => setTheme({...themeData, navBarTransparent: !themeData.navBarTransparent})}
                            value={!themeData.navBarTransparent}
                        />
                    </View>
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
        fontFamily: 'Proxima Nova Bold',
    },
    settings_icon: {
        position: 'absolute',
        right: 15,
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
    settings_card_switch: {
        height: settingCardHeight, 
        alignItems: 'flex-start',
        paddingLeft: 15,
        marginBottom: 10,
    },
});

export default SettingsScreen;