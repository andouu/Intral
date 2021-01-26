import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const App: () => React$Node = () => {
    return (
        <>
        <View style = {{flex: 1, backgroundColor: "powderblue", justifyContent: "center", alignItems: "center"}}>
            <Text style = {{color: "red"}}>your grades</Text>
        </View>
        </>
    );
};

export default App;