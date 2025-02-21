const fetchDataAndUpdateDom = async () => {
    try {
        const response = await fetch('/state', {})
        const json = await response.json()
        document.body.className = json.status
        const stateText = (json.status === 'available') ? 'Є ДТЕК': 'НЕМА ДТЕК'
        const stateInnerHtml = `<h1>${stateText} <br /><span class="since" style="font-size: 20px">З ${json.lastChange}</span></h1>`

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