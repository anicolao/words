export type GATTDeviceDescriptor = { id: string }
export type GATTServiceDescriptor = GATTDeviceDescriptor & { service: string }
export type GATTCharacteristicDescriptor = GATTServiceDescriptor & { characteristic: string }
export type GATTOperation<T> = { description: string, result: Promise<T> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let queue: Promise<any> = Promise.resolve();
//const pendingOperations: GATTOperation<T>[] = [];
//const completedOperations: GATTOperation<T>[] = [];

export function getDevice(f: GATTDeviceDescriptor): Promise<BluetoothDevice> {
    return navigator.bluetooth.getDevices().then(devices => {
        const device = devices.filter(d => d.id === f.id);
        return device[0];
    });
}

export function getServer(f: GATTDeviceDescriptor): Promise<BluetoothRemoteGATTServer> {
    return getDevice(f).then(device => {
        if (!device.gatt) {
            return Promise<BluetoothRemoteGATTServer>.reject();
        }
        return device.gatt;
    });
}

export function getService(f: GATTServiceDescriptor): Promise<BluetoothRemoteGATTService> {
    return getServer(f).then(server => server.getPrimaryService(f.service));
}

export function getCharacteristic(f: GATTCharacteristicDescriptor): Promise<BluetoothRemoteGATTCharacteristic> {
    return getService(f).then(service => service.getCharacteristic(f.characteristic));
}

export function read(f: GATTCharacteristicDescriptor) {
    return queue.then(() => getCharacteristic(f).then(characteristic => characteristic.readValue()));
}

export function write(f: GATTCharacteristicDescriptor, data: Uint8Array) {
    return queue.then(() => getCharacteristic(f).then(characteristic => characteristic.writeValue(data)));
}