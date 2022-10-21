import { Header } from 'app/components/Header';
import { CONTRACT_ADDRESS } from 'app/globals';
import * as React from 'react';
import { useAccount, useContract, useSigner } from 'wagmi';
import contractABI from 'app/contract/contractABI.json';
import merkleChildABI from 'app/contract/merkleChildABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';
import { parseUnits } from 'ethers/lib/utils';
import { createLeaf, createMerkleTree } from 'app/merkleTree';
import { BigNumber, ethers } from 'ethers';
import { child, get, ref } from 'firebase/database';
import { database } from 'app/firebase';

class SimpleError extends Error {
  message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
}
interface ClaimableAidrop {
  tokenAddress: string;
  airdrop: string;
  amount: string;
  userList: {
    address: string;
    amount: string;
  }[];
  status: 'UNCLAIMED' | 'CLAIMING' | 'CLAIMED';
}

interface CreatorClaimableAidrop {
  tokenAddress: string;
  airdrop: string;
  amount: string;
  status: 'UNCLAIMED' | 'CLAIMING' | 'CLAIMED';
  roundId: number;
}
export function UserPage() {
  const [searchToken, setSearchToken] = React.useState<string>('');
  const [isSearchingForAidrops, setIsSearchingForAidrops] =
    React.useState<boolean>(false);
  const [airdropSerachStatus, setAirdropSerachStatus] =
    React.useState<string>('');

  const [claimableAidrops, setClaimableAidrops] = React.useState<
    ClaimableAidrop[]
  >([]);
  const [creatorClaimableAidrops, setCreatorClaimableAidrops] = React.useState<
    CreatorClaimableAidrop[]
  >([]);

  const [tokenNames, setTokenNames] = React.useState<{ [p: string]: string }>(
    {},
  );

  const { address } = useAccount();
  const { data: signer } = useSigner();

  const contract = useContract({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractABI,
    signerOrProvider: signer,
  });

  async function creatorClaim(index: number) {
    try {
      const airdrop = creatorClaimableAidrops[index];
      setCreatorClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMING';
        return [...airdrops];
      });
      const airdropContract = new ethers.Contract(
        airdrop.airdrop,
        merkleChildABI,
        signer!,
      );
      const transaction = await airdropContract.creatorClaim(airdrop.roundId, {
        gasLimit: 2000000,
      });
      const response = await transaction.wait();
      setClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMED';
        return [...airdrops];
      });
    } catch (e) {
      alert('Some error occured');
      console.error(e);
      setClaimableAidrops(airdrops => {
        airdrops[index].status = 'UNCLAIMED';
        return [...airdrops];
      });
    }
  }

  async function claimAirdrop(index: number) {
    try {
      const airdrop = claimableAidrops[index];
      setClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMING';
        return [...airdrops];
      });
      const tokenContract = new ethers.Contract(
        airdrop.tokenAddress,
        erc20ABI,
        signer!,
      );
      const decimals = await tokenContract.decimals();
      const tree = createMerkleTree(
        airdrop.userList.map(x => createLeaf(x.address, x.amount, decimals)),
      );

      const proof = tree.getHexProof(
        createLeaf(address!, airdrop.amount, decimals),
      );
      const airdropContract = new ethers.Contract(
        airdrop.airdrop,
        merkleChildABI,
        signer!,
      );

      const claimFee = await contract.claimFee();
      const transaction = await airdropContract.claim(
        parseUnits(airdrop.amount, decimals),
        proof,
        {
          value: claimFee,
          gasLimit: 2000000,
        },
      );
      const response = await transaction.wait();
      setClaimableAidrops(airdrops => {
        airdrops[index].status = 'CLAIMED';
        return [...airdrops];
      });
    } catch (e) {
      alert('Some error occured');
      console.error(e);
      setClaimableAidrops(airdrops => {
        airdrops[index].status = 'UNCLAIMED';
        return [...airdrops];
      });
    }
  }

  async function fetchAirdropData(
    airdropId: string,
    tokenAddress: string,
    callback: VoidFunction,
  ) {
    const airdropUuid = await contract.airdropUserList(airdropId);
    const dbRef = ref(database);
    const usersList = (
      await get(child(dbRef, `airdrops/${airdropUuid}`))
    ).val();

    const airdropContract = new ethers.Contract(
      airdropId,
      merkleChildABI,
      signer!,
    );

    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer!);
    const decimals = await tokenContract.decimals();

    // User Claim
    const _userClaimableDrops: ClaimableAidrop[] = [];
    usersList.forEach(async user => {
      if (address !== user.address) return;
      const canUserClaim = await airdropContract.userClaimStatus(address);
      if (canUserClaim) {
        _userClaimableDrops.push({
          tokenAddress: tokenAddress,
          airdrop: airdropId,
          amount: user.amount,
          userList: usersList,
          status: 'UNCLAIMED',
        });
      }
    });

    // Creator Claim
    const creatorClaimStatus: boolean[] =
      await airdropContract.creatorClaimStatus();
    const roundId = creatorClaimStatus.indexOf(true);
    const _creatorClaimableDrops: CreatorClaimableAidrop[] = [];

    if (roundId >= 0) {
      let totalAmount: BigNumber = await airdropContract.nonClaimedFunds();
      if (totalAmount.isZero()) {
        totalAmount = await tokenContract.balanceOf(airdropId);
      }
      const amount = totalAmount.div(4);
      _creatorClaimableDrops.push({
        tokenAddress: tokenAddress,
        airdrop: airdropId,
        amount: ethers.utils.formatUnits(amount, decimals),
        status: 'UNCLAIMED',
        roundId: roundId,
      });
    }

    setClaimableAidrops(drops => [...drops, ..._userClaimableDrops]);
    setCreatorClaimableAidrops(drops => [...drops, ..._creatorClaimableDrops]);

    callback();
  }
  const searchForAirdrops = async () => {
    try {
      if (address === undefined) return alert('Connect your wallet to use');
      const token = searchToken.trim();
      if (token === '') return alert('Enter token');
      setClaimableAidrops([]);
      setCreatorClaimableAidrops([]);
      setIsSearchingForAidrops(true);
      setAirdropSerachStatus('Searching...');

      const aidropIds: string[] = await contract.getAllTokenAirdrops(token);
      if (aidropIds.length === 0) {
        throw new SimpleError('No airdrops found');
      }

      const tokenContract = new ethers.Contract(token, erc20ABI, signer!);
      tokenContract.name().then((tokenName: string) => {
        setTokenNames(names => ({ ...names, [token]: tokenName }));
      });

      let pendingAirdrops = [...aidropIds];
      setAirdropSerachStatus('Fetching details...');
      const airdropFetchComplete = (airdropId: string) => {
        pendingAirdrops = pendingAirdrops.filter(e => e !== airdropId);
        if (pendingAirdrops.length === 0) {
          setIsSearchingForAidrops(false);
        }
      };
      aidropIds.forEach(airdrop =>
        fetchAirdropData(airdrop, token, () => airdropFetchComplete(airdrop)),
      );
    } catch (e) {
      console.log(e);
      setIsSearchingForAidrops(false);
      setAirdropSerachStatus('');
      if (e instanceof SimpleError) {
        return alert(e.message);
      }
      return alert('Some error occured. Make sure the token address is valid');
    }
  };

  return (
    <>
      <Header />
      <div className="container" style={{ bottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <a href="/app">Create Airdrop</a>
          <a href="/user">[Collect Airdrop]</a>
        </div>
        <br />
        <div className="panel">
          <h1>
            Welcome to ClaimKitty. <br />
            Let's see all Kitties claimable!
          </h1>
          <input
            className="form"
            type="text"
            name="searchAirdrop"
            placeholder="Insert Here Token Address to claim"
            value={searchToken}
            onChange={e => setSearchToken(e.target.value.trim())}
          />
          {!isSearchingForAidrops ? (
            <div className="button" id="claimAll" onClick={searchForAirdrops}>
              Search Token
            </div>
          ) : (
            <>
              <div style={{ margin: '10px 0' }}>{airdropSerachStatus}</div>
            </>
          )}
          {claimableAidrops.length > 0 && (
            <div className="claimList" style={{ marginTop: 20 }}>
              {claimableAidrops.map((drop, index) => (
                <div className="claimPanel" key={'drop' + index}>
                  {tokenNames[drop.tokenAddress] ?? drop.tokenAddress} -{' '}
                  {drop.amount}{' '}
                  {drop.status === 'UNCLAIMED' && (
                    <div
                      className="button"
                      id="claimButton"
                      onClick={() => {
                        claimAirdrop(index);
                      }}
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
        </div>

        {creatorClaimableAidrops.length > 0 && (
          <div className="panel">
            <h1>Claim left Tokens from your own Kitties</h1>
            <p>
              {' '}
              <strong>Please Note:</strong> Your left tokens will be split into
              three tranches in order to avoid any dump of the Token. First
              tranche will be available starting from the next day of the
              AirDrop end. The second one three months after and the third one
              after six months. You will have 2 weeks to claim your tokens.{' '}
              <br /> <strong>Example:</strong> If for example your AirDrop ends
              in 31/12, in 01/01 you will be able to claim the first tranche of
              your tokens until 15/01. For the second tranche from 01/04 to
              15/04 and the last one from 01/07 to 15/07.{' '}
            </p>
            <>
              <div className="claimList">
                <p>
                  <b>Token Name - Amount</b>
                </p>
                {creatorClaimableAidrops.map((drop, index) => (
                  <div className="claimPanel" key={'drop-creator-' + index}>
                    {tokenNames[drop.tokenAddress] ?? drop.tokenAddress}
                    {' - '}
                    {drop.amount}
                    {drop.status === 'UNCLAIMED' && (
                      <div
                        className="button"
                        id="claimButton"
                        onClick={() => creatorClaim(index)}
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
              <div
                className="button"
                id="claimAll"
                onClick={() => {
                  creatorClaimableAidrops.forEach((drop, index) =>
                    creatorClaim(index),
                  );
                }}
              >
                Claim All
              </div>
            </>
          </div>
        )}
        <p>
          <br />
        </p>
      </div>
    </>
  );
}
