var serverOTA;
var serviceOTA;

var appLoadVer;
var otaVer;
var gekoVer;
var appVer;
var characteristicData;
var done = false;
var deviceName = false;


//var additionalServices = [];
//var additionalFilters = []
function init() {
  initBluetoothLib("gatt_configuration.xml", null, null);
  showConsole("consoleID")
}
window.onload = init();

function setUpdateMode(){
  navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0x1800, 0x1801, 0x2800, 0x2803, '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0']
  })
  .then(device => {
    device.addEventListener('gattserverdisconnected', setOTADisconnect);
    return device.gatt.connect();
  })
  .then(server => {
      return server.getPrimaryService('1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0');
  })
  .then(service => {
    return service.getCharacteristic('f7bf3564-fb6d-4e53-88a4-5e37e0326063')
  })
  .then(characteristic => {
    return characteristic.writeValue(Uint8Array.of(0x01));
  })
  .catch(error => {
    log('Argh! ' + error); 
  });
}

function setOTADisconnect(event){
  const device = event.target;
  log(`Device ${device.name} has been set to OTA-Mode`);
  deviceName = device.name;
  window.location = "update.html"
}

window.onbeforeunload = function() {
  localStorage.setItem(console, deviceName);
}

window.onload = function() {
  if (localStorage.getItem(console)){
    data = localStorage.getItem(console);
    if (data != "false"){
      setpreLog(`Device ${localStorage.getItem(console)} has been set to OTA-Mode`)
    }
  }
}

function connectOTADevice(){
  var deviceN = "";
  navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      //filters: [{namePrefix: "OTA"}],
      optionalServices: [0x1800, 0x1801, 0x2800, 0x2803, '1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0']
    })
    .then(device => {
        device.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
    // Getting OTA-Service
        serverOTA = server;
        return server.getPrimaryService('1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0');
    })
    .then(service => {
    // Getting AppLoader version (2) (Blue-tooth stack version) (2,3) Characteristic…
        serviceOTA = service;
        return service.getCharacteristic('4f4a2368-8cca-451e-bfff-cf0e2ee23e9f');
    })
    .then(characteristic => {
    // Reading AppLoader version (2) (Blue-tooth stack version) (2,3)
        characteristic.readValue()
        .then(value => {
            console.dir(value);
            appLoadVer = (256*value.getUint8(1)+value.getUint8(0));
            appLoadVer += ".";
            appLoadVer += (256*value.getUint8(3)+value.getUint8(2));
            appLoadVer += ".";
            appLoadVer += (256*value.getUint8(5)+value.getUint8(4));
            appLoadVer += "-";
            appLoadVer += (256*value.getUint8(7)+value.getUint8(6));
            document.getElementById("device.appLoadVer").innerHTML=appLoadVer;
        })
    })
    .then(_ => {
        return serviceOTA.getCharacteristic('4cc07bcf-0868-4b32-9dad-ba4cc41e5316');
    })
    .then(characteristic => {
    // Reading OTA version
        characteristic.readValue()
        .then(value => {
            if(value.getUint8(0) == 3){
                otaVer = "2.7.0";
            }
            else{
                otaVer = "Unkown";
            }
            document.getElementById("device.otaVer").innerHTML=otaVer;
        })
    })
    .then(_ => {
        return serviceOTA.getCharacteristic('25f05c0a-e917-46e9-b2a5-aa2be1245afe');
    })
    .then(characteristic => {
    // Reading Bootloader version
        characteristic.readValue()
        .then(value => {
            gekoVer = value.getUint8(3);
            gekoVer += ".";
            gekoVer += value.getUint8(2);
            gekoVer += "    0x";
            if (value.getUint8(0) < 16){
            gekoVer += "0"; 
            }
            gekoVer += value.getUint8(1).toString(16);
            if (value.getUint8(1) < 16){
            gekoVer += "0"; 
            }
            gekoVer += value.getUint8(0).toString(16);

            document.getElementById("device.gekoVer").innerHTML=gekoVer;
        })
    })
    .then(_ => {
        return serviceOTA.getCharacteristic('0d77cc11-4ac1-49f2-bfa9-cd96ac7a92f8');
    })
    .then(characteristic => {
    // Reading App version
        characteristic.readValue()
        .then(value => {
            var appVer = "    0x";
            if (value.getUint8(3) < 16){
            appVer += "0"; 
            }
            appVer += value.getUint8(3).toString(16);
            if (value.getUint8(2) < 16){
            appVer += "0"; 
            }
            appVer += value.getUint8(2).toString(16);
            if (value.getUint8(1) < 16){
            appVer += "0"; 
            }
            appVer += value.getUint8(1).toString(16);
            if (value.getUint8(0) < 16){
            appVer += "0"; 
            }
            appVer += value.getUint8(0).toString(16);

            document.getElementById("device.appVer").innerHTML=appVer;
        })
    })
    .then(_ => {
    // Getting Gernaral-acess Service
    return serverOTA.getPrimaryService(0x1800);
    })
    .then(service => {
        return service.getCharacteristic(0x2a00);
    })
    .then(characteristic => {
    // Reading device name
        characteristic.readValue()
        .then(value => {
            for (var i = 0; i < value.byteLength ;i++){
                deviceN += String.fromCharCode(value.getUint8(i));
            }
            document.getElementById("device.name").innerHTML=deviceN;
        })
        
    })
