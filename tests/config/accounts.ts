// libraries
import { workspace, Program, Wallet } from "@project-serum/anchor";
import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  findMinterAddress,
  QuarrySDK,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
import {
  SignerWallet,
  Provider as SaberProvider,
} from "@saberhq/solana-contrib";
import {
  TokenAmount,
  Token as SToken,
  createInitMintInstructions,
  u64,
  SPLToken,
} from "@saberhq/token-utils";
// local
import { StablePool } from "../../target/types/stable_pool";
import {
  ITokenAccount,
  MintAcct,
  MintPubKey,
  GlobalStateAcct,
  Vault,
  PriceFeed,// TODO: price-feed -> oracle
} from "../utils/interfaces";
// local
import { SBR_DECIMAL, USDCUSDT_DECIMAL } from "../utils/constants";
// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const DEFAULT_HARD_CAP = 1_000_000_000_000;

export class Accounts {
  public global: GlobalStateAcct;
  public usdx: MintAcct;
  public lpSaberUsdcUsdt: ITokenAccount;

  // TODO: pricefeed -> oracle
  public usdcPriceFeed: PriceFeed;
  // TODO: pricefeed -> oracle
  public usdtPriceFeed: PriceFeed;

  public quarryPayer: Keypair;
  public quarryProvider: SaberProvider;
  public quarrySdk: QuarrySDK;
  public sbr: SPLToken;

  public mintWrapperKey: PublicKey;
  public rewarderKey: PublicKey;
  public rewardClaimFeeAccount: PublicKey;

  public minterKey: PublicKey;

  public quarryKey: PublicKey;

  public sbrFeeCollector: PublicKey;

  constructor() {
    // init global state acct
    this.global = new GlobalStateAcct();
    // init usdx mint acct
    this.usdx = new MintAcct();
    // init lp token
    this.lpSaberUsdcUsdt = {
      vault: null as Vault,
      mint: null as PublicKey,
    };
    // TODO: pricefeed -> oracle
    this.usdcPriceFeed = null as PriceFeed;
    // TODO: pricefeed -> oracle
    this.usdtPriceFeed = null as PriceFeed;
  }
  public async init() {
    // init the token mint
    this.lpSaberUsdcUsdt.mint = (
      await SPLToken.createMint(
        programStablePool.provider.connection,
        (programStablePool.provider.wallet as Wallet).payer as Signer,
        programStablePool.provider.wallet.publicKey,
        null,
        USDCUSDT_DECIMAL,
        TOKEN_PROGRAM_ID
      )
    ).publicKey as MintPubKey;
    this.lpSaberUsdcUsdt.vault = new Vault(this.lpSaberUsdcUsdt.mint);

    const usdcMint = (
      await SPLToken.createMint(
        programStablePool.provider.connection,
        (programStablePool.provider.wallet as Wallet).payer as Signer,
        programStablePool.provider.wallet.publicKey,
        null,
        6,
        TOKEN_PROGRAM_ID
      )
    ).publicKey as MintPubKey;
    const usdtMint = (
      await SPLToken.createMint(
        programStablePool.provider.connection,
        (programStablePool.provider.wallet as Wallet).payer as Signer,
        programStablePool.provider.wallet.publicKey,
        null,
        6,
        TOKEN_PROGRAM_ID
      )
    ).publicKey as MintPubKey;
    // TODO: pricefeed -> oracle
    this.usdcPriceFeed = new PriceFeed(usdcMint, 103000000);
    // TODO: pricefeed -> oracle
    this.usdtPriceFeed = new PriceFeed(usdtMint, 102000000);
  }
  public async initQuarry() {
    console.log("Initializing Quarry........");
    this.quarryPayer = (programStablePool.provider.wallet as any).payer;
    this.quarryProvider = new SignerWallet(this.quarryPayer).createProvider(
      programStablePool.provider.connection
    );
    this.quarrySdk = QuarrySDK.load({
      provider: this.quarryProvider,
    });

    const rewardsMintKP = Keypair.generate();

    let baseToken = SToken.fromMint(rewardsMintKP.publicKey, SBR_DECIMAL);
    let baseHardCap = TokenAmount.parse(baseToken, DEFAULT_HARD_CAP.toString());
    const { tx, mintWrapper: mintWrapperKey } =
      await this.quarrySdk.mintWrapper.newWrapper({
        hardcap: baseHardCap.toU64(),
        tokenMint: rewardsMintKP.publicKey,
      });
    // try to use the one above pls
    let txInitMint = await createInitMintInstructions({
      provider: this.quarryProvider,
      mintKP: rewardsMintKP, // Account with signing authority on the original token (baseToken)
      decimals: SBR_DECIMAL,
      mintAuthority: mintWrapperKey,
      freezeAuthority: mintWrapperKey,
    });
    await txInitMint.confirm();
    await tx.confirm();
    console.log("Passed creating mintWrapper->" + [mintWrapperKey]);

    this.sbr = new SPLToken(
      this.quarryProvider.connection,
      rewardsMintKP.publicKey,
      TOKEN_PROGRAM_ID,
      this.quarryPayer
    );

    const { tx: txRewarder, key: rewarderKey } =
      await this.quarrySdk.mine.createRewarder({
        mintWrapper: mintWrapperKey,
        authority: this.quarryPayer.publicKey,
      });

    // await expectTX(txRewarder, "Create new rewarder").to.be.fulfilled;
    await txRewarder.confirm();
    console.log("Passed creating rewarder" + [rewarderKey]);

    let rewarder = await this.quarrySdk.mine.loadRewarderWrapper(rewarderKey);
    const rate_tx = rewarder.setAnnualRewards({
      newAnnualRate: new u64(1000_000_000_000),
    });
    await rate_tx.confirm();
    console.log("Passed setting Annual Rewards");

    const allowance = new u64(1_000_000_000);

    let txMinter = await this.quarrySdk.mintWrapper.newMinterWithAllowance(
      mintWrapperKey,
      rewarderKey,
      allowance
    );
    await txMinter.confirm();
    [this.minterKey] = await findMinterAddress(
      mintWrapperKey,
      rewarderKey,
      QUARRY_ADDRESSES.MintWrapper
    );
    console.log("Passed creating minter->" + [this.minterKey]);

    const usdcUsdtLPToken = SToken.fromMint(this.lpSaberUsdcUsdt.mint, 9);
    const { quarry: quarryKey, tx: txQuarry } = await rewarder.createQuarry({
      // token: baseToken,
      token: usdcUsdtLPToken,
    });
    await txQuarry.confirm();
    console.log("Passed creating quarry ->" + [quarryKey]);

    let quarry = await rewarder.getQuarry(usdcUsdtLPToken);
    const share_tx = await quarry.setRewardsShare(new u64(100_000_000));
    share_tx.confirm();

    console.log("Passed setting rewardsShare for the Quarry");
    this.mintWrapperKey = mintWrapperKey;
    this.rewarderKey = rewarderKey;

    this.rewardClaimFeeAccount = rewarder.rewarderData.claimFeeTokenAccount;

    this.quarryKey = quarryKey;
  }
}
