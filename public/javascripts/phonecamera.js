const paramsUrl = `/phonecamera/params`
const setTorchUrl = '/phonecamera/torch'

async function getParameters() {
    const response = await fetch(paramsUrl);
    return await response.json();
}

function refreshFrame() {
    const imageTag = document.getElementById('stream');
    imageTag.src = null;
    imageTag.src = 'http://192.168.88.18/live'
}

async function setTorch(value) {
    const response = await fetch(`${setTorchUrl}/${value}`);
    return await response.json();
}

async function init () {
    const parameters = await getParameters();
    const toggleButton = document.getElementById('toggleButton')
    toggleButton.className = parameters.torch ? 'active' : '';
    toggleButton.onclick = async () => {
        if (toggleButton.className === 'active') {
            toggleButton.className = '';
            await setTorch(0)
        } else {
            toggleButton.className = 'active';
            await setTorch(1)
        }
    }
    setInterval(refreshFrame, 10000);
}

init();