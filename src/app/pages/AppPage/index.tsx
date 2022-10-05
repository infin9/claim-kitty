import { Header } from 'app/components/Header';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';

export function AppPage() {
  return (
    <>
      <Helmet>
        <title>AppPage</title>
        <meta name="description" content="A Boilerplate application AppPage" />
      </Helmet>
      <Header/>
      <div className="container">
        <div className="panel">
          <h1>1. Insert your Wallet.</h1>
          <p>Welcome to ClaimKitty! This is a place where you can build and customize your airdrop in the easiest and safest way possible. <br/>We are focused in building a strong and large community and promote our service towards blockchain developers. Read more about Us on our communities or Socials. <br/> <strong>Start now to promote your project authenticating yourself throught Metamask!</strong></p>
        </div>
        <div className="panel">
          <h1>2. Select the Token to AirDrop.</h1>
          <p>Select the Token to airdrop to all users throught the form below. Your tokens will be safely deposited into a Smart Contract and will be available to be claimed to your users immediately.</p>
          <input className="form" type="text" name="token-address" placeholder="Insert Here Token Address"/>
        </div>

        <div className="panel" style={{paddingBottom: 60}}>
          <h1>3. Drop the CSV File.</h1>
          <p>Drop your CSV file or select it via the button below. Through this CSV we will know the wallets eligible for airdrop and their respective token amounts. <br/><strong>Please Note:</strong> The CSV must consist of two columns. On the first column enter the wallet address, on the second column enter the amount of tokens to be received. Indicate the decimal place with a dot. We won't store any of your CSV Data.</p>

          <label className="fileUploader">
            <input type="file" accept=".csv" id="demoPick"/>
            Upload File
          </label>

          <table id="demoTable"  style={{display: "none", height: 250, overflow:" auto"}}></table>
        </div>

        <div className="panel">
          <h1>4. Select the Time Range.</h1>
          <p>Select through our Date Pickers the time range in which users can claim tokens. If not all tokens will be distributed, our Smart Contract is scheduled to return them to you gradually. The total amount of Tokens will be divided by three and each tranche will be returned every three months to avoid dumps or liquidity mainpulation.</p>
          <label htmlFor="start">Start Date</label>
          <input type="date" name="startDate" value=""/> <br/>
          <label htmlFor="end"  style={{paddingTop: 20}}>End Date</label>
          <input type="date" name="endDate" value="" style={{marginTop: 20}}/>
        </div>

        <div className="button" id="confirmAirdrop">Confirm AirDrop</div>
        <p>By pressing the 'Confirm AirDrop' button, the Metamask wallet will ask you to confirm the transaction. As soon as the transaction is confirmed by the network you selected, your users will be able to claim tokens. The service will charge a fee of $5 in ETH or WETH on the mainnet, of the Native Token or WETH on the other chains. <br/> <br/> </p>
      </div>  
    </>
  );
}
