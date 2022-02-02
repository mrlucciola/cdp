## Link to Jira Ticket

https://cdp_app.atlassian.net/browse/RFM-xyz

## Link(s) to PRs in separate repositories that are part of the SAME ticket

https://github.com/CDPApp/CDP-new-frontend/pull/abc
https://github.com/CDPApp/rf-engine/pull/xyz

## Description

Provide a description of the changes (additions, updates, deletions) made to the codebase and how they apply to the ticket

## Steps to test

Localnet/devnet/mainnet test
1. Set up environment to test on localnet/devnet
- `solana config set --url localnet`/`solana config set --url devnet`/`solana config set --url mainnet-beta`
2. Build program
- `anchor build && anchor deploy`
3. Update contract addresses from the `anchor deploy` output in `Anchor.toml` and all relevant `lib.rs` files
4. Run local validator
- `solana-test-validator`
5. Run tests
- `anchor test --skip-build --skip-deploy --skip-local-validator`


## Risks and notes

Describe apparent or potential risks, breaking changes, issues that could be the result of merging this code

## Checklist (you can prefill these checkboxes with 'x')

[] Code includes the most recent changes to `mainnet_dev`. `git pull --rebase origin mainnet_dev` and fixed all merge conflicts
Commit hash for HEAD: ________

[] All commits begin with ticket number, and include brief description of changes made: `RFM-000 add xyz function...`

[] PR is named correctly

[] Code is tested and working at each commit

[] Jira ticket is moved to 'In Testing'/'In Review'

[] PR is assigned to all developers that pushed/contributed to PR

[] PR is assigned a reviewer

[] PR is tagged properly

