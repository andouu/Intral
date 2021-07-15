try {
    let response = await fetch('https://reactnative.dev/movies.json', {
        method: 'GET',
    });
    let json = await response.json();
    return json;
    
} catch (err) {
    console.error(err);
}   