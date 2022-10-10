import { Header } from 'app/components/Header';
import { ethers } from 'ethers';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useContract, useSigner } from 'wagmi';

import contractABI from 'app/contract/contractABI.json';
import { PinataService } from 'app/services/PinataService';

import { MerkleTree } from 'merkletreejs';

import SHA256 from 'crypto-js/sha256';

type CSVItem = {
  address: string;
  amount: number;
};

export function AppPage() {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const contract = useContract({
    addressOrName: '0x770e8c34ab8392a24f78280463a7a73210ff2633',
    contractInterface: contractABI,
    signerOrProvider: signer,
  });

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
          console.log(rowData[1]);
          _csvData.push({
            address: rowData[0].trim(),
            amount: Number.parseFloat(rowData[1]),
          });
        });
        console.log(_csvData);
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

    const totalAmount = Object.values(csvData).reduce(
      (previous, current) => previous + current.amount,
      0,
    );

    const jsonData = { data: csvData };
    const cid = await PinataService.pinToIPFS(jsonData);

    const ipfsUrl = 'ipfs://' + cid;

    const leaves = csvData.map(x => SHA256(JSON.stringify(x)));
    const tree = new MerkleTree(leaves, SHA256);
    const root = tree.getRoot().toString('hex');

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

    contract.createNewAirdrop(
      !isFeesInWETH,
      tokenAddress,
      totalAmount,
      startDateUnix,
      endDateUnix,
      ipfsUrl,
      root,
      {
        value: ethers.utils.parseEther(totalAmount.toString()),
      },
    );
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
