import { SUPPORTED_CHAINS } from 'app/chains';
import { NULL_ADDRESS } from 'app/globals';
import { useNetwork } from 'wagmi';

export function useContractAddress(): [string, boolean] {
  const { chain } = useNetwork();
  const supportedChain = SUPPORTED_CHAINS.find(
    c => c.chain.id === (chain?.id ?? -999999999),
  );
  if (supportedChain !== undefined)
    return [supportedChain.contractAddress, true];
  return [NULL_ADDRESS, false];
}
