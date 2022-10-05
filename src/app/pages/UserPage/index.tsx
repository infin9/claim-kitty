import { Header } from 'app/components/Header';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';

export function UserPage() {
  return (
    <>
      <Header />
      <div className="container" style={{bottom:30}}>
        <div className="panel">
          <h1>Welcome to ClaimKitty. <br/>Let's see all Kitties claimable!</h1>
          <input className="form" type="text" name="searchAirdrop" placeholder="Insert Here Token Address to claim"/>
          <div className="button" id="claimAll">Search Token</div>
          <div className="claimList" style={{marginTop: 20}}>
            <div className="claimPanel">Token Name - Amount <div className="button" id="claimButton">Claim</div></div>
          </div>

        </div>

        <div className="panel">
          <h1>Claim left Tokens from your own Kitties</h1>
          <p> <strong>Please Note:</strong> Your left tokens will be split into three tranches in order to avoid any dump of the Token. First tranche will be available starting from the next day of the AirDrop end. The second one three months after and the third one after six months. You will have 2 weeks to claim your tokens. <br/> <strong>Example:</strong> If for example your AirDrop ends in 31/12, in 01/01 you will be able to claim the first tranche of your tokens until 15/01. For the second tranche from 01/04 to 15/04 and the last one from 01/07 to 15/07. </p>
          <div className="claimList">
            <p><strong>Token Name - Amount - Claimable Until</strong></p>
            <div className="claimPanel">AirDrop Token 1 - 210.3 - 06/06<div className="button" id="claimButton">Claim</div></div>
          </div>
          <div className="button" id="claimAll">Claim All</div>
        </div>
        <p><br/></p>

      </div>
    </>
  );
}
