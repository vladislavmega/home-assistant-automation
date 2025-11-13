const fetchDataAndUpdateDom = async () => {
    try {
        const response = await fetch('/state', {})
        const json = await response.json()
        document.body.className = json.status
    
        const stateInnerHtml = `<h1>${json.statusText} <br />
        <span class="since" style="font-size: 20px">З ${json.lastChange}</span><br />
        <span style="font-size: 18px">${json.nextEvent}</span>
        </h1>
        `

        console.log('updated')
        document.getElementById('state').innerHTML = stateInnerHtml
    }
    catch(e) {
        console.log(e);
    }
}

setInterval(() => {
    fetchDataAndUpdateDom()
}, 10000)