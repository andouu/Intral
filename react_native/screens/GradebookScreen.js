import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { getGrades } from '../components/api.js';
import { ThemeContext } from '../components/themeContext';
import { toRGBA, widthPctToDP } from '../components/utils';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { findDifference } from '../components/api';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    FlatList,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Rect, Text as TextSVG, Svg } from "react-native-svg";
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';

const dummyGradeChanges  = require('../dummy data/gradeData') // dummy data for grade changes (class analysis)

const credentials = require('../credentials.json'); // WARNING: temporary solution
const username = credentials.username // should import username and password from a central location after authentication
const password = credentials.password
let quarter = 1;
const screenWidth = Dimensions.get('window').width;

function* percentageLabel() {
    yield* ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
}

const Header = ({ theme, type, data=null }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.optionsBar}>
            <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                <MaterialDesignIcon.Button 
                    underlayColor={toRGBA(theme.s4, 0.5)}
                    activeOpacity={0.5}
                    right={type === 'graph' ? 0 : 4}
                    bottom={type === 'graph' ? 0 : 4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius={80}
                    name={type === 'graph' ? 'chart-line' : 'arrow-left'} // only takes two types for now, 'menu' and 'back' 
                    color={theme.s4} 
                    size={type === 'graph' ? 26 : 35}
                    backgroundColor='transparent'
                    onPress={() => type === 'graph' ? navigation.navigate('Class Analyses', {data: data}) : navigation.goBack()} 
                    style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                />
            </View>
        </View>
    );
}

const GradebookHomeScreen = () => {
    const [isLoading, setIsLoading] = useState(true);  
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState([]);

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const refreshClasses = async() => {  // async function to provide scope for await keyword
        try {
            let pull = await getGrades(username, password, quarter);  // pulls data from api asyncronously from api.js
            let difference = [];
            if (classes !== []) {
                let storedClasses = await AsyncStorage.getItem('classes');
                let prev = JSON.parse(storedClasses); // parse storage pull
                if (Array.isArray(prev)) {
                    difference = findDifference(prev, pull);  // compare to simulated data for added, removed, and modified (ie. pts. changed) assignments

                    if (Object.keys(difference).length !== 0 && difference.constructor === Object) {  // check if there are any differences
                        await AsyncStorage.setItem('gradebookChanges', JSON.stringify(difference));  // save the difference to storage
                        await AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: false }));   // set the notifs warning to show in profile page everytime there are new changes
                    } else {
                        console.log('no changes');
                    }
                }
            }
            if (difference !== [])
                await AsyncStorage.setItem('classes', JSON.stringify(pull)); // temporary
            setClasses(pull);
            setIsLoading(false);
        } catch(err) {
            console.error(err);
        }
    }

    useEffect(async () => {                 
        await refreshClasses();
    }, []); // runs once (and saves to local async storage), user can manually refresh

    const onRefresh = useCallback(async() => { // refreshes class data when the user refreshes the screen
        setRefreshing(true);
        await refreshClasses();                // wait for the data to load before setting the refreshing state to false
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView style = {[styles.container, {backgroundColor: theme.s1}]}>
            {isLoading ? (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}}>
                    <ActivityIndicator size = 'large' color = {theme.s4} />
                </View>
            ) : (
                <ScrollView 
                    style={styles.grade_container} 
                    contentContainerStyle = {{}}
                    refreshControl = {
                        <RefreshControl
                            refreshing = {refreshing}
                            onRefresh = {onRefresh}
                        />
                    }
                >
                    <Header theme={theme} type='graph' data={{classInfo: classes}} />
                    <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: 10, paddingLeft: 15, paddingRight: 15}}>
                        <Text style={[styles.header_text, {color: theme.s6}]}>Your Gradebook:</Text>
                        <GradeBoxes classes={classes} theme={theme} />     
                    </View>
                </ScrollView>
            )}   
        </SafeAreaView>
    );
}

