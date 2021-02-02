import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

class GradebookPage extends React.Component{
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <View style = {gradeStyles.container}>
                <ScrollView style = {gradeStyles.grade_container} contentContainerStyle = {{paddingBottom: 10, marginTop: -20}}>
                    {/*<Text style = {{fontSize: 35, fontFamily: "Raleway-Bold", height: 70}}>Grades:</Text>  <-- Optional since Stack.Screen will 
                    create name for the page automatically (name is required, not optional)*/}  
                    <View style = {{flexDirection: "column", justifyContent: "space-around", flex: 1}}>
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>A</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 1: Boness</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>B</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 2: Kim</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>C</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>eeeeee eeeeeee e e eeeeeee e eeeee eeeeeeee</Text>
                        </TouchableOpacity>                   
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>D</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 4: Mr. Benneteeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeet</Text>
                        </TouchableOpacity>    
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>F</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 5: AP US History</Text>
                        </TouchableOpacity>   
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>F</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 6: Gopal</Text>
                        </TouchableOpacity>   
                        <TouchableOpacity style = {gradeStyles.grade_display}>
                            <Text style = {gradeStyles.grade_letter}>F</Text>
                            <View style = {gradeStyles.vertical_line}></View>
                            <Text style = {gradeStyles.grade_info}>Period 7: Also Gopal</Text>
                        </TouchableOpacity>                  
                    </View>
                </ScrollView>
            </View>
        );
    } 
}

const StackNav = createStackNavigator();

function GradebookStack(){
    return (
        <StackNav.Navigator>
            <StackNav.Screen name = 'Grades' component = {GradebookPage} />
        </StackNav.Navigator>
    );
}

const gradeStyles = StyleSheet.create({
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
});

export default GradebookStack;