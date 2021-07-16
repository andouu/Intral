export const getGrades = async(username, password, quarter, type) => {
    try {
        const response = await fetch('http://your ip:3000/login', { // run ipconfig in a terminal and find your local ipv4 (should be something like 10.0.0.162). 
            method: 'POST',                                                 // NOTE: you HAVE to run the local server from the other git repo (intral-server) for this to work.
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: username,
                passwd: password,
                qtr: quarter,
                type: type
            })
        });
        let json = await response.json();
        return json;
    } catch (err) {
        console.log(err);
    }
};