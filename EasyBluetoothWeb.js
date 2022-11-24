//-------------------------------------------------------------------------Variables------------------------------------------------------------------
var gattIDs = 0;
var gatt_structure = [];
var conHandle = {acceptAllDevices: true, optionalServices: []};
var filterConHandle = {filters: [], optionalServices: []};
var deviceHandle;
var serverHnadle = null;
var connected = false;
var printgattTable = false;
var gattTable = '';
var targetObj = {};
var LED_Array = [];
var Plot_Array = [];
var log = console.log;
var preLog = false;
var targetProxy  = new Proxy(targetObj, {
    set: function (target, key, value) {
        if(printgattTable){
            document.getElementById(gattTableID).innerHTML = value;
        }
        if(consoleEnabled){
            var console = '<div id="output" class="output"'+
                ' style="width:500px;height:150px;overflow:scroll;padding:5px;padding:5px;background-color:#EEEEEE;color:#000000;border:4px double #000000;">'+
                '<div id="content"></div><div id="status"></div><pre id="log"></pre></div>'
            document.getElementById(consoleID).innerHTML = console;
            if(preLog){
                log(preLog);
            }
        }
    }
});
var consoleEnabled = false;
var gattTableID;
var consoleID;
//--------------------------------------------------------------------------Functions-----------------------------------------------------------------
function initBluetoothLib(xml, additionalServices, additionalFilters){
    if(additionalFilters){
        addAdditionalFilters(additionalFilters);
        conHandle = filterConHandle;
    }
    if(xml){
        loadXMLDoc(xml)
    }
    if(additionalServices){
        addAdditionalServices(additionalServices);
    }
}

function Connect(disconnectCallback){
    return new Promise((resolve ,reject)=>{
        if(isWebBluetoothEnabled()){           
            connectDevice(disconnectCallback)
            .then(status=>{
                resolve(status);
            })
            .catch(error =>{
                reject(error);
            });
        }
        else{
            reject("Error Bluetooth not available")
        }
    });
}

function Disconnect(){
    return new Promise((resolve ,reject)=>{
        disconnectDevice()
        .then(status=>{
            resolve(status);
        })
        .catch(error =>{
            reject(error);
        });
    })
}

function disconnected(event){
    const device = event.target;
    connected = false;
    serverHnadle = null;
    log(`Device ${device.name} is disconnected.`);
}

