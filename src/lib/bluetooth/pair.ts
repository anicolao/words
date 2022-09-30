type CCType = (d: BluetoothDevice) => void;

export async function pair(connectCallback: CCType): Promise<BluetoothRemoteGATTServer> {
	const device = await navigator.bluetooth.requestDevice({
		optionalServices: [
			'0000180a-0000-1000-8000-00805f9b34fb',
			'0000fff0-0000-1000-8000-00805f9b34fb',
			'6e400001-b5a3-f393-e0a9-e50e24dc4179'
		],
		filters: [{ namePrefix: 'GAN' }, { namePrefix: 'MG' }]
	});
	console.log('Device:', device);

	if (!device.gatt) {
		throw new Error('Device not valid');
	}
	connect(device, connectCallback);

	return device.gatt;
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
				(event): any => {
					log('ad: ', device);
					abortController.abort();
					connect(device, connectCallback);
					log({ md: event.manufacturerData });
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
	log('Device connected: ', device);
	device.gatt
		.connect()
		.then((server) => {
			connectCallback && connectCallback(device);
			return server.getPrimaryServices();
		})
		.catch((err) => {
			log('Error: ', err);
			throw err;
		});
}

export default pair;