.catch(error => {
    log('Argh! ' + error);
});
}

function onDisconnected(event) {
  const device = event.target;
  if (done){
    log('Update sucessfull');
  }
  log(`Device ${device.name} is disconnected.`);
}

function updateOta(){
  var updateFile = document.getElementById('files').files[0];
  if (!updateFile) {
      alert('Please select a file!');
      return;
  }
  if (!otaVer){
        alert('No OTA-Service detected!');
        return;
  }

  var packageArray;
  var packages = 0;
  makePackages(updateFile, 244)
  .then(DDArray =>{
    packageArray = DDArray;
    packages = DDArray.length;
  })
  var nOfPachage = 1;
  prepareOTA()
  .then(services => {
    log('Sending Data');
    let queue = Promise.resolve();
    packageArray.forEach(data => {
      console.dir(data);
      queue = queue.then(_ => characteristicData.writeValue(data).then(characteristics => {
        log(`${nOfPachage} Packages of ${packages} Packages sent. => ${(100*nOfPachage++/packages).toFixed(1)}%`);
      }));
    });
    return queue;
  })
  .then(_ =>{
    return characteristicCtl.writeValue(Uint8Array.of(3));
  })
  .then(_ =>{
    done = true;
    return characteristicCtl.writeValue(Uint8Array.of(4));
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function prepareOTA(){
  return new Promise ((resolve, reject) =>{
  serviceOTA.getCharacteristic('f7bf3564-fb6d-4e53-88a4-5e37e0326063')
    .then(characteristic => {
    // Start Update
        characteristicCtl = characteristic;
        return characteristicCtl.writeValue(Uint8Array.of(0));
    })
    .then(_ => {
        return serviceOTA.getCharacteristic('984227f3-34fc-4045-a5d0-2c581f81a153');
    })
    .then(characteristic => {
    // Set Data Charakteristikhandle
        characteristicData = characteristic;
        resolve()
    })
    .catch(error => {
        log('Argh! ' + error);
        reject()
    });
  })
}

function sendPackage(package, characteristic){
  return new Promise ((resolve, reject) =>{
    characteristic.writeValue(package)
    .then (_ => {
      resolve()
    })
    .catch(error => {
      console.log('Argh! ' + error);
      reject()
    });
  })
}

function makePackages(file, pSize){
  return new Promise ((resolve, reject) =>{
    var start = 0;
    var end = file.size;
    var stop = pSize;
    var packages = 0;
    while (stop < end){
      packages++;
      stop += pSize;
    }
    if (stop >= end){
      packages++;
    }
    var dataPackages = [];
    stop = pSize;
    var blob = file.slice(start, stop);
    var i = 0;
    for (i = 0 ; i < packages; ++i){
      blob.arrayBuffer(blob) 
      .then (data =>{
        dataPackages.push(data);
        if (dataPackages.length == packages){
          resolve(dataPackages)
        }
      });
      start = stop;
      stop = start+pSize;
      if (stop < end){
        blob = file.slice(start, stop);
      }
      else{
        blob = file.slice(start, end);
      }
    }
  })
}