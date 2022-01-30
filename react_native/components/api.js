import * as Keychain from 'react-native-keychain';

const serverip = "https://arcane-tundra-27876.herokuapp.com";
const fullurl = `${serverip}/login/`;

export const login = async() => {
    try {
        const credentials = await Keychain.getGenericPassword();
        if (!credentials) {
            console.log("No credentials stored.");
            return;
        }

        const response = await fetch(fullurl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: credentials.username,
                password: credentials.password,
            })
        });
        let json = await response.json();
        return json;
    } catch (err) {
        console.log(err);
    }
}

export const getGrades = async(username, password, quarter=null) => {
    try {
        const response = await fetch(fullurl + 'grades', {                
            method: 'POST',                                                        
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: username,
                password: password,
                qtr: quarter,
            })
        });
        let json = await response.json(); // convert the response to a javascript object from a json string
        return json;
    } catch (err) {
        console.log(err);
    }
};

export const getStudentInfo = async(username, password) => {
    try {
        const response = await fetch(fullurl + 'studentInfo', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: username,
                password: password,
            })
        });
        let json = await response.json();
        return json;
    } catch (err) {
        console.log(err);
    }
}

const validChanges = {        // to check for valid changes; we don't really care about gradebookID changes (if it even changes)
    Type: 'Assignment Type',
    DueDate: 'Due Date',
    Points: 'Points',         // points over score because idk
    Notes: 'Teacher Notes',
}

export const findDifference = (original, newData) => {
    let added = [];
    let removed = [];
    let changed = [];
    for(let i = 0; i < original.length; i++) { // loop through all the classes
        let currAssignments = original[i].Marks.Mark.Assignments.Assignment.slice();     // make a copy of the current assignments
        let compareAssignments = newData[i].Marks.Mark.Assignments.Assignment.slice();   // make a copy of the incoming assignments (to compare against)
        let tmpAdded = []; // temporary array to hold the new assignments
        let tmpChanged = []; // temporary array to hold the changed assignments
        const len = compareAssignments.length;
        for(let j = 0; j < len; j++) {
            let index = currAssignments.findIndex(item => item.Measure === compareAssignments[j].Measure); // check if the assignment in the compare array exists in the current assignments
            if (index === -1) { // if it doesn't exist
                tmpAdded.push(compareAssignments[j]); // add it to the new assignments array
            } else {
                let tmp = [];
                for(var key in compareAssignments[j]) {
                    if (validChanges[key]) // check if the key is a change we're looking for
                    {
                        if (compareAssignments[j][key] !== currAssignments[index][key]) {
                            tmp.push(validChanges[key]);
                        }
                    }
                }
                if(tmp.length > 0) { // check if there are any changes
                    tmpChanged.push({ Measure: compareAssignments[j].Measure, changes: tmp });
                }
                currAssignments.splice(index, 1); // remove it from the current assignments copy. At the end of the loop, the removed assignments will be anything not removed from the copy.
            }
        }

        if(tmpAdded.length > 0) { // if there are any added, removed, or changed assignments, add them to the return object, otherwise don't add anything.
            added.push({ period: i, assignments: tmpAdded });
        }
        if(currAssignments.length > 0) {
            removed.push({ period: i, assignments: currAssignments });
        }
        if(tmpChanged.length > 0) {
            changed.push({ period: i, assignments: tmpChanged });
        }
    }

    let result = {}; // the return object

    if(added.length > 0) {               // if there are any added assignments or removed assignments, return them.
        result.added = added;
    }
    if(removed.length > 0) {
        result.removed = removed;
    }
    if(changed.length > 0) {
        result.changed = changed;
    }
    
    return result;
}

export const logDiff = (diff) => { // for debugging purposes (assignment differences)
    for(let key in diff){
        let arr = diff[key];
        arr.forEach(item => {
            console.log('Period ' + (item.period + 1) + ' ' + key.toString() + ' ' + item.assignments.length + ' assignments: ');
            item.assignments.forEach(assignment => {
                if (key !== 'changed') {
                    console.log(assignment.Measure);
                } else {
                    let changeArray = assignment.changes;
                    let fullMessage = '';
                    fullMessage +=  assignment.Measure + ': ';
                    for(let i = 0; i < changeArray.length - 1; i++) {
                        fullMessage += changeArray[i] + ', ';
                    }
                    fullMessage += changeArray[changeArray.length - 1];
                    console.log(fullMessage)
                }
            });
        });
    }
}

export const noDiff = (diff) => {
    if (!diff || diff === []) return true;
    const c1 = diff.added && diff.added.length === 0;
    const c2 = diff.removed && diff.removed.length === 0;
    const c3 = diff.changed && diff.changed.length === 0;
    return c1 && c2 && c3;
}