const GradeBoxes = ({ classes, theme }) => { 
    const navigation = useNavigation();
    
    let gradeObjects = classes.map((period, i) => {
        let classSummary = {                                     // creates object to be used in the array of school classes (state)
            gradeLtr: period.Marks.Mark.CalculatedScoreString, 
            gradePct: period.Marks.Mark.CalculatedScoreRaw, 
            period: period.Period, 
            teacher: period.Staff
        };
        return (
            <PressableCard 
                theme={theme} 
                customStyle={{ height: 100, padding: 0}} 
                onPress={() => {
                    navigation.navigate('Class Details', {
                        periodNumber: i,
                        classInfo: classes[i],
                    });
                }} 
                outlined
            >
                <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'center', paddingLeft: 15, paddingRight: 15}}>
                    <Text style = {[styles.grade_letter, {color: theme.s6}]}>{classSummary.gradeLtr}</Text> 
                    <View style = {[styles.vertical_line, {backgroundColor: toRGBA(theme.s6, 0.5)}]}></View>
                    <Text style = {[styles.grade_info, {color: theme.s6}]}>{`Period ${classSummary.period}: ${classSummary.teacher}`}</Text>
                </View>
            </PressableCard>
        );
    });

    return (          
        gradeObjects.map(obj => {
            return (obj);
        })
    );
}

const Assignment = ({ index, name, data, navigation, theme }) => ( 
    <PressableCard
        theme={theme} 
        customStyle={{ height: 85, padding: 0}} 
        onPress={() => {
            navigation.navigate('Assignment Details', {
                index: index,
                details: data,
                name: name
            });
        }} 
        outlined
    >
        <View style = {styles.assignmentDescriptionWrapper}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 20, color: toRGBA(theme.s6, 0.75), marginLeft: 5}}>{name}</Text>
            <Text style = {{fontFamily: 'ProximaNova-Regular', fontSize: 10, color: theme.s4, alignSelf: 'flex-end', position: 'absolute', right: 15, bottom: 10}}>{data.Points}</Text>
        </View>
    </PressableCard>
);

