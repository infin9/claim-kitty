import { Header } from 'app/components/Header';
import { BigNumber, ethers } from 'ethers';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useContract, useSigner } from 'wagmi';

import contractABI from 'app/contract/contractABI.json';
import erc20ABI from 'app/contract/erc20ABI.json';

import { LoaderContext } from 'app';
import {
  CONTRACT_ADDRESS,
  MAX_APPROVE_AMOUNT,
  WETH_TOKEN_ADDRESS,
} from 'app/globals';
import { createLeaf, createMerkleTree } from 'app/merkleTree';
import { ref, set, update } from 'firebase/database';
import { database } from 'app/firebase';

import { v4 as uuidv4 } from 'uuid';
import { SimpleError } from 'utils/errors/errors';

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

  const { setIsLoading, setLoadingMessage } = React.useContext(LoaderContext);

  const [tokenAddress, setTokenAddress] = React.useState<string>('');
  const [csvData, setCsvData] = React.useState<CSVItem[] | undefined>(
    undefined,
  );
  const [selectedFileName, setSelectedFileName] = React.useState<
    string | undefined
  >(undefined);
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());

  const [isFeesInWETH, setIsFeesInWETH] = React.useState<boolean>(false);

  function handleCSVUpdate(file?: File | null) {
    setSelectedFileName(undefined);
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
        setSelectedFileName(file.name);
      } catch (e) {
        setSelectedFileName(undefined);
        alert('Error wail parsing CSV');
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    setLoadingMessage(undefined);
    if (!address) return alert('No wallet connected');

    if (!tokenAddress) return alert('Enter token address');
    if (!csvData) return alert('Upload a valid csv file');

    setIsLoading(true);

    setLoadingMessage('Validating...');

    const startDateUnix = Math.floor(startDate.getTime() / 1000);
    const endDateUnix = Math.floor(endDate.getTime() / 1000);

    const differance = endDateUnix - startDateUnix;

    const minClaimPeriod = (await contract.minClaimPeriod()).toNumber();
    const maxClaimPeriod = (await contract.maxClaimPeriod()).toNumber();

    if (differance < minClaimPeriod || differance > maxClaimPeriod) {
      alert(
        `Claim period should be atleast ${formatDuration(
          minClaimPeriod,
        )} and atmost ${formatDuration(maxClaimPeriod)}`,
      );
      setLoadingMessage(undefined);
      setIsLoading(false);
      return;
    }

    setLoadingMessage('Uploading CSV...');

    const isPayingToken = isFeesInWETH === true;

    const jsonData = csvData;
    const airdropUuid = uuidv4();
    set(ref(database, 'airdrops/' + airdropUuid), jsonData);

    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer!);
    const decimals = await tokenContract.decimals();

    const totalAmount = Object.values(csvData).reduce(
      (previous, current) =>
        previous.add(
          ethers.utils.parseUnits(current.amount.toString(), decimals),
        ),
      BigNumber.from(0),
    );

    if ((await tokenContract.balanceOf(address)).lt(totalAmount)) {
      alert("This wallet doesn't have enough balance");
      setLoadingMessage(undefined);
      setIsLoading(false);
      return;
    }

    if (
      totalAmount.gt(await tokenContract.allowance(address, CONTRACT_ADDRESS))
    ) {
      setLoadingMessage('Waiting for token allowance approval');
      const tokenApprovalTransaction = await tokenContract.approve(
        CONTRACT_ADDRESS,
        MAX_APPROVE_AMOUNT,
      );
      setLoadingMessage('Processing...');
      await tokenApprovalTransaction.wait();
    }

    const tree = createMerkleTree(
      csvData.map(x => createLeaf(x.address, x.amount, decimals)),
    );
    const root = tree.getHexRoot();

    try {
      if (isPayingToken) {
        const wethContract = new ethers.Contract(
          WETH_TOKEN_ADDRESS,
          erc20ABI,
          signer!,
        );

        if (
          ethers.utils
            .parseEther('100')
            .gt(await wethContract.allowance(address, CONTRACT_ADDRESS))
        ) {
          setLoadingMessage('Waiting for WETH allowance Approval...');
          const wethApprovalTransaction = await wethContract.approve(
            CONTRACT_ADDRESS,
            MAX_APPROVE_AMOUNT,
          );
          setLoadingMessage('Processing...');
          await wethApprovalTransaction.wait();
        }

        setLoadingMessage('Confirm Transaction');
        const transaction = await contract.createNewAirdrop(
          isPayingToken,
          tokenAddress,
          totalAmount,
          startDateUnix,
          endDateUnix,
          airdropUuid,
          root,
        );
        setLoadingMessage('Creating Airdrop...');
        await transaction.wait();
      } else {
        const feeValue = await contract.creatorFee();
        setLoadingMessage('Confirm Transaction');
        const transaction = await contract.createNewAirdrop(
          isPayingToken,
          tokenAddress,
          totalAmount,
          startDateUnix,
          endDateUnix,
          airdropUuid,
          root,
          {
            value: feeValue,
          },
        );
        setLoadingMessage('Creating Airdrop...');
        await transaction.wait();
      }
      alert('Success');
      setIsLoading(false);
    } catch (e) {
      setLoadingMessage(undefined);
      setIsLoading(false);
      if (e instanceof SimpleError) {
        alert(e.message);
        console.log(e.error);
      } else {
        alert('Some error occured');
        console.error(e);
      }
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <a href="/app">[Create Airdrop]</a>
            <a href="/user">Collect Airdrop</a>
          </div>
          <br />
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                position: 'relative',
                top: 20,
              }}
            >
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

              {selectedFileName && (
                <span>
                  {selectedFileName} - {csvData?.length} Records Detected
                </span>
              )}
            </div>

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
            <div>
              <label htmlFor="start">Start Date</label>{' '}
              <DateField value={startDate} setValue={setStartDate} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label htmlFor="end">End Date</label>{' '}
              <DateField value={endDate} setValue={setEndDate} />
            </div>
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

const DateField = ({
  value,
  setValue,
}: {
  value: Date;
  setValue: (date: Date) => void;
}) => {
  const str = new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -1)
    .split('T');
  const date = str[0];
  const time = str[1].split('.')[0];

  const setDate = ({
    date: newDate,
    time: newTime,
  }: {
    date?: string;
    time?: string;
  }) => {
    try {
      const newValue = new Date((newDate ?? date) + 'T' + (newTime ?? time));
      newValue.toISOString();
      setValue(newValue);
    } catch (e) {}
  };
  return (
    <>
      <input
        type="date"
        value={date}
        onChange={e => setDate({ date: e.target.value })}
      />{' '}
      <input
        type="time"
        value={time}
        onChange={e => setDate({ time: e.target.value })}
      />
    </>
  );
};

const formatDuration = (s: number) => {
  if (s == 0) return '0 seconds';
  const ms = Math.abs(s) * 1000;
  const time = {
    day: Math.floor(ms / 86400000),
    hour: Math.floor(ms / 3600000) % 24,
    minute: Math.floor(ms / 60000) % 60,
    second: Math.floor(ms / 1000) % 60,
  };
  return Object.entries(time)
    .filter(val => val[1] !== 0)
    .map(([key, val]) => `${val} ${key}${val !== 1 ? 's' : ''}`)
    .join(', ');
};
