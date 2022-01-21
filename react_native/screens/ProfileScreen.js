import React, { useEffect, useState, useRef, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getStudentInfo } from '../components/api.js';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import GoogleIcon from 'react-native-vector-icons/MaterialIcons'
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as Keychain from 'react-native-keychain';
import {
    StyleSheet,
    Dimensions,
    View,
    Text,
    Image,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    PixelRatio,
    Pressable,
} from 'react-native';
import {
    LineChart,
} from 'react-native-chart-kit';
import { toRGBA } from '../components/utils'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../components/themeContext';

const profPicSize = 50;

function* yLabel() {                                 // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
    yield* ['0.00', '1.00', '2.00', '3.00', '4.00']; // https://stackoverflow.com/questions/63905403/how-to-change-the-y-axis-values-from-numbers-to-strings-in-react-native-chart-ki
}

const widthPctToDP = (widthPct, padding=0) => { // https://gist.github.com/gleydson/0e778e834655d1ee177725d8b4b345d7
    const screenWidth = Dimensions.get('window').width - 2 * padding;
    const elemWidth = parseFloat(widthPct);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
}

const NotificationBell = ({ changes, notifsSeen, handleNotifsSeen, handleScroll, theme }) => {
    const getNumNotifs = (obj) => {
        let total = 0;
        for(let key in obj) {
            obj[key].forEach(period => {
                total += period.assignments.length;
            })
        }
        return total;
    }
    
    const calcOffset = (width) => {
        return -9.377 * Math.log(0.025 * width);
    }

    const numNotifs = getNumNotifs(changes);
    
    const [notifWidth, setNotifWidth] = useState(15);

    const handlePress = async() => {
        try {
            handleScroll(390);
            if(notifsSeen === false) {
                setTimeout(() => {
                    handleNotifsSeen(true);
                }, 600);
            }
        } catch(err){
            console.log(err);
        }
    }
    
    return (
        <Pressable 
            style={({pressed}) => [
                styles.notifBellContainer,
                {
                    opacity: pressed ? 0.5 : 1, 
                    backgroundColor: pressed ? theme.s4 : 'transparent',
                    borderColor: pressed ? theme.s4 : toRGBA(theme.s4, 0.5),
                },  
            ]}
            onPress={() => handlePress()}
        >
            <GoogleIcon name='notifications' style={styles.notifBell} color={theme.s7} size={35} />
            {numNotifs > 0 && !notifsSeen ? (
                <View 
                    style={[styles.notifBellWarn, {right: calcOffset(notifWidth), backgroundColor: theme.s11}]}
                    onLayout={(event) => {
                        setNotifWidth(event.nativeEvent.layout.width);
                    }}
                >
                    <Text style={[styles.notifBellWarnText, {color: theme.s6}]}>{ numNotifs }</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

const Header = ({ studentInfo, changes, notifsSeen, handleScroll, handleNotifsSeen, theme }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.optionsBar}>
            <View style={[styles.menu_button, {borderColor: toRGBA(theme.s4, 0.5)}]}>
                <MaterialDesignIcon.Button 
                    underlayColor={toRGBA(theme.s4, 0.5)}
                    activeOpacity={0.5}
                    right={2}
                    bottom={4}
                    hitSlop={{top: 0, left: 0, bottom: 0, right: 0}}
                    borderRadius = {80}
                    name='menu' 
                    color={toRGBA(theme.s4, 1)} 
                    size={35}
                    backgroundColor='transparent'
                    onPress={() => navigation.openDrawer()} 
                    style={{padding: 8, paddingRight: 0, width: 45, opacity: 0.5}}
                />
            </View>
            <NotificationBell changes={changes} notifsSeen={notifsSeen} handleNotifsSeen={handleNotifsSeen} handleScroll={handleScroll} theme={theme} />
            <View style={styles.profilePic_container}>
                <Image source={{uri: `data:image/png;base64, ${studentInfo.StudentInfo.Photo}`}} style={styles.profilePic} />
            </View>
        </View>
    );
}

const Card = ({ customStyle, outlined=false, children, theme, data=null }) => {
    const getStyle = () => {
        return StyleSheet.create({
            card: {
                width: '100%',
                minHeight: 150,
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
        <View style={[cardStyle.card, customStyle]}>
            {children ? React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return (
                        React.cloneElement(child, { key: uuidv4(), width: widthDP, height: customStyle.height, theme: theme, data: data })
                    );
                }
            }) : null}
        </View>
    );
}

const CustomLineChart = ({ width, height, theme, data }) => {
    const chartConfig = {
        backgroundGradientFrom: theme.s1,
        backgroundGradientTo: theme.s1,
        backgroundGradientFromOpacity: 1,
        backgroundGradientToOpacity: 1,
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
    
    const yLabelIterator = yLabel();

    let hiddenPoints = [];
    for(let i=0; i<data.datasets[0].data.length-1; i++) {
        hiddenPoints.push(i);
    }

    return (
        <View style={{left: -15, width: '100%', alignItems: 'center', justifyContent: 'center'}}>
            <LineChart
                data={data}
                fromZero={true}
                formatXLabel={(month) => month.substr(0, 3)}
                formatYLabel={() => yLabelIterator.next().value}
                withDots={true}
                getDotColor={(dataPoint, dataPointIndex) => dataPointIndex === data.datasets[0].data.length-1 ? theme.s3 : 'transparent'}
                width={width}
                height={height}
                chartConfig={chartConfig}
                withInnerLines={false}
                withOuterLines={true}
                yAxisInterval={1.0}
                segments={4}
                bezier // optional, but sexy 😎
            />
        </View>
    )
}

const ChangeTypeIcon = ({ type, size, theme }) => {
    let iconName;
    let iconColor;
    let iconSize = size;

    switch(type) {
        case 'Added':
            iconName = 'add';
            iconColor = '#04cc47'
            break;
        case 'Removed':
            iconName = 'remove';
            iconColor = '#ff3b3b'
            break;
        case 'Changed':
            iconName = 'edit';
            iconColor = '#7733ff';
            iconSize *= 0.75;  // the changed icon is too big
            break;
        default:
            iconName = 'add';
            break;
    }
    return (
        <View style={[styles.typeIcon, {width: size, height: size, borderRadius: 40, backgroundColor: toRGBA(theme.s2, 0.4)}]}>
            <GoogleIcon name={iconName} size={iconSize * 0.75} color={iconColor} />
            {/* TODO: Add a 'goto' icon here (for added and changed events only), that will navigate to the page in the gradebook when pressed */}
        </View>
    )
}

const ChangeEvent = ({ key, eventData, theme }) => {
    const type = eventData.eventType[0].toUpperCase() + eventData.eventType.substr(1);
    let typeText = '';
    if(type !== 'Changed') {
        typeText = eventData.assignment.Type;
    } else {
        changes = eventData.assignment.changes;
        if(changes.length > 1) {
            for(let i=0; i<changes.length-1; i++) {
                typeText += changes[i] + ', ';
            }
        }
        typeText += changes[changes.length-1];
    }

    return (
        <View style={[styles.changeEventCardContainer, {borderRadius: 15, backgroundColor: toRGBA(theme.s2, 0.35)}]}>
            <View style={styles.changeEventCardLeft}>
                <ChangeTypeIcon type={type} size={50} theme={theme} />
            </View>
            <View style={styles.changeEventCardRight}>
                <View style={{flex: 1}}>
                    <Text style={[styles.changeEventMainText, {color: theme.s6}]}>
                        P{eventData.period+1}{' '}
                        <Text style={[styles.changeEventMainSubtext, {color: theme.s5}]}>{type}:</Text>
                    </Text>
                    <Text style={[styles.assignmentDetail, {color: theme.s6}]}>
                        {eventData.assignment.Measure}{' '}
                        <Text style={[styles.assignmentType, {color: theme.s4}]}>
                            [{ typeText }]
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

const HomePage = () => {
    const [studentInfo, setStudentInfo] = useState([]);
    const [notifsSeen, setNotifsSeen] = useState(false);
    const [gradeChanges, setGradeChanges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const scrollRef = useRef();
    const handleScroll = (y) => {
        scrollRef.current?.scrollTo({ y: y, animated: true });
    }
   
    useEffect(() => {
        refreshInfo();
    }, [notifsSeen])

    const themeContext = useContext(ThemeContext);
    const theme = themeContext.themeData.swatch;

    const data = { // TODO: get actual GPAs per month/day
        labels: ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
            data: [3.8, 3.4, 3.0, 3.2, 3.8, 3.5, 4.0, 3.9, 3.4, 4.0], 
            color: (/* opacity = 1 */) => toRGBA(theme.s3, 1),
            strokeWidth: 3 // optional
            }
        ],
    };

    const refreshInfo = async() => {
        try {
            setIsRefreshing(true);
            const credentials = await Keychain.getGenericPassword();
            if (!credentials) return;
            let info = await getStudentInfo(credentials.username, credentials.password);
            if(!info.text) {
                setStudentInfo(info);
                setIsLoading(false);
                setIsRefreshing(false);
            }
            let changesJSON = await AsyncStorage.getItem('gradebookChanges');
            let changesParsed = await JSON.parse(changesJSON);
            setGradeChanges(changesParsed);
            let notifCondJSON = await AsyncStorage.getItem('notifsSeen');
            if(notifCondJSON === null) {
                await AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: false }));
                notifCondJSON = 'false';
            }
            let notifCondParsed = await JSON.parse(notifCondJSON);
            setNotifsSeen(notifCondParsed.seen);
        } catch (err) {
            console.log(err);
        }
    }

    if(isLoading) {
        return (
            <View style = {[styles.container, {alignItems: 'center', justifyContent: 'center', backgroundColor: theme.s1}]}>
                <ActivityIndicator size = 'large' color={theme.s4} />
            </View> 
        );
    }

    let getChangeObjs = () => { //TODO: make into a flatlist
        let objArr = [];
        for(let key in gradeChanges) {
            let arr = gradeChanges[key];
            arr.forEach(period => { 
                period.assignments.forEach(assignment => {
                    objArr.push(
                        <ChangeEvent 
                            key={assignment.GradebookID} 
                            eventData={{
                                period: period.period,
                                eventType: key,
                                assignment: assignment
                            }}
                            theme={theme}
                        />
                    )
                })
            })
        }
        return objArr;
    }

    let changeObjs = getChangeObjs();
    const calcGpaDelta = (data) => {
        let dataArr = data.datasets[0].data;
        if(dataArr.length >= 2) {
            let latestMonth = dataArr[dataArr.length-1];
            let secondLatestMonth = dataArr[dataArr.length-2];
            if(latestMonth === secondLatestMonth)
                return 0;
            return ((latestMonth / secondLatestMonth - 1) * 100).toFixed(0);
        }
        return null;
    }
    const gpaDelta = calcGpaDelta(data);
    const pctColor = (gpaDelta > 0) ? theme.s10 : (gpaDelta < 0) ? theme.s11 : theme.s5
    const deltaChar = (gpaDelta > 0) ? '+' : ''

    const handleNotifsSeen = (newState) => {
        setNotifsSeen(newState);
        AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: newState }))
    }

    return (
        <ScrollView 
            style = {[styles.container, {backgroundColor: theme.s1}]}
            refreshControl={
                <RefreshControl 
                    refreshing={isRefreshing}
                    onRefresh={refreshInfo}
                />
            }
            ref={scrollRef}
        >
            <Header studentInfo={studentInfo} changes={gradeChanges} notifsSeen={notifsSeen} handleNotifsSeen={handleNotifsSeen} handleScroll={handleScroll} theme={theme} />
            <View style = {styles.main_container}>
                <Text style={[styles.header_text, {color: theme.s6}]}>Hi {studentInfo.StudentInfo.FormattedName.split(' ')[0]}!</Text>
                {/* <Text style={[styles.cardHeader_text, {color: theme.s4}]}>
                    Your GPA Growth Overview:{'  '}
                    <Text style={{color: pctColor}}>
                        {deltaChar}{gpaDelta}%
                    </Text>
                </Text>
                <Card 
                    customStyle={{
                        width: '100%',
                        height: 200,
                        padding: 0,
                        borderColor: 'transparent',
                    }}
                    outlined={false}
                    theme={theme}
                    data={data}
                >
                    <CustomLineChart />               
                </Card> */}
                <Text style={[styles.cardHeader_text, {color: theme.s4}]}>Latest Updates:</Text>
                <Card customStyle={{padding: 15, paddingTop: 10, paddingBottom: 10, minHeight: 400, borderColor: toRGBA(theme.s2, 1)}} outlined={true} theme={theme}>
                    { changeObjs /* TODO: make into a flatlist! the card container component is a bit tricky */}
                </Card>
            </View>
        </ScrollView>
    )
}

