// anchor/solana
import { workspace, Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
// @ts-ignore
import { setAuthority } from "@solana/spl-token";
import {
  findMinterAddress,
  QuarrySDK,
  QuarryWrapper,
  RewarderWrapper,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
import { TokenAmount, Token as SToken, u64 } from "@saberhq/token-utils";
import {
  SignerWallet,
  Provider as SaberProvider,
} from "@saberhq/solana-contrib";
// local
import { DECIMALS_SBR } from "../utils/constants";
import { StablePool } from "../../target/types/stable_pool";
import { CollateralAccount, MintPubKey } from "../utils/interfaces";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class QuarryClass {
  public payer: Keypair;
  public provider: SaberProvider;
  public sdk: QuarrySDK;
  public pubkey: PublicKey; // quarryKey
  public mintWrapper: PublicKey; // mintWrapperKey
  public rewarder: PublicKey; // rewarderKey
  public minter: PublicKey;
  public rewarderWrapper: RewarderWrapper; // rewarderWrapper
  public rewardClaimFeeAccount: PublicKey;
  public quarryWrapper: QuarryWrapper; // quarryWrapper

  constructor() {
    this.payer = (programStablePool.provider.wallet as any).payer;
    this.provider = new SignerWallet(this.payer).createProvider(
      programStablePool.provider.connection
    );
    this.sdk = QuarrySDK.load({
      provider: this.provider,
    });
    // this.sbr.splToken.payer
    // const rewardsMintKP = Keypair.generate();
  }
  async init(sbrMint: MintPubKey, collateralToken: CollateralAccount) {
    let sbrSToken = SToken.fromMint(sbrMint, DECIMALS_SBR);
    let baseHardCap = TokenAmount.parse(sbrSToken, "1000000000000");

    // create the mint wrapper
    const { tx: txWrapper, mintWrapper: mintWrapperKey } =
      await this.sdk.mintWrapper.newWrapper({
        hardcap: baseHardCap.toU64(),
        tokenMint: sbrMint,
      });
    await setAuthority(
      this.provider.connection,
      this.payer,
      sbrMint,
      this.payer,
      "MintTokens",
      mintWrapperKey
    );
    await setAuthority(
      this.provider.connection,
      this.payer,
      sbrMint,
      this.payer,
      "FreezeAccount",
      mintWrapperKey
    );
    await txWrapper.confirm();
    this.mintWrapper = mintWrapperKey;

    // create the rewarder
    const { tx: txRewarder, key: rewarderPubKey } =
      await this.sdk.mine.createRewarder({
        mintWrapper: this.mintWrapper,
        authority: this.payer.publicKey,
      });
    await txRewarder.confirm();
    this.rewarder = rewarderPubKey;

    // set annual rewards
    this.rewarderWrapper = await this.sdk.mine.loadRewarderWrapper(
      this.rewarder
    );

    const rate_tx = this.rewarderWrapper.setAnnualRewards({
      newAnnualRate: new u64(1000000000000),
    });
    await rate_tx.confirm();

    const allowance = new u64(1_000_000_000);

    let txMinter = await this.sdk.mintWrapper.newMinterWithAllowance(
      this.mintWrapper,
      this.rewarder,
      allowance
    );
    await txMinter.confirm();
    [this.minter] = await findMinterAddress(
      this.mintWrapper, // mintWrapperKey
      this.rewarder, // rewarderKey,
      QUARRY_ADDRESSES.MintWrapper
    );
    console.log("Passed creating minter->" + [this.minter]);

    this.rewardClaimFeeAccount =
      this.rewarderWrapper.rewarderData.claimFeeTokenAccount;

    // only a rewarder can create a quarry
    const collateralSToken = SToken.fromMint(collateralToken.mint, 9); // prev: usdcUsdtLPToken
    const { quarry: quarryPubKey, tx: txQuarry } =
      await this.rewarderWrapper.createQuarry({
        token: collateralSToken, // token: baseToken, == sbrSToken
      });
    await txQuarry.confirm();
    this.pubkey = quarryPubKey;

    // set rewards share for quarry
    this.quarryWrapper = await this.rewarderWrapper.getQuarry(collateralSToken);
    const share_tx = await this.quarryWrapper.setRewardsShare(
      new u64(100_000_000)
    );
    share_tx.confirm();
  }
}
