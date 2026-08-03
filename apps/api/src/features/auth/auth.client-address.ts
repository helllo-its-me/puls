import { isIP } from 'node:net';

const unavailableClientAddress = 'unavailable';

function getForwardedAddresses(forwardedForHeader: string | undefined): string[] {
  if (!forwardedForHeader) {
    return [];
  }

  return forwardedForHeader
    .split(',')
    .map((address) => address.trim())
    .filter((address) => isIP(address) !== 0);
}

export function resolveAuthClientAddress(input: {
  directAddress: string | undefined;
  forwardedForHeader: string | undefined;
  trustedProxyHops: number;
}): string {
  const directAddress = input.directAddress && isIP(input.directAddress) !== 0
    ? input.directAddress
    : unavailableClientAddress;

  if (input.trustedProxyHops === 0) {
    return directAddress;
  }

  const addressChain = [
    ...getForwardedAddresses(input.forwardedForHeader),
    directAddress
  ];
  const clientAddressIndex = addressChain.length - input.trustedProxyHops - 1;

  return addressChain[clientAddressIndex] ?? directAddress;
}
