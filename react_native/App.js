import React, {
    useState
} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableHighlight,
    TouchableOpacity,
    Image
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const App = () => {
    return (
        <>
        <View style = {styles.container}>
            <ScrollView style = {styles.grade_container}>
                {/*change height to change distance between "grades" text and the grade*/}
                <Text style = {{fontSize: 35, fontFamily: "Raleway-Bold", height: 70}}>Grades:</Text>  
                <View style = {{flexDirection: "column", justifyContent: "space-around", flex: 1}}>
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>A</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 1: Boness</Text>
                    </TouchableOpacity>                   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>B</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 2: Kim</Text>
                    </TouchableOpacity>                   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>C</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>eeeeee eeeeeee e e eeeeeee e eeeee eeeeeeee</Text>
                    </TouchableOpacity>                   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>D</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 4: Mr. Benneteeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeet</Text>
                    </TouchableOpacity>    
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>F</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 5: AP US History</Text>
                    </TouchableOpacity>   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>F</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 6: Gopal</Text>
                    </TouchableOpacity>   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>F</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 7: Also Gopal</Text>
                    </TouchableOpacity>                  
                </View>
            </ScrollView>
            <View style = {styles.nav_bar}>
                <View style = {styles.horizontal_line}></View>
                <View style = {styles.nav_bar_button_space}>
                    <TouchableOpacity>
                        <Image style = {styles.nav_bar_buttons} source = {require('./assets/images/CAS_settings_icon.png')}/>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image style = {styles.nav_bar_buttons} source = {require('./assets/images/CAS_grade_book_icon.png')}/>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image style = {styles.nav_bar_buttons} source = {require('./assets/images/CAS_planner_icon.png')}/>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: "100%",
        flex: 1,
    },
    grade_container: {
        height: "100%",
        padding: 28,
        flex: 9,
    },
    grade_display: {
        margin: "5%",
        backgroundColor: "rgba(255,255,255,0)",
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    grade_letter: {
        marginRight: "15%",
        fontSize: 50,
        fontFamily: "Raleway-SemiBold",
    },
    vertical_line: {
        height: "100%",
        width: 1.5,
        backgroundColor: "rgba(0,0,0,1)",
        marginLeft: 80,
        position: "absolute"
    },
    grade_info: {
        marginLeft: "15%",
        fontFamily: 'Raleway-MediumItalic',
        fontSize: 15,
        flexWrap: "wrap",
        flexShrink: 1,
        alignItems: "flex-start",
        position: "absolute",
        marginLeft: 120
    },
    nav_bar: {
        flexDirection: "column",
        alignItems: "center",
        flex: 0.12,
    },
    horizontal_line: {
        height: 1.5,
        width: "90%",
        backgroundColor: "rgba(0,0,0,1)",
        marginLeft: 80,
        position: "absolute"
    },
    nav_bar_button_space: {
        flexDirection: "row"
    },
    nav_bar_buttons: {
        marginTop: 8,
        marginLeft: 30,
        marginRight: 30,
        width: 55,
        height: 55,
    }
});

export default App;