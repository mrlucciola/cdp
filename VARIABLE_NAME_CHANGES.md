Global changes:

nonce -> bump  
super(owner) -> authority  
*TAG -> *SEED  

```Constants``` now have the same value as their variable name 

<br>

# Authority

| Before      | After |
| ----------- | ----------- |
| super_owner/superOwner | authority |
| change_super_owner | change_authority |
| ChangeSuperOwner | ChangeAuthority |
| owner | authority |

<br>

# Vault

| Before      | After |
| ----------- | ----------- |
| CreateTokenVault   (ctx - rs) | CreateVault |
| create_token_vault (fxn - rs) | create_vault |
| createTokenVault   (fxn - js) | createVault |
| tokenVault | vault & accounts.vaultLpSaber.pubKey |
| token_vault | vault & accounts.vaultLpSaber.pubKey |
| vaultColl | vault & accounts.vaultLpSaber.pubKey |
| token_vault_nonce | vault_bump |
| tokenVaultNonce | vaultNonce & accounts.vaultLpSaber.bump |

### constants

| Before      | After |
| ----------- | ----------- |
| TOKEN_VAULT_TAG | VAULT_SEED |

<br>

# Mint

| Before      | After |
| ----------- | ----------- |
| mint_coll         | mint |
| mintColl          | mint |
| collateral_mint   | mint_coll |
| collateralMint    | mintColl |
| localUserCollKey  | userColl & users.base.ataLpSaber.pubKey |
| localTokenCollKey | users.base.ataLpSaber.pubKey |
| userTokenColl     | users.base.ataLpSaber.pubKey |
| user_token_coll   | ata_user_coll |
| tokenCollNonce    | token_coll_nonce & user.ataLpSaber.bump |

### constants

| Before      | After |
| ----------- | ----------- |
| USD_MINT_TAG | MINT_USD_SEED |
| usd-mint (value) | MINT_USD_SEED |

<br>

# Trove

| Before      | After |
| ----------- | ----------- |
| CreateUserTrove   (ctx - rs)    | CreateTrove |
| create_user_trove (fxn - rs)    | create_trove |
| createUserTrove   (fxn - js)    | createTrove |

<br>

> Troves only represent one asset for one user, so we can eliminate any appended info (i.e. user, coll, token)

| Before      | After |
| ----------- | ----------- |
| UserTrove        (state - rs) | Trove |
| user_trove       | trove |
| user_trove_nonce | trove_nonce |
| userTrove        | trove |
| user_trove_reward               | trove_reward |
| user_trove_reward_token_a_nonce | trove_reward_token_a_nonce |
| user_trove_reward_token_b_nonce | trove_reward_token_b_nonce |
| TroveAuth        (state - rs) | Trove |
| trove_auth       | trove |
| troveAuth        | trove & users.base.troveLpSaber |
| troveAcct        | trove |
| tokenColl        | ataTrove |
| token_coll       | ata_trove |
| token_coll_nonce | ata_trove_nonce |
| poolTokenColl    | ataTrove & users.base.ataTroveLpSaber.pubKey |
| pool_token_coll  | ata_trove |
| ata_trove_coll   | ata_trove |
| ataTroveColl     | ataTrove |
| userTroveKey       | trovePubKey |
| userTroveNonce     | troveNonce |
| localUserTroveKey  | trovePubKey |
| localUserTrove     | trove |

### constants

| Before      | After |
| ----------- | ----------- |
| USER_TROVE_POOL_TAG | TROVE_POOL_SEED |
| user-trove-pool (value) | TROVE_POOL_SEED |
| USER_TROVE_TAG | TROVE_SEED |
| user-trove (value) | TROVE_SEED |

<br>

# GlobalState

### constants

| Before      | After |
| ----------- | ----------- |
| GLOBAL_STATE_TAG | GLOBAL_STATE_SEED |
| global-state-seed (value) | GLOBAL_STATE_SEED |

<br>

# USD

| Before      | After |
| ----------- | ----------- |
| user_token_usd | ata_user_usd |
| userTokenUsd | ataUserUsd |
| userUsdKey | ataUserUsd |
| user_usd_key | ata_user_usd |

### constants

| Before      | After |
| ----------- | ----------- |
| USER_USD_TOKEN_TAG | USER_USD_SEED |
| usd-token (value) | USER_USD_SEED |