const ClassDetailsScreen = ({ route, navigation }) => {
    const { periodNumber, classInfo } = route.params;
    const [isDropped, setIsDropped] = useState(false);
    
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    let gradeSummary = classInfo.Marks.Mark.GradeCalculationSummary.AssignmentGradeCalc;
    let isOneWeight = !Array.isArray(gradeSummary);                                      // if there is only one weight, then the array is undefined, so we need to check for that
    let tmpTotalPct = parseFloat(classInfo.Marks.Mark.CalculatedScoreRaw).toFixed(2);    // rounds total percent to 2 decimal places

    const [categoryData, setCategoryData] = useState(isOneWeight ? tmpTotalPct : gradeSummary);
    const [totalPct, setPct] = useState(tmpTotalPct);
    
    let labels, classValues; // for the bar chart
    if(!isOneWeight) {
        labels = categoryData.map(data => {
            let words = data.Type.split(' ');
            let capitalized = '';

            // results in x axis labels that are too long
            
            // if(words.length > 1) { 
            //     for(let i=0; i<words.length-1; i++) {
            //         //capitalized += words[i][0].toUpperCase() + words[i].substring(1).toLowerCase() + ' ';   
            //     }
            // }
            // let lastWord = words[words.length - 1];
            // capitalized += lastWord[0].toUpperCase() + lastWord.substring(1).toLowerCase();
            if(words.length > 1) {
                let trim = words[0][0].toUpperCase() + words[0].substr(1) + ' ' + words[1][0].toUpperCase() + words[1].substr(1).trim() + '...';
                if(trim.length - 4 > 10)
                {
                    trim = trim.substr(0, 10).trim() + "...";
                }     
                return trim;
            } else if(words[0].length > 10) {
                return words[0].substr(0, 10).trim() + '...';
            }
            capitalized = words[0][0].toUpperCase() + words[0].substr(1);
            return capitalized;
        });

        classValues = categoryData.map(data => {
            return parseFloat(data.WeightedPct.substring(0, data.WeightedPct.length - 1)).toFixed(2);
        });
    } else {
        labels = ['Total'];
        classValues = [totalPct];
    } 

    const [graphData, setGraphData] = useState({ 
        labels: labels, 
        datasets: [{ 
            data: classValues, 
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            colors: [
                () => toRGBA(theme.s4, 0.5),
                () => toRGBA(theme.s3, 0.5),
                () => toRGBA(theme.s3, 0.5),
                () => toRGBA(theme.s3, 0.5),
            ]
            }, 
        ]
    });
    
    const assignments = classInfo.Marks.Mark.Assignments.Assignment;

    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0,
        color: (/* opacity = 1 */) => toRGBA(theme.s4, 1),
        fillShadowGradient: theme.s3,
        fillShadowGradientOpacity: 0.75,
        strokeWidth: 2, 
        barPercentage: 0.75,
        decimalPlaces: 2,
        propsForBackgroundLines: {
            stroke: toRGBA(theme.s6, 0.25),
            strokeWidth: 1,
            strokeDasharray: '0',
            strokeDashoffset: null,
        },
        propsForLabels: {
            fontFamily: 'Proxima Nova Bold',
            fill: 'none',
            //stroke: theme.s4,
            fontSize: '10',
        },
        useShadowColorFromDataset: false, // optional
    };

    const renderItem = ({ item, index }) => {
        let name = item.Measure;
        return (
            <Assignment 
                index = {index}
                name = {name}
                data = {item}
                navigation = {navigation}
                theme={theme}
            />
        );
    }

    const percentageLabelIterator = percentageLabel();

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: theme.s1}]}>
            <Header theme={theme} type='back' />
            <View style={{flex: 1, flexDirection: "column", alignItems: "flex-start", marginTop: -10, paddingLeft: 15, paddingRight: 15}}>
                <Text style={[{marginBottom: 10, color: theme.s6}, styles.info_header]}>
                    Period {parseInt(periodNumber)+1}: {classInfo.Title}
                </Text>
                <Text style={[styles.info_subheader, {marginBottom: 5, color: theme.s4}]}>
                    {totalPct}% {isDropped ? '\n' : null}
                </Text>
                <View style = {{width: '100%', minHeight: isDropped ? 220 : 20, padding: 0}}>
                    <View style = {{flex: isDropped ? 1 : 0, alignItems: 'center'}}>
                        {/*bar graphs for weights in here*/}
                        {isDropped  
                            ? ( // TODO: change to stacked bar chart in order to show differences between student weights and totals
                                <BarChart
                                    data={graphData}
                                    width={screenWidth+10}
                                    height={220}
                                    fromZero={true}
                                    yAxisSuffix=''
                                    chartConfig={chartConfig}
                                    // withCustomBarColorFromData={true}
                                    showValuesOnTopOfBars={true}
                                    //segments={10}
                                    withInnerLines={false}
                                    flatColor={false}
                                    verticalLabelRotation={0}
                                />
                            ) 
                            : null
                        }
                    </View>
                    <Pressable 
                        style = {({pressed}) => [{opacity: pressed ? 0.5 : 1}, styles.dropdown_button]}
                        onPress = {() => {
                            setIsDropped(!isDropped); 
                        }}
                    >
                        {/* <Image style = {[styles.image, {transform: [{rotate: isDropped ? '180deg' : '0deg'}]}]} source = {dropDownImg} /> */}
                        <MaterialDesignIcon name={isDropped ? 'menu-up' : 'menu-down'} size={40} style={{bottom: isDropped ? -10 : 5}} color={theme.s4} />
                    </Pressable>
                </View>
                <View style={[styles.horizontalDivider, {borderBottomColor: theme.s4}]} />
                <View style = {{flex: 1, justifyContent: "center", width: "100%"}}>
                    <FlatList
                        data = {assignments}
                        renderItem = {(item, index) => renderItem(item, index)}
                        keyExtractor = {(item) => item.GradebookID}
                        style = {{ flex: 1, width: "100%" }}
                        extraData = {assignments}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const AssignmentDetailsScreen = ({ route, navigation }) => {
    const { details, name } = route.params;

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style={styles.container}>
            <Header theme={theme} type='back' />
            <View style={{paddingLeft: 15, paddingRight: 15, marginTop: -10, height: '100%'}}>
                <Text style = {[{marginBottom: 0, color: theme.s6}, styles.info_header]}>{name}:</Text>
                <Text style = {[styles.info_subheader, {fontSize: 15, marginTop: -2, marginBottom: 10, color: theme.s8}]}>{details.Type}</Text>
                <Text style = {[styles.info_subheader, {color: theme.s4}]}>Score: {details.Points}</Text>
                <View style = {[styles.horizontalDivider, {borderBottomColor: theme.s4}]} />
                <AssignmentDetail 
                    detail='Description' 
                    data={
                        details.MeasureDescription === '' 
                            ? 'N/A' 
                            : details.MeasureDescription
                    }
                />
                <AssignmentDetail 
                    detail='Assign Date' 
                    data={details.Date} 
                />
                <AssignmentDetail 
                    detail='Due Date' 
                    data={details.DueDate} 
                />
                <AssignmentDetail 
                    detail='Notes' 
                    data={
                        details.Notes === '' 
                        ? 'N/A' 
                        : details.Notes
                    }
                />
            </View>
        </View>
    )
}

