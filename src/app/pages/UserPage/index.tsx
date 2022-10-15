import { Header } from 'app/components/Header';
import { CONTRACT_ADDRESS } from 'app/globals';
import * as React from 'react';
import { useAccount, useContract, useSigner } from 'wagmi';
import contractABI from 'app/contract/contractABI.json';
import merkleChildABI from 'app/contract/merkleChildABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';
import { ethers } from 'ethers';
import { keccak256, parseUnits, solidityKeccak256 } from 'ethers/lib/utils';
import MerkleTree from 'merkletreejs';
import { Buffer } from 'buffer';

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
export function UserPage() {
  const [searchToken, setSearchToken] = React.useState<string>('');
  const [isSearchingForAidrops, setIsSearchingForAidrops] =
    React.useState<boolean>(false);
  const [airdropSerachStatus, setAirdropSerachStatus] =
    React.useState<string>('');

  const [claimableAidrops, setClaimableAidrops] = React.useState<
    ClaimableAidrop[]
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

      const leaves = airdrop.userList.map(x =>
        Buffer.from(
          solidityKeccak256(
            ['address', 'uint256'],
            [x.address, parseUnits(x.amount, decimals)],
          ).slice(2),
          'hex',
        ),
      );
      const amountParsed = parseUnits(airdrop.amount, decimals);
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const proof = tree.getHexProof(
        Buffer.from(
          solidityKeccak256(
            ['address', 'uint256'],
            [address, amountParsed],
          ).slice(2),
          'hex',
        ),
      );
      const airdropContract = new ethers.Contract(
        airdrop.airdrop,
        merkleChildABI,
        signer!,
      );

      const transaction = await airdropContract.claim(amountParsed, proof, {
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

  async function fetchAirdropData(
    airdropId: string,
    tokenAddress: string,
    callback: VoidFunction,
  ) {
    const ipfsUrl = await contract.airdropUserList(airdropId);
    const cid = ipfsUrl.slice(7, ipfsUrl.length);
    const response = await fetch('https://cloudflare-ipfs.com/ipfs/' + cid);
    const usersList = (await response.json()).data;

    const airdropContract = new ethers.Contract(
      airdropId,
      merkleChildABI,
      signer!,
    );

    usersList.forEach(user => {
      if (address === user.address) {
        airdropContract.userClaimed(address).then((hasClaimed: boolean) => {
          if (hasClaimed === false)
            setClaimableAidrops(claimableAidrops => [
              ...claimableAidrops,
              {
                tokenAddress: tokenAddress,
                airdrop: airdropId,
                amount: user.amount,
                userList: usersList,
                status: 'UNCLAIMED',
              },
            ]);
        });
      }
    });
    callback();
  }
  const searchForAirdrops = async () => {
    try {
      if (address === undefined) return alert('Connect your wallet to use');
      const token = searchToken.trim();
      if (token === '') return alert('Enter token');
      setClaimableAidrops([]);
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
          setTimeout(() => {
            setIsSearchingForAidrops(false);
          }, 1000);
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
                  {tokenNames[drop.tokenAddress] ?? '(Token Name Loading)'} -{' '}
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

        <div className="panel">
          <h1>Claim left Tokens from your own Kitties</h1>
          <p>
            {' '}
            <strong>Please Note:</strong> Your left tokens will be split into
            three tranches in order to avoid any dump of the Token. First
            tranche will be available starting from the next day of the AirDrop
            end. The second one three months after and the third one after six
            months. You will have 2 weeks to claim your tokens. <br />{' '}
            <strong>Example:</strong> If for example your AirDrop ends in 31/12,
            in 01/01 you will be able to claim the first tranche of your tokens
            until 15/01. For the second tranche from 01/04 to 15/04 and the last
            one from 01/07 to 15/07.{' '}
          </p>
          <div className="claimList">
            <p>
              <strong>Token Name - Amount - Claimable Until</strong>
            </p>
            <div className="claimPanel">
              AirDrop Token 1 - 210.3 - 06/06
              <div className="button" id="claimButton">
                Claim
              </div>
            </div>
          </div>
          <div className="button" id="claimAll">
            Claim All
          </div>
        </div>
        <p>
          <br />
        </p>
      </div>
    </>
  );
}
