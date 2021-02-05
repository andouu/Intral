import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

class GradeBoxes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            gradeData: [ /* Will load data from api to here for grades */
                {grade: 'A', period: 1, teacher: 'Ms. Boness'},
                {grade: 'B', period: 2, teacher: 'Mr. Kimmm'},
                {grade: 'C', period: 3, teacher: 'eeeeee eeeeeee e e eeeeeee e eeeee eeeeeeee'},
                {grade: 'D', period: 4, teacher: 'Mr. Benneteeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeet'},
                {grade: 'F', period: 5, teacher: 'AP US History'},
                {grade: 'A', period: 6, teacher: 'Gopal'},
                {grade: 'B', period: 7, teacher: 'Also Gopal'},
            ]
        }
    }

    render() { 
        let grades = this.state.gradeData.map((gradeData, i) => {
            //console.log(gradeData);
            return(
                <TouchableOpacity key = {i} style = {gradeStyles.grade_display} passed_data = {gradeData}>
                    <Text style = {gradeStyles.grade_letter}>{this.props.passed_data.grade}</Text>
                    <View style = {gradeStyles.vertical_line}></View>
                    <Text style = {gradeStyles.grade_info}>Period {this.props.passed_data.period}: {this.props.passed_data.teacher}</Text>
                </TouchableOpacity> 
            );
        });
        
        return(
            {grades}
        );
    }
}

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
                        <GradeBoxes />     
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