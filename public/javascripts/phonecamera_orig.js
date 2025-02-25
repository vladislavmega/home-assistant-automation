function init() {
    var isInFullscreen = false;

    function toggleFullscreen() {
        var div = document.getElementById("fullscreenDiv");

        if (isInFullscreen) {
            if (div.webkitCancelFullScreen) {
                div.webkitCancelFullScreen();
            } else if (div.mozCancelFullScreen) {
                div.mozCancelFullScreen();
            } else if (div.cancelFullScreen) {
                div.cancelFullScreen();
            } else {
                return;
            }
        } else {
            if (div.webkitRequestFullScreen) {
                div.webkitRequestFullScreen();
            } else if (div.mozRequestFullScreen) {
                div.mozRequestFullScreen();
            } else if (div.requestFullScreen) {
                div.requestFullScreen();
            } else {
                return;
            }
        }
    }


    var img = document.getElementById("live");
    img.src = "/live";
    img.onclick = toggleFullscreen;

    document.documentElement.onwebkitfullscreenchange = function() {
        isInFullscreen = !isInFullscreen;

        var sw = screen.width;
        var sh = screen.height;

        if (isInFullscreen) {
            if (sw/sh > img.width/img.height) {
                img.width = sh*img.width/img.height;
                img.height = sh;
            } else {
                img.width = sw;
                img.height = sw*img.height/img.width;
            }
        } else {
            img.removeAttribute("width");
            img.removeAttribute("height");
        }
    }
    document.documentElement.onfullscreenchange = document.documentElement.onwebkitfullscreenchange;
    document.addEventListener("mozfullscreenchange", document.documentElement.onwebkitfullscreenchange, false);



    var paramsMap = {};

    function changeParam(name, value) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var retParams = JSON.parse(xhr.responseText);

                if (retParams.hasOwnProperty("resolutions")) {
                    var resolutions = retParams["resolutions"];
                    var s = paramsMap["resolution"].uie;
                    s.innerHTML = "";
                    for (var i = 0; i < resolutions.length; ++i) {
                        var opt = document.createElement('option');
                        opt.value = i;
                        opt.innerText = resolutions[i];
                        s.add(opt);
                    }
                }

                for (var key in retParams) {
                    if (paramsMap.hasOwnProperty(key)) {
                        paramsMap[key].updateUI(retParams[key]);
                    }
                }
            }
        }
        xhr.open("GET", value===undefined?"/parameters":"/parameters?"+name+"="+value, false);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
    }

    var params = [];
    function Param(pid, updateUI, getVal) {
        this.pid = pid;
        this.uie = document.getElementById(pid);
        this.updateUI = updateUI;
        this.getVal = getVal;
        var self = this;
        this.uie.onchange = function() {
            changeParam(self.pid, self.getVal());
        }
    }

    function addSelParam(pid) {
        params.push(new Param(pid, function(val) {
            var bestDist = 1000000;
            var bestVal = null;
            for (var i in this.uie.options) {
                var opt = this.uie.options[i];
                var d = opt.value-val; d *= d;
                if (d < bestDist) {
                    bestDist = d;
                    bestVal = opt.value;
                }
            }
            this.uie.value = bestVal;
        }, function() {return this.uie.value;}));
    }
    addSelParam("camera");
    addSelParam("resolution");
    addSelParam("quality");
    addSelParam("fps");
    addSelParam("flip");
    addSelParam("rotation");

    function addCheckParam(pid) {
        params.push(new Param(pid, function(val) {
            this.uie.disabled = val<0;
            this.uie.checked = val==1;
        }, function() {return this.uie.checked?1:0;}));
    }
    addCheckParam("focus");
    addCheckParam("exposure");
    addCheckParam("wb");
    addCheckParam("torch");
    addCheckParam("stats");

    function addStringParam(pid) {
        params.push(new Param(pid, function(val) {
            this.uie.innerText = val;
        }));
    }
    addStringParam("battery");

    for (var i in params) {
        var param = params[i];
        paramsMap[param.pid] = param;
    }


    changeParam();
    setInterval(changeParam, 5000);
}