import React from 'react';
import {
    StyleSheet,
    View,
    Text,
} from 'react-native';
import { swatch, swatchRGB } from '../components/theme';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons'

const CalendarScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.optionsBar}>
                <View style={styles.menu_button}>
                    <MaterialDesignIcons.Button 
                        underlayColor={`rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`}
                        activeOpacity={0.5}
                        right={2}
                        bottom={4}
                        hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                        borderRadius = {80}
                        name='menu' 
                        color={swatch['s4']} 
                        size={35}
                        backgroundColor='transparent'
                        onPress={() => navigation.openDrawer()} 
                        style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                    />
                </View>
            </View>
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: swatch['s6']}}>This is the calendar screen!</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: '100%',
        padding: 15,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: swatch['s1'],
    },
    planner_event_box: {
        minHeight: 80,
        width: '100%',
        backgroundColor: swatch['s2'],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        marginBottom: 15,
    },
    planner_add_button: {
        width: 60,
        height: 60,
        borderRadius: 50,
        justifyContent: 'center',
        backgroundColor: swatch['s5'],
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    planner_add_text: {
        marginTop: 0,
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        color: swatch['s6'],
        flexWrap: 'wrap'
    },
    planner_text_box: {
        backgroundColor: 'transparent',
        minHeight: 30,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
    },  
    planner_event_text: {
        fontSize: 15,
        fontFamily: 'ProximaNova-Regular',
        fontWeight: 'normal',
        color: swatch['s6'],
        padding: 6,
        marginLeft: 10,
    },
    planner_delete_button: {
        width: 18, 
        height: 18, 
        borderRadius: 9,
        justifyContent: 'center',
        backgroundColor: 'transparent',
        bottom: 5,
        right: -1,
    },
    planner_charCt: {
        position: 'absolute',
        color: swatch['s4'],
        bottom: -5, 
        right: 0,
    },
    helper_text: {
        fontFamily: 'ProximaNova-Regular',
        textAlign: 'center',
        color: swatch['s6'],
        opacity: 0.5,
    },  
    optionsBar: {
        height: 100,
        top: 0,
        width: '100%',
        flexDirection: 'row',
        alignSelf: 'flex-start',
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
        borderColor: `rgba(${swatchRGB.s4.r}, ${swatchRGB.s4.g}, ${swatchRGB.s4.b}, 0.5)`,
    },
});

export default CalendarScreen;