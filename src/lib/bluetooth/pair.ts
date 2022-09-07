export async function pair(): BluetoothRemoteGATTServer {
  let device;
  try {
    device = await navigator.bluetooth.requestDevice( { optionalServices: [ '0000180a-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb' ], acceptAllDevices: true } );
    //device = await navigator.bluetooth.requestDevice( { acceptAllDevices: true } );
  } catch (e) {
    throw new Error(e);
  }
  console.log("Device:", device);

  const server = await device.gatt.connect();
  console.log("Server:", server);

	return server;
}

function getSupportedProperties(characteristic) {
  let supportedProperties = [];
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      supportedProperties.push(p.toUpperCase());
    }
  }
  return '[' + supportedProperties.join(', ') + ']';
}

export async function listKnownDevices(): BluetoothDevice[] {
  const devices = await navigator.bluetooth.getDevices();
  return devices;
}

export async function setupDevices(devices: BluetoothDevice[], connectCallback: any) {
	for (const device of devices) {
		const abortController = new AbortController();
		const log = console.log;
		if (!(device.gatt && device.gatt.connected)) {
			log("listen for ads from ", device);
			device.addEventListener(
				"advertisementreceived",
				() => {
					log("ad: ", device);
					abortController.abort();
					device.gatt.connect()
					.then(
						server => { log('Connected: ', device); 
							connectCallback(device);
							log('Getting Services...');
							return server.getPrimaryServices();
						})
						.then(services => {
							log('Getting Characteristics...');
							let queue = Promise.resolve();
							services.forEach(service => {
								queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
									log('> Service: ' + service.uuid);
									characteristics.forEach(characteristic => {
										log('>> Characteristic: ' + characteristic.uuid + ' ' +
												getSupportedProperties(characteristic));
									});
								}));
							});
							return queue;
						})
						.catch((err) => { log('Error: ', err); });
				},
				{ once: true }
			);
			device.watchAdvertisements({ signal: abortController.signal });
		} else {
			log("Device: ", device.name, " already connected.");
		}
	}
}

export default pair;
