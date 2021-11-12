function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function addToList() {
    if (document.getElementById("dot").checked && document.getElementById("serverUrl").value.includes(":")) {
        alert("Entering custom ports (e.g. :853) for DoT is not supported. Please remove it.");
    }
    else {
        var runningNo = getCookie("runningNo");
        if (getCookie("runningNo") == "") {
            runningNo = 0;
        }
        
        var d = new Date();
        d.setTime(d.getTime() + (86400000)); //expires in 24h
        var expires = "expires="+ d.toUTCString();
        document.cookie = runningNo + "provName=" + encodeURIComponent(document.getElementById("provName").value) + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "doh=" + document.getElementById("doh").checked + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "dns1v4=" + document.getElementById("dns1v4").value + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "dns2v4=" + document.getElementById("dns2v4").value + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "dns1v6=" + document.getElementById("dns1v6").value + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "dns2v6=" + document.getElementById("dns2v6").value + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "serverUrl=" + document.getElementById("serverUrl").value + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "exclWifi=" + encodeURIComponent(document.getElementById("exclWifi").value) + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "useWifi=" + document.getElementById("useWifi").checked + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "useCell=" + document.getElementById("useCell").checked + ";" + expires + ";path=/; SameSite=Strict; Secure";
        document.cookie = runningNo + "lockProfile=" + document.getElementById("lockProfile").checked + ";" + expires + ";path=/; SameSite=Strict; Secure";
    
        runningNo = parseInt(runningNo) + 1;
        document.cookie = "runningNo=" + runningNo + ";" + expires + ";path=/; SameSite=Strict; Secure";

        alert("Configuration added to profile.");
        populateDropDown();
    }
}

function switchToHTTPS() {
    document.getElementById("serverUrl").placeholder = "https://example.com/query" + document.getElementById("serverUrl").value;
    document.getElementById("dohdotServerLabel").innerHTML = "DoH server URL:";
}

function switchToTLS() {
    document.getElementById("serverUrl").placeholder = "dot.example.com";
    document.getElementById("dohdotServerLabel").innerHTML = "DoT server URL:";
}

function accordion() {
    var adv = document.getElementById("advanced_container");
    if (adv.className.indexOf("w3-show") == -1) {
        adv.className += " w3-show";
        adv.previousElementSibling.className = adv.previousElementSibling.className.replace("w3-dark-grey", "w3-black");
    } else {
        adv.className = adv.className.replace(" w3-show", "");
        adv.previousElementSibling.className = adv.previousElementSibling.className.replace("w3-black", "w3-dark-grey");
    }
}

function getDataFromUpload() {
    const selectedFile = document.getElementById('fileupload').files[0];
    var read = new FileReader();

    read.addEventListener("load", () => {
        // this will save file to string
        handleProfileText(read.result);
    }, false);

    if (selectedFile) {
        read.readAsText(selectedFile);
    }
}

function handleProfileText(uploadedProfile) {
    var profile = plist.parse(uploadedProfile);
    console.log(profile);

    //Name
    document.getElementById("provName").value = profile.PayloadContent[0].PayloadDisplayName;

    //Protocol and URL/ServerName
    if (profile.PayloadContent[0].DNSSettings.DNSProtocol == "HTTPS") {
        document.getElementById("doh").checked = true;
        document.getElementById("serverUrl").value = profile.PayloadContent[0].DNSSettings.ServerURL;
    }
    else if(profile.PayloadContent[0].DNSSettings.DNSProtocol == "TLS") {
        document.getElementById("dot").checked = true;
        document.getElementById("serverUrl").value = profile.PayloadContent[0].DNSSettings.ServerName;
    }

    //ServerAddresses, if applicable
    const serverAddresses = profile.PayloadContent[0].DNSSettings.ServerAddresses;
    if (serverAddresses) {
        var dns4count = 0;
        var dns6count = 0;
        for (let index = 0; index < serverAddresses.length; index++) {
            if (serverAddresses[index].includes(":")) {
                if (dns6count == 0) {
                    document.getElementById("dns1v6").value = serverAddresses[index];
                }
                else {
                    document.getElementById("dns2v6").value = serverAddresses[index];
                }
                dns6count++;
            }
            else if (serverAddresses[index].includes(".")) {
                if (dns4count == 0) {
                    document.getElementById("dns1v4").value = serverAddresses[index];
                }
                else {
                    document.getElementById("dns2v4").value = serverAddresses[index];
                }
                dns4count++;
            }
        }
    }

    //Profile locked?
    document.getElementById("lockProfile").checked = profile.PayloadContent[0].ProhibitDisablement;

    //Allow Wi-Fi and Cellular, check for excluded SSIDs
    profile.PayloadContent[0].OnDemandRules.forEach(rule => {
        if (rule.InterfaceTypeMatch == "WiFi") {
            if (rule.Action == "Connect") {
                document.getElementById("useWifi").checked = true;
            }
            else {
                document.getElementById("useWifi").checked = false;
            }
        }
        else if (rule.InterfaceTypeMatch == "Cellular") {
            if (rule.Action == "Connect") {
                document.getElementById("useCell").checked = true;
            }
            else {
                document.getElementById("useCell").checked = false;
            }
        }
        else if (rule.SSIDMatch) {
            rule.SSIDMatch.forEach(ssid => {
                if (document.getElementById("exclWifi").value != "") {
                    document.getElementById("exclWifi").value += ", "
                }
                document.getElementById("exclWifi").value += ssid;
            });
        }
    });
}

function populateDropDown() {
    document.getElementById("configSelect").options.length = 0; //Delete all options
    var runningNo = getCookie("runningNo");

    if (runningNo != "" && runningNo) {
        for (let index = 0; index < runningNo; index++) {
            var option = document.createElement("option");
            option.text = getCookie(index + "provName");
            document.getElementById("configSelect").add(option);
        }
    }
}

function loadSaved() {
    var selectedIndex = document.getElementById("configSelect").selectedIndex ;
    console.log(selectedIndex);

    document.getElementById("provName").value = getCookie(selectedIndex + "provName");
    if (getCookie(selectedIndex + "doh") === "true") {
        document.getElementById("doh").checked = true;
    }
    else {
        document.getElementById("dot").checked = true;
    }
    document.getElementById("dns1v4").value = getCookie(selectedIndex + "dns1v4");
    document.getElementById("dns2v4").value = getCookie(selectedIndex + "dns2v4");
    document.getElementById("dns1v6").value = getCookie(selectedIndex + "dns1v6");
    document.getElementById("dns2v6").value = getCookie(selectedIndex + "dns2v6");
    document.getElementById("serverUrl").value = getCookie(selectedIndex + "serverUrl");
    document.getElementById("exclWifi").value = getCookie(selectedIndex + "exclWifi");
    document.getElementById("useWifi").checked = (getCookie(selectedIndex + "useWifi") === "true");
    document.getElementById("useCell").checked = (getCookie(selectedIndex + "useCell") === "true");
    document.getElementById("lockProfile").checked = (getCookie(selectedIndex + "lockProfile") === "true");
}

function newConfig() {
    window.location.reload(true);
}