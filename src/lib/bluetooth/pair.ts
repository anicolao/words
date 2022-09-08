/* eslint-disable @typescript-eslint/no-explicit-any */
export async function pair(): Promise<BluetoothRemoteGATTServer> {
	const device = await navigator.bluetooth.requestDevice({
		optionalServices: [
			'0000180a-0000-1000-8000-00805f9b34fb',
			'0000fff0-0000-1000-8000-00805f9b34fb'
		],
		acceptAllDevices: true
	});
	console.log('Device:', device);

	if (!device.gatt) {
		throw new Error('Device not valid');
	}
	const server = await device.gatt.connect();
	console.log('Server:', server);

	return server;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSupportedProperties(_characteristic: BluetoothRemoteGATTCharacteristic) {
	const supportedProperties: string[] = [];
	/*
	for (const p in characteristic.properties) {
		if (characteristic.properties[p] as boolean === true) {
			supportedProperties.push(p.toUpperCase());
		}
	}
	*/
	return '[' + supportedProperties.join(', ') + ']';
}

export async function listKnownDevices(): Promise<BluetoothDevice[]> {
	const devices = await navigator.bluetooth.getDevices();
	return devices;
}

export async function setupDevices(devices: BluetoothDevice[], connectCallback: any) {
	for (const device of devices) {
		const abortController = new AbortController();
		const log = console.log;
		if (!(device.gatt && device.gatt.connected)) {
			log('listen for ads from ', device);
			device.addEventListener(
				'advertisementreceived',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(): any => {
					log('ad: ', device);
					if (!device.gatt) {
						log('ignoring erroneous connect');
						return;
					}
					abortController.abort();
					device.gatt
						.connect()
						.then((server) => {
							log('Connected: ', device);
							connectCallback(device);
							log('Getting Services...');
							return server.getPrimaryServices();
						})
						.then((services) => {
							log('Getting Characteristics...');
							let queue = Promise.resolve();
							services.forEach((service) => {
								queue = queue.then(() =>
									service.getCharacteristics().then((characteristics) => {
										log('> Service: ' + service.uuid);
										characteristics.forEach((characteristic) => {
											log(
												'>> Characteristic: ' +
													characteristic.uuid +
													' ' +
													getSupportedProperties(characteristic)
											);
										});
									})
								);
							});
							return queue;
						})
						.catch((err) => {
							log('Error: ', err);
						});
				},
				true
			);
			device.watchAdvertisements({ signal: abortController.signal });
		} else {
			log('Device: ', device.name, ' already connected.');
		}
	}
}

export default pair;