const AssignmentDetail = ({detail, data}) => {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    return (
        <View style = {{width: '100%', minHeight: 30, marginBottom: 25}}>
            <Text style = {{fontFamily: 'Proxima Nova Bold', fontSize: 25, color: theme.s6}}>{detail}: </Text>
            <Text style = {{fontSize: 20, fontFamily: 'ProximaNova-Regular', color: theme.s4}}>{data}</Text>
        </View>
    ); 
}

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
                padding: 10,
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

const CustomLineChart = ({ width, height, theme, data, yLabelIterator, isHidden }) => {
    useEffect(() => {
        chartOpacity.value = isHidden ? 0 : 1;
    }, [isHidden]);

    const chartOpacity = useSharedValue(0);

    const animatedChartStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(chartOpacity.value, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const chartConfig = {
        backgroundGradientFrom: theme.s1,
        backgroundGradientTo: theme.s1,
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        fillShadowGradient: theme.s3,
        fillShadowGradientOpacity: 0.5,
        color: () => theme.s4,
        propsForBackgroundLines: {
            stroke: toRGBA(theme.s6, 0.25),
            strokeWidth: 1.5,
            strokeDasharray: '0',
            strokeDashoffset: null,
        },
        propsForLabels: {
            fontFamily: 'ProximaNova-Regular',
            fill: theme.s5,
            fontSize: '10',
        },
        useShadowColorFromDataset: false // optional
    };

    let hiddenPoints = [];
    for(let i=0; i<data.datasets[0].data.length-1; i++) {
        hiddenPoints.push(i);
    }

    return (
        <Animated.View style={[{left: -20, width: '100%', alignItems: 'center', justifyContent: 'center'}, animatedChartStyle]}>
            <LineChart
                data={data}
                fromZero={true}
                formatXLabel={(month) => month.substr(0, 3)}
                formatYLabel={() => yLabelIterator.next().value}
                withDots={true}
                getDotColor={(dataPoint, dataPointIndex) => dataPointIndex === data.datasets[0].data.length-1 ? theme.s3 : 'transparent'}
                onDataPointClick={(value) => console.log(value.x)}
                width={width}
                height={height}
                renderDotContent={({x, y, index}) => {
                    const tmpData = data.datasets[0].data;
                    if(index !== tmpData.length - 1) 
                        return null;
                    
                    let difference = tmpData[tmpData.length-1] / tmpData[tmpData.length-2];
                    let sign = difference > 1 ? 1 : difference == 1 ? 0 : -1;
                    difference = (Math.abs(difference - 1) * 100).toFixed(2);
                    
                    return (
                        <View>
                            <Svg>
                                <TextSVG
                                    x={x}
                                    y={y+16}
                                    fill={sign === 1 ? theme.s10 : sign === 0 ? theme.s5 : theme.s11}
                                    fontSize='10'
                                    fontFamily='Proxima Nova Bold'
                                    textAnchor="middle"
                                >
                                    {sign >= 0 ? '+' + difference + '%': '-' + difference + '%'}
                                </TextSVG>
                                </Svg>
                        </View>
                    );
                }}
                chartConfig={chartConfig}
                withInnerLines={false}
                withOuterLines={true}
                yAxisInterval={1.0}
                segments={10}
                style={{borderRadius: 40}}
                decorator={() => {
                    
                    
                }}
                bezier // optional, but sexy 😎
            />
        </Animated.View>
    )
}

const DropdownCard = ({theme, outlined, header='', periodNum=null}) => {
    const [isHidden, setIsHidden] = useState(true);
    const cardHeight = useSharedValue(55);
    const headerTopMargin = useSharedValue(0);

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(cardHeight.value, {duration: 350, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    const animatedHeaderStyle = useAnimatedStyle(() => {
        return {
            marginTop: withTiming(headerTopMargin.value, {duration: 400, easing: Easing.bezier(0.5, 0.01, 0, 1)}),
        }
    });

    function randomFloat(min, max) { // https://stackoverflow.com/questions/17726753/get-a-random-number-between-0-0200-and-0-120-float-numbers
        return Math.random() * (max - min) + min;
    }

    let periodData = dummyGradeChanges[periodNum].gradeChanges;

    const data = { // TODO: get actual GPAs per month/day
        labels: ['', '', '', '', '', '', '', ''],
        datasets: [{
            data: periodData, 
            color: (/* opacity = 1 */) => toRGBA(theme.s3, 1),
            strokeWidth: 3 // optional
        }],
    };

    function* pcts() {
        yield* [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    }

    const yIt = pcts();

    useEffect(() => { // TODO: get and store grade data from storage for charts (in parent)
        cardHeight.value = isHidden ? 55 : 250;
        headerTopMargin.value = isHidden ? 0 : 10;
    }, [isHidden])

    return (
        <Card theme={theme} outlined={outlined} customStyle={{borderColor: theme.s2, justifyContent: 'flex-start'}} animatedStyle={animatedCardStyle}>
            {/* <Text style={{fontFamily: 'Proxima Nova Bold', fontSize: 20, textAlign: 'center', textAlignVertical: 'center', color: theme.s4}}>
                Period {index+1}: {shortenedName}
            </Text> */}
            <Animated.View style={[{width: '95%', height: 30, marginBottom: 10, justifyContent: 'center', backgroundColor: 'transparent'}, animatedHeaderStyle]}>
                <Text style={[styles.info_subheader, {color: theme.s4, width: '87%', backgroundColor: 'transparent'}]}>{header}:</Text>
                <Pressable 
                    style={({pressed}) => [{
                        backgroundColor: pressed ? toRGBA(theme.s4, 0.5) : 'transparent',
                        alignSelf: 'flex-end', 
                        position: 'absolute', 
                        height: 40, 
                        width: 40,
                        top: -3,
                        borderRadius: 30,
                    }]}
                    onPress={() => {
                        setIsHidden(!isHidden);
                    }}
                >
                    <MaterialDesignIcon name={isHidden ? 'menu-down' : 'menu-up'} size={43} color={theme.s4} style={{right: 2, bottom: isHidden ? 2 : 5}} />
                </Pressable>
            </Animated.View>
            <View style={{width: '100%', height: 195, padding: 15, alignItems: 'center', justifyContent: 'center'}}>
                {/* Add charts here */}
                <CustomLineChart width={310} height={180} theme={theme} data={data} yLabelIterator={yIt} isHidden={isHidden} />
            </View>
        </Card>
    );
}

const ClassAnalysesScreen = ({ route, navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const classInfo = route.params.data.classInfo;
    //console.log(classInfo);

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const onRefresh = () => {
        console.log('refreshing'); // TODO: get class data locally or from server
    }

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 100);
    }, [isLoading])


    let classCards = classInfo.map((period, index) => {
        let shortenedName = period.Title.substr(0, period.Title.indexOf('(')).trim();
        if(shortenedName.length >= 19) {
            shortenedName = shortenedName.substring(0, 19).trim() + '...';
        }
        return(
            <DropdownCard theme={theme} header={shortenedName} periodNum={index} outlined />
        );
    });

    return (
        <SafeAreaView style = {[styles.container, {backgroundColor: theme.s1}]}>
            {isLoading ? (
                <View style = {{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}}>
                    <ActivityIndicator size = 'large' color = {theme.s4} />
                </View>
            ) : (
                <ScrollView 
                    style={styles.grade_container} 
                    contentContainerStyle = {{}}
                    refreshControl = {
                        <RefreshControl
                            refreshing = {isRefreshing}
                            onRefresh = {onRefresh}
                        />
                    }
                >
                    <Header theme={theme} type='back' />
                    <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', paddingTop: 10, paddingLeft: 15, paddingRight: 15}}>
                        <Text style={[styles.header_text, {color: theme.s6}]}>Your Class Analyses:</Text>
                        {classCards.map(card => {
                            return card;
                        })}
                    </View>
                </ScrollView>
            )}   
        </SafeAreaView>
    )
}

const Stack = createStackNavigator();

const GradebookScreen = () => {
    return (
        <Stack.Navigator initialRouteName='GradeBook'>
            <Stack.Screen 
                name='Gradebook' 
                component={GradebookHomeScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name='Class Details' 
                component={ClassDetailsScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen 
                name='Assignment Details' 
                component={AssignmentDetailsScreen} 
                options={{headerShown: false}}
            />
            <Stack.Screen
                name='Class Analyses'
                component={ClassAnalysesScreen}
                options={{headerShown: false}}
            />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
    },
    image: {
        flex: 1,
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    horizontalDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        width: "100%",
        marginTop: 15,
        marginBottom: 15,
    },
    vertical_line: {
        height: "70%",
        left: 100,
        alignSelf: "center",
        width: StyleSheet.hairlineWidth,
        position: "absolute"
    },
    button_wrapper: {
        minHeight: 75,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        flexDirection: "column",
        justifyContent: "center",
        borderRadius: 15,
    },
    grade_container: {
        height: "100%",
    },
    grade_display: {
        width: "100%",
        minHeight: 80,
        padding: 5,
        marginBottom: 15,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    header_text: {
        fontSize: 40,
        fontFamily: 'Proxima Nova Bold',
        opacity: 1,
        left: 2,
        marginTop: -10,
        marginBottom: 20,
    },
    grade_letter: {
        flex: 1,
        fontSize: 45,
        paddingBottom: 0,
        left: 18,
        fontFamily: "Proxima Nova Bold",
        textAlign: "left",
        textAlignVertical: "center",
    },
    grade_info: {
        flex: 4,
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
        left: 50,
        flexWrap: "wrap",
        justifyContent: "center",
        textAlign: "left",
        textAlignVertical: "center",
    },
    info_header: {
        fontFamily: "Proxima Nova Extrabold",
        fontSize: 40,
    },
    info_subheader: {
        fontFamily: "Proxima Nova Bold",
        fontSize: 30,
        fontWeight: "300",
    },
    assignmentDescriptionWrapper: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    dropdown_button: {
        flex: 1,
        width: "100%",
        maxHeight: 40,
        marginBottom: -5,
        alignItems: "center",
        justifyContent: "center",
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
    pressableCard_btn: {
        width: '100%', 
        height: '100%', 
        borderRadius: 28,
    },
});

export default GradebookScreen;