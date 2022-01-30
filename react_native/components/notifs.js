import BackgroundTimer from 'react-native-background-timer';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidGroupAlertBehavior } from '@notifee/react-native';
import { getGrades, findDifference, logDiff, noDiff } from './api';
import { capitalizeWord } from './utils';

export const gradeNotifRates = ['Weekly', 'Daily', 'Max'];

BackgroundTimer.runBackgroundTimer(async () => {
    try {
        console.log('checking for gradebook changes...');
        const credentials = await Keychain.getGenericPassword();
        if (!credentials) return;
        let pull = await getGrades(credentials.username, credentials.password);  // pulls data from api asyncronously from api.js
        // console.log(pull);
        let difference = [];
        let storedClasses = await AsyncStorage.getItem('classes');
        let prev = JSON.parse(storedClasses); // parse storage pull
        if (Array.isArray(prev)) {
            difference = findDifference(prev, pull);  // compare to simulated data for added, removed, and modified (ie. pts. changed) assignments

            if (Object.keys(difference).length !== 0 && difference.constructor === Object) {  // check if there are any differences
                await AsyncStorage.setItem('gradebookChanges', JSON.stringify(difference));  // save the difference to storage
                await AsyncStorage.setItem('notifsSeen', JSON.stringify({ seen: false }));   // set the notifs warning to show in profile page everytime there are new changes
            } else {
                console.log('no changes');
                return;
            }
        }
        if (!noDiff(difference)) {
            await AsyncStorage.setItem('classes', JSON.stringify(pull)); // temporary
            handleDisplayNotif(difference);
        }
    } catch(err) {
        console.error(err);
    }
}, 300000); // 300000ms = 5 min

const handleDisplayNotif = async (diff) => {
    if (noDiff(diff)) return;
    await notifee.cancelDisplayedNotifications();
    const channelId = await notifee.createChannel({
        id: 'Updates',
        name: 'Updates',
    });        
    await notifee.displayNotification({
        title: 'Updates',
        subtitle: 'Updates',
        android: {
            channelId,
            groupSummary: true,
            groupId: 'Updates',
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            color: '#0170ff',
            smallIcon: 'ic_stat_name',
        }
    });

    for(let key in diff) {
        let action = diff[key];
        action.forEach(item => {
            item.assignments.forEach(assignment => {
                if (key !== 'changed') {
                    notifee.displayNotification({
                        title: assignment.Measure,
                        body: 'Tap to see assignment details',
                        subtitle: `Period ${item.period + 1} ${capitalizeWord(key)}`,
                        android: {
                            channelId,
                            groupId: 'Updates',
                            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
                            pressAction: {
                                id: 'pep',
                                launchActivity: 'default',
                            },
                            smallIcon: 'ic_stat_name',
                        }
                    });
                } else {
                    notifee.displayNotification({
                        title: assignment.Measure,
                        body: `${assignment.changes.join(', ')} changed for ${assignment.Measure}`,
                        subtitle: `Period ${item.period + 1} Changed`,
                        android: {
                            channelId,
                            groupId: 'Updates',
                            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
                            pressAction: {
                                id: 'pep',
                                launchActivity: 'default',
                            },
                            smallIcon: 'ic_stat_name',
                        }
                    });
                }
            })
        })
    }

    logDiff(diff);
}