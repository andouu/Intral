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
    TouchableOpacity
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
            <ScrollView>
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
                        <Text style = {styles.grade_info}>Period 3: Daddy Desmond</Text>
                    </TouchableOpacity>                   
                    <TouchableOpacity style = {styles.grade_display}>
                        <Text style = {styles.grade_letter}>D</Text>
                        <View style = {styles.vertical_line}></View>
                        <Text style = {styles.grade_info}>Period 4: Mr. Bennett</Text>
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
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: "100%",
        padding: 28,
        flex: 1,
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
    vertical_line:{
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
        alignItems: "flex-start",
        position: "absolute",
        marginLeft: 120
    }
});

export default App;