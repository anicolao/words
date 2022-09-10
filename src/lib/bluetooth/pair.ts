type CCType = (d: BluetoothDevice) => void;
export async function pair(connectCallback: CCType): Promise<BluetoothRemoteGATTServer> {
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
	connect(device, connectCallback);

	return device.gatt;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSupportedProperties(characteristic: BluetoothRemoteGATTCharacteristic) {
	const supportedProperties: string[] = [];
	for (const p in characteristic.properties) {
		if ((characteristic.properties as unknown as { [key: string]: boolean })[p] === true) {
			supportedProperties.push(p.toUpperCase());
		}
	}
	return '[' + supportedProperties.join(', ') + ']';
}

export async function listKnownDevices(): Promise<BluetoothDevice[]> {
	const devices = await navigator.bluetooth.getDevices();
	return devices;
}

export async function setupDevices(devices: BluetoothDevice[], connectCallback: CCType) {
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
					abortController.abort();
					connect(device, connectCallback);
				},
				true
			);
			device.watchAdvertisements({ signal: abortController.signal });
		} else {
			log('Device: ', device.name, ' already connected.');
		}
	}
}
function connect(device: BluetoothDevice, connectCallback: CCType) {
	const log = console.log;
	if (!device.gatt) {
		log('ignoring erroneous connect');
		return;
	}
	device.gatt
		.connect()
		.then((server) => {
			log('Connected: ', device);
			connectCallback && connectCallback(device);
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
}

export default pair;
