import { keccak256, parseUnits, solidityKeccak256 } from 'ethers/lib/utils';
import MerkleTree from 'merkletreejs';
import { Buffer } from 'buffer';

export function createLeaf(address: string, amount: string, decimals: number) {
  return Buffer.from(
    solidityKeccak256(
      ['address', 'uint256'],
      [address, parseUnits(amount, decimals)],
    ).slice(2),
    'hex',
  );
}

export function createMerkleTree(leaves: Buffer[]) {
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}