function writeDatatoGATTid (table_id, data){  
    return new Promise((resolve ,reject)=>{
        writeDataID(table_id, data)
        .then(status=>{
            resolve(status);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function writeDatatoUUID (service, characteristic, data){
    return new Promise((resolve ,reject)=>{
        writeDataVlue(service, characteristic, data)
        .then(status=>{
            resolve(status);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function readDatafromGATTid(table_id){
    return new Promise((resolve ,reject)=>{
        readDataID(table_id)
        .then(readdata=>{
            resolve(readdata);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function readDatafromUUID(service, characteristic){
    return new Promise((resolve ,reject)=>{
        readDataValue(service, characteristic)
        .then(readdata=>{
            resolve(readdata);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function writeStringtoGATTid (table_id, string, dataType){  
    return new Promise((resolve ,reject)=>{
        writeDataID(table_id, stringTOdata(string , dataType))
        .then(status=>{
            resolve(status);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function writeStringtoUUID (service, characteristic, string, dataType){
    return new Promise((resolve ,reject)=>{
        writeDataVlue(service, characteristic, stringTOdata(string , dataType))
        .then(status=>{
            resolve(status);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function readStringfromGATTid(table_id, dataType){
    return new Promise((resolve ,reject)=>{
        readDataID(table_id)
        .then(readdata=>{
           return dataTOstring(readdata , dataType)
        })
        .then(readstring=>{
            resolve(readstring);
        })
        .catch(error =>{
            reject(error);
        });
    });
}

function readStringfromUUID(service, characteristic, dataType){
    return new Promise((resolve ,reject)=>{
        readDataValue(service, characteristic)
        .then(readdata=>{
            return dataTOstring(readdata , dataType)
        })
        .then(readstring=>{
            resolve(readstring);
        })
        .catch(error =>{
            reject(error);
        });
    });
}


function receiveNotificationfromGATTid(table_id, receiveFunction){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(gatt_structure[table_id - 1].service_uuid)
            .then(service => getCharacteristic(service, gatt_structure[table_id - 1].doubleDetected,table_id))
            .then(characteristic => characteristic.startNotifications())
            .then(characteristic => characteristic.addEventListener('characteristicvaluechanged', receiveFunction))
            .then(_=> log('Notifications have been started.'))
            .then(_=>{
                resolve("Register Notifications sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            reject("Device connection faliure");
        }
    });
}

function receiveNotificationfromUUID(service, characteristic, receiveFunction){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(service)
            .then(service => service.getCharacteristic(characteristic))
            .then(characteristic => characteristic.startNotifications())
            .then(characteristic => characteristic.addEventListener('characteristicvaluechanged', receiveFunction))
            .then(_=> log('Notifications have been started.'))
            .then(_=>{
                resolve("Register Notification sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            reject("Device connection faliure");
        }
    });
}

function stopNotificationfromGATTid(table_id, receiveFunction){
    return new Promise((resolve ,reject)=>{
        var myCharacteristic;
        if(serverHnadle){
            serverHnadle.getPrimaryService(gatt_structure[table_id - 1].service_uuid)
            .then(service => getCharacteristic(service, gatt_structure[table_id - 1].doubleDetected,table_id))
            .then(characteristic => {
                myCharacteristic = characteristic
            })
            .then(_=> myCharacteristic.stopNotifications())
            .then(_=> myCharacteristic.removeEventListener('characteristicvaluechanged', receiveFunction))
            .then(_=> console.log('Notifications have been stoped.'))
            .then(_=>{
                resolve("Data-write sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            reject("Device connection faliure");
        }
    });
}

function stopNotificationfromUUID(service, characteristic, receiveFunction){
    return new Promise((resolve ,reject)=>{
        var myCharacteristic;
        if(serverHnadle){
            serverHnadle.getPrimaryService(service)
            .then(service => service.getCharacteristic(characteristic))
            .then(characteristic => {
                myCharacteristic = characteristic
            })
            .then(_=> myCharacteristic.stopNotifications())
            .then(_=> myCharacteristic.removeEventListener('characteristicvaluechanged', receiveFunction))
            .then(_=> console.log('Notifications have been stoped.'))
            .then(_=>{
                resolve("Data-write sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            reject("Device connection faliure");
        }
    });
}

function printGATT(ID){
    printgattTable = true;
    gattTableID = ID;
}

function showConsole(ID){
  consoleEnabled = true;
  consoleID = ID;
  log = Console.log;
}

function clearConsole(){
    Console.clearLog();
}

function setpreLog(string){
    preLog = string;
}

//---------------------------------------------------------------------------GATT Quary----------------------------------------------

function loadXMLDoc(xml) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        makeGattTable(this);
      }
    };
    xmlhttp.open("GET", xml, true);
    xmlhttp.send();
}
  
function makeGattTable(xml) {
  var f, i, xmlDoc;
  xmlDoc = xml.responseXML;
  var gatt = xmlDoc.getElementsByTagName("gatt");
  var service;
  var Characteristic;
  var table_id = 1;
  var res = '<table><thead><tr><th>GATT-ID</th>' +
                          '<th>Service</th>' +
                          '<th>Characteristic</th>' + 
                          '<th>UUID</th>' + 
                          '<th>Value</th>' + 
                          '<th>Controls</th>' + 
                          '<th>Vlaue Length</th>' + 
                          '<th>Variable length</th>' + 
                          '<th>Type</th>' + 
                          '<th>Properties</th>' + 
                          '<th>ID</th>' +
                          '<th>SIG typ</th>' +
                          '<th>Description</th>' + 
                          '<th>Info</th></tr></thead>';
  for (i = 0; i< gatt[0].children.length; i++) {
    service = gatt[0].children[i];
    Characteristic = service.getElementsByTagName('characteristic')
    res += printTableRow(service, table_id);
    table_id += 1;
    if(service.getAttribute('uuid').length > 6){
      let service_Struct = {service_uuid: service.getAttribute('uuid').toLowerCase(), characteristic_uuid: NaN, dataType: NaN};
      conHandle.optionalServices.push(service.getAttribute('uuid').toLowerCase());
      gatt_structure.push(service_Struct)
    }
    else{
      let service_Struct = {service_uuid: parseInt("0x" + service.getAttribute('uuid').toLowerCase()), characteristic_uuid: NaN, dataType: NaN};
      conHandle.optionalServices.push(parseInt("0x" + service.getAttribute('uuid').toLowerCase()));
      gatt_structure.push(service_Struct)
    }
    var doubleIDNr = 0;
    for (f = 0; f < Characteristic.length; f++){
      res += printTableRow(Characteristic[f], table_id);
      table_id += 1;
      if(f > 0){
        if(Characteristic[f].getAttribute('uuid') == Characteristic[f-1].getAttribute('uuid')){
          doubleIDNr = f;
        }
        else{
          doubleIDNr = 0;
        }
      }
      if(Characteristic[f].getAttribute('uuid').length > 6){
        let service_id;
        if(service.getAttribute('uuid').length > 6){
          service_id = service.getAttribute('uuid').toLowerCase();
        }
        else{
          service_id = parseInt("0x" + service.getAttribute('uuid').toLowerCase());
        }
        let characteristic_Struct = {service_uuid: service_id, characteristic_uuid: Characteristic[f].getAttribute('uuid').toLowerCase(), dataType: Characteristic[f].getElementsByTagName('value')[0].getAttribute('type'), doubleDetected: doubleIDNr};
        conHandle.optionalServices.push(Characteristic[f].getAttribute('uuid').toLowerCase());
        gatt_structure.push(characteristic_Struct)
      }
      else{
        let service_id;
        if(service.getAttribute('uuid').length > 6){
          service_id = service.getAttribute('uuid').toLowerCase();
        }
        else{
          service_id = parseInt("0x" + service.getAttribute('uuid').toLowerCase());
        }
        let characteristic_Struct = {service_uuid: service_id, characteristic_uuid: parseInt("0x" + Characteristic[f].getAttribute('uuid').toLowerCase()), dataType: Characteristic[f].getElementsByTagName('value')[0].getAttribute('type'), doubleDetected: doubleIDNr};
        conHandle.optionalServices.push(parseInt("0x" + Characteristic[f].getAttribute('uuid').toLowerCase()));
        gatt_structure.push(characteristic_Struct)
      }
    }
  }
  res += '</table>';
  targetProxy.gattTable = res;
  return true;
}

function printTableRow(node, table_id){
  var res;
  res = '<tr>';
  if(node.getAttribute('type')) {	// is a Service
    res += '<td>'+ table_id + "<br>" + '</td>';	
    res += '<td>'+ node.getAttribute('name') + "<br>" + '</td>';
    res += '<td>'+ node.getElementsByTagName('characteristic').length + "<br>" + '</td>';	
    res += '<td>'+ "0x" + node.getAttribute('uuid') + "<br>" + '</td>';
    res += '<td>'+ "<br>" + '</td>';
    res += '<td>'+ "<br>" + '</td>';
    res += '<td>'+ "<br>" + '</td>';
    res += '<td>'+ "<br>" + '</td>';
    res += '<td>'+ node.getAttribute('type') + "<br>" + '</td>';
    res += '<td>'+ "Requirement:" + node.getAttribute('requirement') + "<br>" + '</td>';
    if(node.getAttribute('id')){
      res += '<td>'+ node.getAttribute('id') + "<br>" + '</td>';
    }
    else{
      res += '<td>'+ "<br>" + '</td>';
    }
    if(node.getAttribute('sourceId')){
      res += '<td>'+ node.getAttribute('sourceId') + "<br>" + '</td>';
    }
    else{
      res += '<td>'+ "<br>" + '</td>';
    }
    res += '<td>'+ "<br>" + '</td>';
  }
  else {        //is a Characteristic
    res += '<td>'+ table_id + "<br>" + '</td>';	
    res += '<td>'+ "-" + "<br>" + '</td>';	
    res += '<td>'+ node.getAttribute('name') + "<br>" + '</td>';	
    res += '<td>'+ "0x" + node.getAttribute('uuid') + "<br>" + '</td>';
    res += '<td>'+ "<span id=\"readdata" + table_id + "\"><font color=8e8988 >" + node.getElementsByTagName('value')[0].textContent + "</font></span>" + "<br>";
    if((node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0]||(node.getElementsByTagName('properties')[0].getAttribute('write')))){
      res += "<br>" + "<label for= \"WriteData" + table_id +"\" >Input</label><textarea id= \"writedata" + table_id + 
      "\" placeholder=\"Data to Send\" name= \"text\" cols= \"40\" rows= \"1\"></textarea>" + "<br>" + '</td>';
    }
    else{
      res += '</td>';
    }
    res += '<td>';
    if ((node.getElementsByTagName('properties')[0].getElementsByTagName('read')[0])||(node.getElementsByTagName('properties')[0].getAttribute('read'))){
      res += "<button onclick=" + "AutoreadData(" + table_id + ")" + ">Read</button>" + "<br>";
    }
    if((node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0])||(node.getElementsByTagName('properties')[0].getAttribute('write'))){
      res += "<button onclick=" + "AutowriteData(" + table_id + ")" + ">Write</button>" + "<br>";
    }
    res += "<br>" + '</td>';
    res += '<td>'+ node.getElementsByTagName('value')[0].getAttribute('length') + "<br>" + '</td>';
    res += '<td>'+ node.getElementsByTagName('value')[0].getAttribute('variable_length') + "<br>" + '</td>';
    res += '<td>'+ node.getElementsByTagName('value')[0].getAttribute('type') + "<br>" + '</td>';
    res += '<td>';
    if (node.getElementsByTagName('properties')[0].getElementsByTagName('read')[0]){
        res += "Read" + "<br>" +
        "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('read')[0].getAttribute('authenticated') + 
        "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('read')[0].getAttribute('bonded') + 
        "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('read')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    else if (node.getElementsByTagName('properties')[0].getAttribute('read')){
        res += "Read" + "<br>";
    }
    if(node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0]){
      res += "Write" + "<br>" +
      "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0].getAttribute('authenticated') + 
      "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0].getAttribute('bonded') + 
      "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    else if(node.getElementsByTagName('properties')[0].getAttribute('write')){
        res += "Write" + "<br>";
    }
    if(node.getElementsByTagName('properties')[0].getElementsByTagName('write_no_response')[0]){
      res += "Write no response" + "<br>" +
      "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write_no_response')[0].getAttribute('authenticated') + 
      "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write_no_response')[0].getAttribute('bonded') + 
      "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('write_no_response')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    if (node.getElementsByTagName('properties')[0].getElementsByTagName('reliable_write')[0]){
      res += "Reliable write" + "<br>" +
      "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('reliable_write')[0].getAttribute('authenticated') + 
      "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('reliable_write')[0].getAttribute('bonded') + 
      "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('reliable_write')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    if(node.getElementsByTagName('properties')[0].getElementsByTagName('indicate')[0]){
      res += "Indicate" + "<br>" +
      "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('indicate')[0].getAttribute('authenticated') + 
      "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('indicate')[0].getAttribute('bonded') + 
      "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('indicate')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    if (node.getElementsByTagName('properties')[0].getElementsByTagName('notify')[0]){
      res += "Notify" + "<br>" +
      "\t Authenticated:" + node.getElementsByTagName('properties')[0].getElementsByTagName('notify')[0].getAttribute('authenticated') + 
      "\t Bonded:" + node.getElementsByTagName('properties')[0].getElementsByTagName('notify')[0].getAttribute('bonded') + 
      "\t Encrypted:" + node.getElementsByTagName('properties')[0].getElementsByTagName('notify')[0].getAttribute('encrypted') + "<br>" + "<br>";
    }
    if (node.hasAttribute('const')){
        res += "Const:" + node.getAttribute('const') + "<br>";
    }
    if (node.getElementsByTagName('properties')[0].getAttribute('notify')){
        res += "Notify" + "<br>";
    }
    res += '</td>';
    if(node.getAttribute('id')){
      res += '<td>'+ node.getAttribute('id') + "<br>" + '</td>';
    }
    else{
      res += '<td>'+ "<br>" + '</td>';
    }
    if(node.getAttribute('sourceId')){
      res += '<td>'+ node.getAttribute('sourceId') + "<br>" + '</td>';
    }
    else{
      res += '<td>'+ "<br>" + '</td>';
    }
    try {
      res += '<td>'+ node.getElementsByTagName('description')[0].textContent + "<br>" + '</td>'; 
    }
    catch{
      res += '<td>'+ "<br>" + '</td>';
    }
  }
  res += '<td>'+ node.getElementsByTagName('informativeText')[0].textContent + "<br>" + '</td>'; 
  res += '</tr>';
  return res;
}

//-----------------------------------------------------------------------------Conection----------------------------------------

function connectDevice(disconnectCallback){
    return new Promise((resolve ,reject)=>{
        navigator.bluetooth.requestDevice(conHandle)
        .then(device => {
            deviceHandle = device;
            connected = true;
            if(disconnectCallback){
                deviceHandle.addEventListener('gattserverdisconnected', disconnectCallback);
            }
            else{
                deviceHandle.addEventListener('gattserverdisconnected', onDisconnected);
            }
            log(`Connecting to Device ${deviceHandle.name}`);
            deviceHandle.gatt.connect()
            .then(server => {
            serverHnadle = server;
            log(`Device ${deviceHandle.name} is connected.`);
            resolve("Connected");
            })
            .catch(error => {
                log('No Device has ben connectet' + error);
                reject(error);
            });
        })
        .catch(error => {
            log('No Device has ben connectet \n' + error);
            reject(error);
        });
    });
}

function disconnectDevice(){
    return new Promise((resolve ,reject)=>{
        if(connected){
            deviceHandle.gatt.disconnect()
            .then(status=>{
                resolve(status);
            })
            .catch(error =>{
                reject(error);
            });
        }
        else{
            log('No Device is connectet');
            reject('Error: No Device is connectet');
        }
    });
}

function onDisconnected(event) {
    const device = event.target;
    connected = false;
    serverHnadle = null;
    log(`Device ${device.name} is disconnected.`);
}

//----------------------------------------------------------------------------Gatt Table Buttons--------------------------------------------------------------
function AutoreadData(table_id){
    readDataID(table_id)
    .then(data =>{
        var dataString = dataTOstring(data, gatt_structure[table_id - 1].dataType);
        document.getElementById("readdata" + table_id).innerHTML=dataString;
    })
    .catch(error => {
        log('Argh! ' + error);
    });
}
  
function AutowriteData(table_id){
    let msg = document.querySelector("#writedata" + table_id).value;
    if(msg){
        writeDataID(table_id, stringTOdata(msg , gatt_structure[table_id - 1].dataType))
        .catch(error => {
            log('Argh! ' + error);
        });
    }
    else{
        alert("No Data to write");
    }
}
  
//-----------------------------------------------------------------------------Read-Write GATT-ID-------------------------------------------------------------

function readDataID(table_id){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(gatt_structure[table_id - 1].service_uuid)
            .then(service =>{
                return getCharacteristic(service, gatt_structure[table_id - 1].doubleDetected,table_id);
            })
            .then (characteristic =>{
                log('Reading Value');
                return characteristic.readValue();
            })
            .then (data =>{
                resolve(data);
            })
            .catch(error => {
                log('Argh! ' + error);
            });
        }
        else{
            if(connected){
                alert("The Device is still Connecting please wait");
            }
            else{
                alert("No Device connected");
            }
            reject("Device connection faliure");
        }
    });
}
  
function writeDataID(table_id, data){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(gatt_structure[table_id - 1].service_uuid)
            .then(service =>{
                return getCharacteristic(service, gatt_structure[table_id - 1].doubleDetected,table_id);
            })
            .then(characteristic =>{
                log('Writing Value');
                return characteristic.writeValue(data);;
            })
            .then(_=>{
                resolve("Data-write sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            if(connected){
                alert("The Device is still Connecting please wait");
            }
            else{
                alert("No Device connected");
            }
            reject("Device connection faliure");
        }
    });
}
  

//-----------------------------------------------------------------------------Read-Write characteristic Value-------------------------------------------------------------
function readDataValue(service, characteristic){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(service)
            .then(service =>{
                return service.getCharacteristic(characteristic);
            })
            .then (characteristic =>{
                log('Reading Value');
                return characteristic.readValue();
            })
            .then (data =>{
                resolve(data);
            })
            .catch(error => {
                log('Argh! ' + error);
            });
        }
        else{
            if(connected){
                alert("The Device is still Connecting please wait");
            }
            else{
                alert("No Device connected");
            }
            reject("Device connection faliure");
        }
    });
}

function writeDataVlue(service, characteristic, data){
    return new Promise((resolve ,reject)=>{
        if(serverHnadle){
            serverHnadle.getPrimaryService(service)
            .then(service =>{
                return service.getCharacteristic(characteristic);
            })
            .then(characteristic =>{
                log('Writing Value');
                return characteristic.writeValue(data);;
            })
            .then(_=>{
                resolve("Data-write sucessful");
            })
            .catch(error => {
                log('Argh! ' + error);
                reject(error);
            });
        }
        else{
            if(connected){
                alert("The Device is still Connecting please wait");
            }
            else{
                alert("No Device connected");
            }
            reject("Device connection faliure");
        }
    });
}

//-----------------------------------------------------------------------Utility-------------------------------------------
function getCharacteristic(service, dubbledetected, table_id){
    return new Promise((resolve ,reject)=>{
        if(dubbledetected){
            service.getCharacteristics()
            .then (characteristics =>{
                return characteristics[dubbledetected];
            })
            .then (characteristic =>{
                resolve(characteristic);
            });
        }
        else{
            service.getCharacteristic(gatt_structure[table_id - 1].characteristic_uuid)
            .then (characteristic =>{
                resolve(characteristic);
            });
        }
    });
}

function makeUint8Array(uintNumberValue){
  let Uint8Array = [];
  if(uintNumberValue == 0){
    Uint8Array.push(0);
    return Uint8Array;
  }
  i = 0;
  lenTest = uintNumberValue;
  while(lenTest){
    lenTest = (lenTest >> 8);
    i++;
  }
  for(x = 0; x < i; x++){
    Uint8Array[i-(x+1)] = (uintNumberValue & 0xFF);
    uintNumberValue = (uintNumberValue >> 8);
  }
  return Uint8Array;
}

function addAdditionalServices(services){
    services.forEach(service =>{
        conHandle.optionalServices.push(service);
    })
    return true;
}

function addAdditionalFilters(additionalFilters){
    additionalFilters.forEach(filter =>{
        filterConHandle.filters.push(filter);
    })
}

function dataTOstring(data , dataType){
    let dataString = "<font color=000000>";
    if((dataType.localeCompare("hex")) == 0){
    dataString += "0x";
    for(i = 0; i < data.byteLength; i++){
        if(data.getUint8(i) < 16){
        dataString += "0";
        }
        dataString += data.getUint8(i).toString(16);
    }
    }
    else if((dataType.localeCompare("utf-8")) == 0){
    dataString += "\"";
    for(i = 0; i < data.byteLength; i++){
        dataString += String.fromCharCode(data.getUint8(i));
    }
    dataString += "\"";
    }
    else if((dataType.localeCompare("UInt")) == 0){
    for(i = 0; i < data.byteLength; i++){
        if(data.getUint8(i) < 16){
        dataString += "0";
        }
        dataString += data.getUint8(i).toString(16);
    }
    }
    else{
    for(i = 0; i < data.byteLength; i++){
        if(data.getUint8(i) < 16){
        dataString += "0";
        }
        dataString += data.getUint8(i).toString(16);
    }
    }
    dataString += "</font>";
    return dataString;
}

function stringTOdata(string , Type){
    if((Type.localeCompare("hex")) == 0){
        let numberValue;
        if((string[0] == "0") && (string[1] == "x")){
            numberValue = parseInt(string);
        }
        else{
            numberValue = parseInt("0x" + string);
        }
        return (new Uint8Array(makeUint8Array(numberValue)).buffer);
    }
    else if((Type.localeCompare("utf-8")) == 0){
        let dataArray = [];
        for(i = 0; i < string.length;i++){
            dataArray.push(new TextEncoder("utf-8").encode(string[i]));
        }
        var dataToSend = new Uint8Array(dataArray).buffer;
        return dataToSend;
    }
    else if((Type.localeCompare("UInt")) == 0){
        let numberValue;
        if((string[0] == "0") && (string[1] == "x")){
            numberValue = parseInt(string);
        }
        else{
            numberValue = parseInt("0x" + string);
        }
        return (new Uint8Array(makeUint8Array(numberValue)).buffer);
    }
    else{
        let numberValue;
        if((string[0] == "0") && (string[1] == "x")){
            numberValue = parseInt(string);
        }
        else{
            numberValue = parseInt("0x" + string);
        }
        return (new Uint8Array(makeUint8Array(numberValue)).buffer);
    }
}
//----------------------------------------------------------Console------------------------------------------------------------------------------
var Console = {
    log: function() {
        var line = Array.prototype.slice.call(arguments).map(function(argument) {
            var objDiv = document.getElementById('output');
            objDiv.scrollTop = objDiv.scrollHeight;
            return typeof argument === 'string' ? argument : JSON.stringify(argument);
        }).join(' ');

        document.querySelector('#log').textContent += line + '\n';
    },

    clearLog: function() {
        document.querySelector('#log').textContent = '';
    },

    setStatus: function(status) {
        document.querySelector('#status').textContent = status;
    },

    setContent: function(newContent) {
        var content = document.querySelector('#content');
        while(content.hasChildNodes()) {
            content.removeChild(content.lastChild);
        }
        content.appendChild(newContent);
    }
};

function isWebBluetoothEnabled() {
    if (navigator.bluetooth) {
        return true;
    } else {
        Console.setStatus('Web Bluetooth API is not available.\n' +
            'Please make sure the "Experimental Web Platform features" flag is enabled.');
        return false;
    }
}