const ProfileStack = createStackNavigator();

const ProfileScreen = ({ navigation }) => {
    return (
        <ProfileStack.Navigator>
            <ProfileStack.Screen
                name = 'Home'  
                component = { HomePage }
                options = {{
                    title: 'Profile',
                    headerShown: false,
                }}
            />
        </ProfileStack.Navigator>   
    )
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
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        padding: 10,
    },
    profilePic_container: {
        right: 0,
    }, 
    profilePic: {
        width: profPicSize,
        height: profPicSize,
        borderRadius: 90 ,
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
    changeEventCardContainer: {
        flexDirection: 'row',
        width: '100%', 
        minHeight: 115, 
        marginTop: 5, 
        marginBottom: 5,
        justifyContent: 'center', 
    },
    changeEventCardLeft: {
        flex: 1.5, 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderTopLeftRadius: 15,
        borderBottomLeftRadius: 15, 
    },
    changeEventCardRight: {
        flex: 3, 
        padding: 10, 
        paddingTop: 5, 
        paddingBottom: 5,
        marginRight: 10,
        justifyContent: 'center',
    },
    changeEventMainText: {
        fontFamily: 'Proxima Nova Bold',
        top: 0,
        fontSize: 50,
        textAlignVertical: 'center',
    },
    changeEventMainSubtext: {
        fontFamily: 'Proxima Nova Bold',
        fontSize: 23,
        textAlignVertical: 'center',
    },
    assignmentDetail: {
        top: 0,
        fontFamily: 'ProximaNova-Regular',
        fontSize: 18,
        bottom: 10,
    },  
    assignmentType: {
        fontFamily: 'ProximaNova-Regular',
        fontSize: 15,
    }, 
    typeIcon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifBellContainer: {
        minWidth: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        borderRadius: 40,
        borderWidth: 1,
    },
    notifBell: {
        bottom: 1.5,
    },
    notifBellWarn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        minWidth: 15,
        minHeight: 13,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 1.5,
    },
    notifBellWarnText: {
        fontSize: 11,
        fontFamily: 'ProximaNova-Regular',
    },
});

export default ProfileScreen;