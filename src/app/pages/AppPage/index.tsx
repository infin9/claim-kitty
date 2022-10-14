import { Header } from 'app/components/Header';
import { BigNumber, ethers, FixedNumber } from 'ethers';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useContract, useSigner } from 'wagmi';

import contractABI from 'app/contract/contractABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';
import { PinataService } from 'app/services/PinataService';

import { MerkleTree } from 'merkletreejs';
import { LoaderContext } from 'app';
import { keccak256, parseUnits, solidityKeccak256 } from 'ethers/lib/utils';
import { Buffer } from 'buffer';

const CONTRACT_ADDRESS = '0x770e8c34ab8392a24f78280463a7a73210ff2633';
const WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
const MAX_APPROVE_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

type CSVItem = {
  address: string;
  amount: string;
};

export function AppPage() {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const contract = useContract({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: contractABI,
    signerOrProvider: signer,
  });

  const { setIsLoading } = React.useContext(LoaderContext);

  const [tokenAddress, setTokenAddress] = React.useState<string>('');
  const [csvData, setCsvData] = React.useState<CSVItem[] | undefined>(
    undefined,
  );
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());

  const [isFeesInWETH, setIsFeesInWETH] = React.useState<boolean>(false);

  function handleCSVUpdate(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const data = reader.result as string;
      try {
        const rows = data.split('\n');

        const _csvData: CSVItem[] = [];
        rows.forEach(row => {
          const rowData = row.split(',');
          if (!rowData[0].startsWith('0x')) return;
          try {
            Number.parseFloat(rowData[1].trim());
            _csvData.push({
              address: rowData[0].trim(),
              amount: rowData[1].trim(),
            });
          } catch (e) {}
        });
        setCsvData(_csvData);
      } catch (e) {
        alert('Error wail parsing CSV');
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!address) return alert('No wallet connected');

    if (!tokenAddress) return alert('Enter token address');
    if (!csvData) return alert('Upload a valid csv file');

    setIsLoading(true);

    const isPayingToken = isFeesInWETH === true;

    const jsonData = { data: csvData };
    const cid = await PinataService.pinToIPFS(jsonData);

    const ipfsUrl = 'ipfs://' + cid;

    const _startTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0,
      0,
      0,
    );
    const _endTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
    );
    const startDateUnix = Math.floor(_startTime.getTime() / 1000);
    const endDateUnix = Math.floor(_endTime.getTime() / 1000);

    // Approve Token
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer!);
    const decimals = await tokenContract.decimals();

    const totalAmount = Object.values(csvData).reduce(
      (previous, current) =>
        previous.add(
          ethers.utils.parseUnits(current.amount.toString(), decimals),
        ),
      BigNumber.from(0),
    );

    const tokenApprovalTransaction = await tokenContract.approve(
      CONTRACT_ADDRESS,
      MAX_APPROVE_AMOUNT,
      {
        gasLimit: 2000000,
      },
    );

    await tokenApprovalTransaction.wait();

    const leaves = csvData.map(x =>
      Buffer.from(
        solidityKeccak256(
          ['address', 'uint256'],
          [x.address, parseUnits(x.amount, decimals)],
        ).slice(2),
        'hex',
      ),
    );
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    try {
      if (isPayingToken) {
        const wethContract = new ethers.Contract(
          WETH_TOKEN_ADDRESS,
          erc20ABI,
          signer!,
        );
        const wethApprovalTransaction = await wethContract.approve(
          CONTRACT_ADDRESS,
          MAX_APPROVE_AMOUNT,
          {
            gasLimit: 2000000,
          },
        );
        await wethApprovalTransaction.wait();

        const transaction = await contract.createNewAirdrop(
          isPayingToken,
          tokenAddress,
          totalAmount,
          startDateUnix,
          endDateUnix,
          ipfsUrl,
          root,
          {
            gasLimit: 2000000,
          },
        );
        await transaction.wait();
      } else {
        const feeValue = await contract.feeValue();
        const transaction = await contract.createNewAirdrop(
          isPayingToken,
          tokenAddress,
          totalAmount,
          startDateUnix,
          endDateUnix,
          ipfsUrl,
          root,
          {
            value: feeValue,
            gasLimit: 2000000,
          },
        );
        await transaction.wait();
      }
      alert('Success');
      setIsLoading(false);
    } catch (e) {
      alert('Some error occured');
      console.error(e);
      setIsLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>AppPage</title>
        <meta name="description" content="A Boilerplate application AppPage" />
      </Helmet>
      <Header />
      <div className="container">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="panel">
            <h1>1. Insert your Wallet.</h1>
            <p>
              Welcome to ClaimKitty! This is a place where you can build and
              customize your airdrop in the easiest and safest way possible.{' '}
              <br />
              We are focused in building a strong and large community and
              promote our service towards blockchain developers. Read more about
              Us on our communities or Socials. <br />{' '}
              <strong>
                Start now to promote your project authenticating yourself
                throught Metamask!
              </strong>
            </p>
          </div>
          <div className="panel">
            <h1>2. Select the Token to AirDrop.</h1>
            <p>
              Select the Token to airdrop to all users throught the form below.
              Your tokens will be safely deposited into a Smart Contract and
              will be available to be claimed to your users immediately.
            </p>
            <input
              className="form"
              type="text"
              name="token-address"
              placeholder="Insert Here Token Address"
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
              accept=".csv"
            />
          </div>
          <div className="panel" style={{ paddingBottom: 60 }}>
            <h1>3. Drop the CSV File.</h1>
            <p>
              Drop your CSV file or select it via the button below. Through this
              CSV we will know the wallets eligible for airdrop and their
              respective token amounts. <br />
              <strong>Please Note:</strong> The CSV must consist of two columns.
              On the first column enter the wallet address, on the second column
              enter the amount of tokens to be received. Indicate the decimal
              place with a dot. We won't store any of your CSV Data.
            </p>

            <label className="fileUploader">
              <input
                type="file"
                accept=".csv"
                id="demoPick"
                onChange={e => {
                  handleCSVUpdate(e.target.files?.item(0));
                }}
              />
              Upload File
            </label>

            <table
              id="demoTable"
              style={{ display: 'none', height: 250, overflow: 'auto' }}
            ></table>
          </div>
          <div className="panel">
            <h1>4. Select the Time Range.</h1>
            <p>
              Select through our Date Pickers the time range in which users can
              claim tokens. If not all tokens will be distributed, our Smart
              Contract is scheduled to return them to you gradually. The total
              amount of Tokens will be divided by three and each tranche will be
              returned every three months to avoid dumps or liquidity
              mainpulation.
            </p>
            <label htmlFor="start">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={startDate.toISOString().split('T')[0]}
              onChange={e => setStartDate(new Date(e.target.value))}
            />{' '}
            <br />
            <label htmlFor="end" style={{ paddingTop: 20 }}>
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={endDate.toISOString().split('T')[0]}
              onChange={e => setEndDate(new Date(e.target.value))}
            />
          </div>
          Fees in Native Token
          <label className="switch">
            <input
              type="checkbox"
              checked={isFeesInWETH}
              onChange={() => setIsFeesInWETH(v => !v)}
            />
            <span className="slider round"></span>
          </label>
          Fees in WETH
          <div className="button" id="confirmAirdrop" onClick={handleSubmit}>
            Confirm AirDrop
          </div>
          <p>
            By pressing the 'Confirm AirDrop' button, the Metamask wallet will
            ask you to confirm the transaction. As soon as the transaction is
            confirmed by the network you selected, your users will be able to
            claim tokens. The service will charge a fee of $5 in ETH or WETH on
            the mainnet, of the Native Token or WETH on the other chains. Select
            which you prefer in the above checkbox. <br /> <br />{' '}
          </p>
        </form>
      </div>
    </>
  );
}
