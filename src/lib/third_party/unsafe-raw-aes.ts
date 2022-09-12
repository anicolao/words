const blockSize = 16;
const zeros = new Uint8Array(blockSize);
const paddingBlockPlaintext = new Uint8Array(
  new Array(blockSize).fill(blockSize),
);
const AES_CBC = "AES-CBC";

export async function importKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", keyBytes, AES_CBC, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function unsafeEncryptBlockWithIV(
  key: CryptoKey,
  plaintextBlock: ArrayBuffer,
  iv: ArrayBuffer,
): Promise<ArrayBuffer> {
  const cryptoResult: ArrayBuffer = await crypto.subtle.encrypt(
    {
      name: AES_CBC,
      iv,
    },
    key,
    plaintextBlock,
  );
  return cryptoResult.slice(0, blockSize);
}

export async function unsafeEncryptBlock(
  key: CryptoKey,
  plaintextBlock: ArrayBuffer,
): Promise<ArrayBuffer> {
  return (await unsafeEncryptBlockWithIV(key, plaintextBlock, zeros)).slice(
    0,
    blockSize,
  );
}

export async function unsafeDecryptBlock(
  key: CryptoKey,
  ciphertextBlock: ArrayBuffer,
): Promise<ArrayBuffer> {
  const paddingBlock = await unsafeEncryptBlockWithIV(
    key,
    paddingBlockPlaintext,
    ciphertextBlock,
  );

  const cbcCiphertext = new Uint8Array(2 * blockSize);
  cbcCiphertext.set(new Uint8Array(ciphertextBlock), 0);
  cbcCiphertext.set(new Uint8Array(paddingBlock), blockSize);

  const cryptoResult: ArrayBuffer = await crypto.subtle.decrypt(
    {
      name: AES_CBC,
      iv: zeros,
    },
    key,
    cbcCiphertext,
  );
  return cryptoResult.slice(0, blockSize);
}
