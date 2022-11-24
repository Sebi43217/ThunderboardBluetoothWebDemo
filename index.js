var additionalFilters = [{namePrefix: "Thunder"}]
var sensXRotation = 0;
var sensYRotation = 0;
var sensZRotation = 0;
var registered = false;

window.onload = init();

function init() {
    initBluetoothLib("gatt_configuration.xml", null, additionalFilters);
}

function customDisconnectEvent(event){
    disconnected(event);
}

function StartConnection(){
    Connect(customDisconnectEvent)
    .then(_=> readDatafromGATTid(12))
    .then(data => {
        setLED(data, "LED1");
        return receiveNotificationfromGATTid(12, LEDnotification);
    })
    .then(_=> receiveNotificationfromGATTid(19, MAGnotification))
    .then(_=> receiveNotificationfromGATTid(20, MagFieldNotification))
    .then(_=> readStringfromGATTid(2, "utf-8"))
    .then(deviceN =>{
        document.getElementById("device.name").innerHTML=deviceN;
        return measureEnvironment();
    })
    .catch(error=>{
    });
}

function StopConnection(){
    document.getElementById("device.name").innerHTML="!no Device!";
    document.getElementById("mag.strength").innerHTML="0 uT";
    document.getElementById("mag.status").innerHTML="<font color =black>Status: OK"; 

    sensXRotation = 0;
    sensYRotation = 0;
    sensZRotation = 0;
    document.getElementById("sens.x").innerHTML = "0.0 °";
    document.getElementById("sens.y").innerHTML = "0.0 °";
    document.getElementById("sens.z").innerHTML = "0.0 °";
    document.getElementById("switch1").checked = false;
    document.getElementById("sens.uvIndex").innerHTML="0";
    document.getElementById("sens.ambLight").innerHTML="0 Lux";
    document.getElementById("sens.temperature").innerHTML="0 °C";
    document.getElementById("sens.humidity").innerHTML="0 %";
    var htmlLED = '<div class="led-red-off"></div>';
    document.getElementById("LED1").innerHTML = htmlLED;
    document.getElementById("LED2").innerHTML = htmlLED;
    document.getElementById("LED3").innerHTML = htmlLED;
    htmlLED = '<div class="led-orange-off"></div>';
    document.getElementById("LED4").innerHTML = htmlLED;
    Disconnect();
}

function MagFieldNotification(event){
    const data = event.target.value;
    var magField = data.getInt32(0, true);
    document.getElementById("mag.strength").innerHTML=magField+" uT";
}

function MAGnotification(event){
    const data = event.target.value;
    if(data.getUint8(0) & 0x02){
        document.getElementById("mag.status").innerHTML="<font color =red>Status: Triped"; 
    }
    else{
        document.getElementById("mag.status").innerHTML="<font color =black>Status: OK"; 
    }
    setLED(data, "LED3");
}

function LEDnotification(event){
    const data = event.target.value;
    setLED(data, "LED1");
}

function startSens(){
    receiveNotificationfromGATTid(24, SensNotification)
    .then(_=>{
        return receiveNotificationfromGATTid(23, SensNotification2);
    })
}

function stoppSens(){
    stopNotificationfromGATTid(24, SensNotification)
    .then(_=>{
        sensXRotation = 0;
        sensYRotation = 0;
        sensZRotation = 0;
        document.getElementById("sens.x").innerHTML = "0.0 °";
        document.getElementById("sens.y").innerHTML = "0.0 °";
        document.getElementById("sens.z").innerHTML = "0.0 °";
        return stopNotificationfromGATTid(23, SensNotification2);
    });
    
}

function SensNotification(event){
    const data = event.target.value;
    sensXRotation = (data.getInt16(0,true)/36000 * -2 * Math.PI);
    sensYRotation = (data.getInt16(4,true)/36000 * 2 * Math.PI);
    sensZRotation = (data.getInt16(2,true)/36000 * 2 * Math.PI);
    sensXRotationDeg = sensXRotation /(2 * Math.PI) * 360;
    sensYRotationDeg = sensYRotation /(2 * Math.PI) * 360;
    sensZRotationDeg = sensZRotation /(2 * Math.PI) * 360;
    document.getElementById("sens.x").innerHTML = sensXRotationDeg.toFixed(1)+" °";
    document.getElementById("sens.y").innerHTML = sensYRotationDeg.toFixed(1)+" °";
    document.getElementById("sens.z").innerHTML = sensZRotationDeg.toFixed(1)+" °";
}

function SensNotification2(event){
    const data = event.target.value;
    //console.dir(data.getInt16(0,true));
    //console.dir(data.getInt16(4,true));
    //console.dir(data.getInt16(2,true));
    //log("-----------");
}

function setLED(data, led){
    if(data.getUint8(0) & 0x01){
        var htmlLED = '<div class="led-red-on"></div>';
        document.getElementById(led).innerHTML = htmlLED;
    }
    else{
        var htmlLED = '<div class="led-red-off"></div>';
        document.getElementById(led).innerHTML = htmlLED;
    }
}

function resetMagSens(){
    writeStringtoGATTid (21, "0x0100", "hex");
}

function measureEnvironment(){
    return new Promise((resolve ,reject)=>{
        readDatafromGATTid(27)
        .then(data => {
            var uvIndex = data.getUint8(0);
            document.getElementById("sens.uvIndex").innerHTML=uvIndex;
            return readDatafromGATTid(28);
        })
        .then(data => {
            var ambLight = data.getUint32(0, true) / 100;
            document.getElementById("sens.ambLight").innerHTML=ambLight.toFixed(2)+" Lux";
            return readDatafromGATTid(30);
        })
        .then(data => {
            temperature = data.getInt16(0, true) / 100;
            document.getElementById("sens.temperature").innerHTML=temperature.toFixed(2)+" °C";
            return readDatafromGATTid(31);
        })
        .then(data =>{
            humidity = data.getUint16(0, true) / 100;
            document.getElementById("sens.humidity").innerHTML=humidity.toFixed(2)+" %";
            resolve("Environment measured successful");
        })
        .catch(error =>{
            reject(error);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var checkboxes = document.querySelectorAll('input[type=checkbox][name=switch1]');
    if (registered){

    }
    else{
        registered = true;
        for (var checkbox of checkboxes)
        {
            checkbox.addEventListener('change', function(event)
            {
                if (event.target.checked) {
                var htmlLED = '<div class="led-red-on"></div>';
                document.getElementById("LED2").innerHTML = htmlLED;
                htmlLED = '<div class="led-orange-on"></div>';
                document.getElementById("LED4").innerHTML = htmlLED;
                writeStringtoGATTid (13, "0x01", "hex");
                }
                else {
                var htmlLED = '<div class="led-red-off"></div>';
                document.getElementById("LED2").innerHTML = htmlLED;
                htmlLED = '<div class="led-orange-off"></div>';
                document.getElementById("LED4").innerHTML = htmlLED;
                writeStringtoGATTid (13, "0x00", "hex");
                }
            });
        }
    }
}, false);