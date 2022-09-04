export async function pair(): BluetoothRemoteGATTServer {
  let device;
  try {
    device = await navigator.bluetooth.requestDevice( { acceptAllDevices: true } );
  } catch (e) {
    throw new Error(e);
  }
  console.log("Device:", device);

  const server = await device.gatt.connect();
  console.log("Server:", server);

	return server;
}

export default pair;
