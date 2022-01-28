# cdp-contracts
1. Install nvm, use V14.0.0

2. Install npm

3. Install Rust, Yarn, Solana, and Anchor [Installing Dependencies | ⚓ Anchor](https://project-serum.github.io/anchor/getting-started/installation.html#install-rust)

4. Restart terminals

5. Set Solana CLI config to localhost: `solana config set --url localhost`

6. In one terminal, run `solana-test-validator`. Leave this window open and it should be running and look something like this

![name-of-you-image](blob:https://cdp-finance.atlassian.net/31e22dab-f7d1-4d73-bcf5-be208f769df5#media-blob-url=true&id=94a83331-7c17-45a1-953e-af4e2b614e8c&collection=contentId-7962629&contextId=7962629&mimeType=image%2Fpng&name=image-20220119-174344.png&size=40924&height=271&width=1092&alt=)

7. In another terminal, navigate to the cdp-contracts repo `cd cdp-contracts`

8. Checkout the development branch: `git checkout mainnet_dev`

9. Build and deploy programs (smart contracts): `anchor build && anchor deploy`

This transaction may fail, saying that there is not enough SOL in your wallet.

If so, copy the address and airdrop to account, and deploy again: `solana airdrop 100000 _your_address_ && anchor deploy`

This will output the Program IDs/addresss for the both `stable-pool` and `stable-pool-faucet` programs.

10. Copy these addresses into Anchor.toml where it says `stable_pool = _ADDRESS_` and `stable_pool_faucet = _ADDRESS_`  respectively.

Additionally, copy those addresses into their respective lib.rs files where it says `declare_id!("_ADDRESS_")`

11. Rebuild and deploy programs/smart contracts again: `anchor build && anchor deploy`

12. Run tests: `anchor test`

If you run into issues, you can reach out to @Anan, @user2 _ or @jkratio
