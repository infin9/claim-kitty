import { Header } from 'app/components/Header';
import { CONTRACT_ADDRESS } from 'app/globals';
import * as React from 'react';
import { useAccount, useContract, useSigner } from 'wagmi';
import contractABI from 'app/contract/contractABI.json';
import merkleChildABI from 'app/contract/merkleChildABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';
import { BigNumber, ethers } from 'ethers';
import { LoaderContext } from 'app';

class SimpleError extends Error {
  message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}
interface OwnerClaimableAidrop {
  tokenAddress: string;
  airdrop: string;
  amount: string;
  status: 'UNCLAIMED' | 'CLAIMING' | 'CLAIMED';
  roundId: number;
}
export function OwnerPage() {
  const { setIsLoading } = React.useContext(LoaderContext);
  const [ownerClaimableAidrops, setOwnerClaimableAidrops] = React.useState<
    OwnerClaimableAidrop[]
  >([]);

  const [tokenNames, setTokenNames] = React.useState<{ [p: string]: string }>(
    {},
  );

  const { address } = useAccount();
  const { data: signer } = useSigner();

  async function ownerClaim(index: number) {
    try {
      const airdrop = ownerClaimableAidrops[index];
      setOwnerClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMING';
        return [...airdrops];
      });
      const airdropContract = new ethers.Contract(
        airdrop.airdrop,
        merkleChildABI,
        signer!,
      );
      const transaction = await airdropContract.ownerClaim(airdrop.roundId, {
        gasLimit: 2000000,
      });
      const response = await transaction.wait();
      setOwnerClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMED';
        return [...airdrops];
      });
    } catch (e) {
      alert('Some error occured');
      console.error(e);
      setOwnerClaimableAidrops(airdrops => {
        airdrops[index].status = 'UNCLAIMED';
        return [...airdrops];
      });
    }
  }

  async function fetchAirdropData(airdropId: string, callback: VoidFunction) {
    const airdropContract = new ethers.Contract(
      airdropId,
      merkleChildABI,
      signer!,
    );

    const tokenAddress = await airdropContract.token();
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer!);
    tokenContract.name().then((tokenName: string) => {
      setTokenNames(names => ({ ...names, [tokenAddress]: tokenName }));
    });

    const decimals = await tokenContract.decimals();

    // Owner Claim

    const _ownerClaimableDrops: OwnerClaimableAidrop[] = [];

    const ownerClaimStatus: boolean[] =
      await airdropContract.ownerClaimStatus();

    let totalAmount: BigNumber = await airdropContract.nonClaimedFunds();
    if (totalAmount.isZero()) {
      totalAmount = await tokenContract.balanceOf(airdropId);
    }
    const amount = totalAmount.div(4);

    ownerClaimStatus.forEach(async (status, roundId) => {
      if (status === false) return;
      _ownerClaimableDrops.push({
        tokenAddress: tokenAddress,
        airdrop: airdropId,
        amount: ethers.utils.formatUnits(amount, decimals),
        status: 'UNCLAIMED',
        roundId: roundId,
      });
    });
    setOwnerClaimableAidrops(drops => [...drops, ..._ownerClaimableDrops]);

    callback();
  }

  const searchForAirdrops = async () => {
    try {
      if (address === undefined) return alert('Connect your wallet to use');

      setOwnerClaimableAidrops([]);
      setIsLoading(true);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer!,
      );
      const aidropIds: string[] = await contract.getAllAirdrops();

      if (aidropIds.length === 0) {
        throw new SimpleError('No airdrops found');
      }

      let pendingAirdrops = [...aidropIds];
      const airdropFetchComplete = (airdropId: string) => {
        pendingAirdrops = pendingAirdrops.filter(e => e !== airdropId);
        if (pendingAirdrops.length === 0) {
          setIsLoading(false);
        }
      };
      aidropIds.forEach(airdrop =>
        fetchAirdropData(airdrop, () => airdropFetchComplete(airdrop)),
      );
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      if (e instanceof SimpleError) {
        return alert(e.message);
      }
      return alert('Some error occured.');
    }
  };

  return (
    <>
      <Header />
      <div className="container" style={{ bottom: 30 }}>
        <div className="panel">
          <h1>List of All AirDrops claimable</h1>
          {ownerClaimableAidrops.length > 0 && (
            <div className="claimList" style={{ maxHeight: 1000 }}>
              <p>
                <strong>Token Name - Amount</strong>
              </p>
              {ownerClaimableAidrops.map((drop, index) => (
                <div className="claimPanel" key={'drop--w' + index}>
                  {tokenNames[drop.tokenAddress] ?? drop.tokenAddress}
                  {' - '}
                  {drop.amount}
                  {drop.status === 'UNCLAIMED' && (
                    <div
                      className="button"
                      id="claimButton"
                      onClick={() => ownerClaim(index)}
                    >
                      Claim
                    </div>
                  )}
                  {drop.status === 'CLAIMING' && (
                    <span style={{ float: 'right' }}>CLAIMING...</span>
                  )}
                  {drop.status === 'CLAIMED' && (
                    <span style={{ float: 'right' }}>CLAIMED</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <br />
          <div
            className="button"
            id="claimButton"
            onClick={() => searchForAirdrops()}
            style={{ position: 'initial' }}
          >
            Search For Airdrops
          </div>
        </div>
      </div>
    </>
  );
}
