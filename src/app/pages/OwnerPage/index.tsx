import { Header } from 'app/components/Header';
import * as React from 'react';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import contractABI from 'app/contract/contractABI.json';
import merkleChildABI from 'app/contract/merkleChildABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';
import { BigNumber, ethers } from 'ethers';
import { LoaderContext } from 'app';
import { ErrorCode } from '@ethersproject/logger';
import { useContractAddress } from 'app/hooks/useContractAddress';
import { AppWrapper } from 'app/components/AppWrapper/AppWrapper';
import { NULL_ADDRESS } from 'app/globals';

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
}
export function OwnerPage() {
  const { setIsLoading, setLoadingMessage } = React.useContext(LoaderContext);
  const [ownerClaimableAidrops, setOwnerClaimableAidrops] = React.useState<
    OwnerClaimableAidrop[]
  >([]);

  const [tokenNames, setTokenNames] = React.useState<{ [p: string]: string }>(
    {},
  );

  const { address } = useAccount();
  const { data: signer } = useSigner();

  const { chain } = useNetwork();

  const provider = useProvider({ chainId: chain?.id });

  const [contractAddress, isSupportedNetwork] = useContractAddress();

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
      const transaction = await airdropContract.ownerClaim();
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

    let decimals = BigNumber.from(18);
    if (tokenAddress !== NULL_ADDRESS) {
      tokenContract.name().then((tokenName: string) => {
        setTokenNames(names => ({ ...names, [tokenAddress]: tokenName }));
      });
      decimals = await tokenContract.decimals();
    } else {
      setTokenNames(names => ({ ...names, [tokenAddress]: 'ETH' }));
    }

    // Owner Claim

    const _ownerClaimableDrops: OwnerClaimableAidrop[] = [];

    const ownerClaimStatus: boolean = await airdropContract.ownerClaimStatus();

    if (ownerClaimStatus === true) {
      let totalAmount = BigNumber.from(0);

      if (tokenAddress !== NULL_ADDRESS) {
        totalAmount = await tokenContract.balanceOf(airdropId);
      } else {
        totalAmount = await provider.getBalance(airdropId);
      }

      _ownerClaimableDrops.push({
        tokenAddress: tokenAddress,
        airdrop: airdropId,
        amount: ethers.utils.formatUnits(totalAmount, decimals),
        status: 'UNCLAIMED',
      });
    }
    setOwnerClaimableAidrops(drops => [...drops, ..._ownerClaimableDrops]);

    callback();
  }

  const searchForAirdrops = async () => {
    try {
      if (address === undefined) return alert('Connect your wallet to use');

      setOwnerClaimableAidrops([]);
      setIsLoading(true);

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer!,
      );
      const airdropIds: string[] = await contract.getAllAirdrops();

      if (airdropIds.length === 0) {
        throw new SimpleError('No airdrops found');
      }

      let pendingAirdrops = [...airdropIds];
      const airdropFetchComplete = (airdropId: string) => {
        pendingAirdrops = pendingAirdrops.filter(e => e !== airdropId);
        if (pendingAirdrops.length === 0) {
          setIsLoading(false);
        }
      };
      let i = 1;
      for (const airdrop of airdropIds) {
        setLoadingMessage(`Checking airdrops ${i}/${airdropIds.length}`);
        await fetchAirdropData(airdrop, () => airdropFetchComplete(airdrop));
        await new Promise(resolve => setTimeout(resolve, 1000));
        i++;
      }
      setLoadingMessage(undefined);
    } catch (e: any) {
      setLoadingMessage(undefined);
      const code = e.code;
      if (code !== undefined && Object.keys(ErrorCode).includes(code)) {
        alert(e.reason ?? e.message);
      } else {
        alert('Some error occured! Check console for mor details.');
      }
      console.error(e);
    }
  };

  React.useEffect(() => {
    console.log(provider.network.chainId);
    provider
      .getBalance('0x45CD2d4E56Ac672c4747cf62b1538afbd02bcb91')
      .then(e => console.log(e));
  }, []);

  return (
    <>
      <Header />

      <AppWrapper address={address} isSupportedNetwork={isSupportedNetwork}>
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
      </AppWrapper>
    </>
  );
}
