export type StablePool = {
  "version": "0.1.0",
  "name": "stable_pool",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalStateNonce",
          "type": "u8"
        },
        {
          "name": "mintUsdNonce",
          "type": "u8"
        },
        {
          "name": "tvlLimit",
          "type": "u64"
        },
        {
          "name": "debtCeiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "riskLevel",
          "type": "u8"
        },
        {
          "name": "isDual",
          "type": "u8"
        },
        {
          "name": "debtCeiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUserTrove",
      "accounts": [
        {
          "name": "troveOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        },
        {
          "name": "tokenCollNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositCollateral",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawCollateral",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "borrowUsd",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "userUsdTokenNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "repayUsd",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createRaydiumV5RewardVaults",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveRewardTokenANonce",
          "type": "u8"
        },
        {
          "name": "userTroveRewardTokenBNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositRaydiumV5Collateral",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolLpAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawRaydiumV5Collateral",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolLpAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createRaydiumUserAccount",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createOrcaVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "orcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ddMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isDd",
          "type": "u8"
        },
        {
          "name": "orcaVaultNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initOrcaFarm",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioOrcaAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositOrcaLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ratioOrcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawOrcaLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ratioOrcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "harvestReward",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setGlobalDebtCeiling",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ceiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setVaultDebtCeiling",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ceiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createQuarryMiner",
      "accounts": [
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minerBump",
          "type": "u8"
        },
        {
          "name": "minerVaultBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositToSaber",
      "accounts": [
        {
          "name": "ratioStaker",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "owner",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "poolTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mintColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarmRewarder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromSaber",
      "accounts": [
        {
          "name": "ratioStaker",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "owner",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "poolTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mintColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarmRewarder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "harvestFromSaber",
      "accounts": [
        {
          "name": "ratioHarvester",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "authority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "userTroveReward",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userRewardToken",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "rewardFeeToken",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "collateralMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "clock",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "saberFarmRewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimFeeTokenAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "mintUsd",
            "type": "publicKey"
          },
          {
            "name": "globalStateNonce",
            "type": "u8"
          },
          {
            "name": "mintUsdNonce",
            "type": "u8"
          },
          {
            "name": "tvlLimit",
            "type": "u64"
          },
          {
            "name": "tvl",
            "type": "u64"
          },
          {
            "name": "paused",
            "type": "u8"
          },
          {
            "name": "totalDebt",
            "type": "u64"
          },
          {
            "name": "debtCeiling",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tokenVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintColl",
            "type": "publicKey"
          },
          {
            "name": "rewardMintA",
            "type": "publicKey"
          },
          {
            "name": "rewardMintB",
            "type": "publicKey"
          },
          {
            "name": "isDual",
            "type": "u8"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "totalColl",
            "type": "u64"
          },
          {
            "name": "totalDebt",
            "type": "u64"
          },
          {
            "name": "debtCeiling",
            "type": "u64"
          },
          {
            "name": "riskLevel",
            "type": "u8"
          },
          {
            "name": "tokenVaultNonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userTrove",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenColl",
            "type": "publicKey"
          },
          {
            "name": "rewardTokenA",
            "type": "publicKey"
          },
          {
            "name": "rewardTokenB",
            "type": "publicKey"
          },
          {
            "name": "lockedCollBalance",
            "type": "u64"
          },
          {
            "name": "debt",
            "type": "u64"
          },
          {
            "name": "lastMintTime",
            "type": "u64"
          },
          {
            "name": "userTroveNonce",
            "type": "u8"
          },
          {
            "name": "walletNonce",
            "type": "u8"
          },
          {
            "name": "tokenCollNonce",
            "type": "u8"
          },
          {
            "name": "userUsdNonce",
            "type": "u8"
          },
          {
            "name": "userTroveRewardTokenANonce",
            "type": "u8"
          },
          {
            "name": "userTroveRewardTokenBNonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ratioOrcaVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseMint",
            "type": "publicKey"
          },
          {
            "name": "lpMint",
            "type": "publicKey"
          },
          {
            "name": "ddMint",
            "type": "publicKey"
          },
          {
            "name": "isDd",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OrcaInstructions",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitGlobalFarm"
          },
          {
            "name": "InitUserFarm"
          },
          {
            "name": "ConvertTokens"
          },
          {
            "name": "RevertTokens"
          },
          {
            "name": "Harvest"
          },
          {
            "name": "RemoveRewards"
          },
          {
            "name": "SetEmissionsPerSecond"
          }
        ]
      }
    },
    {
      "name": "AccountType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Mapping"
          },
          {
            "name": "Product"
          },
          {
            "name": "Price"
          }
        ]
      }
    },
    {
      "name": "PriceStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Trading"
          },
          {
            "name": "Halted"
          },
          {
            "name": "Auction"
          }
        ]
      }
    },
    {
      "name": "CorpAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NoCorpAct"
          }
        ]
      }
    },
    {
      "name": "PriceType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Price"
          }
        ]
      }
    },
    {
      "name": "OrcaInstrunction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitGlobalFarm"
          },
          {
            "name": "InitUserFarm"
          },
          {
            "name": "ConvertTokens"
          },
          {
            "name": "RevertTokens"
          },
          {
            "name": "Harvest"
          },
          {
            "name": "RemoveRewards"
          },
          {
            "name": "SetEmissionsPerSecond"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 6002,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 6003,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 6004,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 6005,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 6006,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6007,
      "name": "InvalidOracleConfig",
      "msg": "InvalidOracleConfig"
    },
    {
      "code": 6008,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 6009,
      "name": "InvalidCluster",
      "msg": "This function works on devnet only"
    },
    {
      "code": 6010,
      "name": "TVLExceeded",
      "msg": "TVL Exceeded"
    },
    {
      "code": 6011,
      "name": "GlobalDebtCeilingExceeded",
      "msg": "Global Debt Ceiling Exceeded"
    },
    {
      "code": 6012,
      "name": "VaultDebtCeilingExceeded",
      "msg": "Vault Debt Ceiling Exceeded"
    },
    {
      "code": 6013,
      "name": "InvalidTransferAmount",
      "msg": "Transfer amount is invalid"
    }
  ]
};

export const IDL: StablePool = {
  "version": "0.1.0",
  "name": "stable_pool",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalStateNonce",
          "type": "u8"
        },
        {
          "name": "mintUsdNonce",
          "type": "u8"
        },
        {
          "name": "tvlLimit",
          "type": "u64"
        },
        {
          "name": "debtCeiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "riskLevel",
          "type": "u8"
        },
        {
          "name": "isDual",
          "type": "u8"
        },
        {
          "name": "debtCeiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUserTrove",
      "accounts": [
        {
          "name": "troveOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        },
        {
          "name": "tokenCollNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositCollateral",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawCollateral",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "borrowUsd",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "userUsdTokenNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "repayUsd",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenUsd",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createRaydiumV5RewardVaults",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveRewardTokenANonce",
          "type": "u8"
        },
        {
          "name": "userTroveRewardTokenBNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositRaydiumV5Collateral",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolLpAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawRaydiumV5Collateral",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveRewardTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolLpAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumPoolRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createRaydiumUserAccount",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raydiumProgramId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "raydiumPoolId",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTroveAssociatedInfoAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createOrcaVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "orcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ddMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isDd",
          "type": "u8"
        },
        {
          "name": "orcaVaultNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initOrcaFarm",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioOrcaAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositOrcaLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ratioOrcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawOrcaLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ratioOrcaVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioPoolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "harvestReward",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ratioAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ratioUserFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaBaseVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orcaFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ratioAuthorityBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setGlobalDebtCeiling",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ceiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setVaultDebtCeiling",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "ceiling",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createQuarryMiner",
      "accounts": [
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTrove",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minerBump",
          "type": "u8"
        },
        {
          "name": "minerVaultBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositToSaber",
      "accounts": [
        {
          "name": "ratioStaker",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "owner",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "poolTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mintColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarmRewarder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromSaber",
      "accounts": [
        {
          "name": "ratioStaker",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "owner",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "poolTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTokenColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "mintColl",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarmRewarder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "harvestFromSaber",
      "accounts": [
        {
          "name": "ratioHarvester",
          "accounts": [
            {
              "name": "globalState",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenVault",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userTrove",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "authority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "userTroveReward",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "userRewardToken",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "rewardFeeToken",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "collateralMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "clock",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "saberFarm",
          "accounts": [
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "minerVault",
              "isMut": true,
              "isSigner": false
            }
          ]
        },
        {
          "name": "userTokenColl",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberFarmProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "saberFarmRewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimFeeTokenAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "mintUsd",
            "type": "publicKey"
          },
          {
            "name": "globalStateNonce",
            "type": "u8"
          },
          {
            "name": "mintUsdNonce",
            "type": "u8"
          },
          {
            "name": "tvlLimit",
            "type": "u64"
          },
          {
            "name": "tvl",
            "type": "u64"
          },
          {
            "name": "paused",
            "type": "u8"
          },
          {
            "name": "totalDebt",
            "type": "u64"
          },
          {
            "name": "debtCeiling",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tokenVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintColl",
            "type": "publicKey"
          },
          {
            "name": "rewardMintA",
            "type": "publicKey"
          },
          {
            "name": "rewardMintB",
            "type": "publicKey"
          },
          {
            "name": "isDual",
            "type": "u8"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "totalColl",
            "type": "u64"
          },
          {
            "name": "totalDebt",
            "type": "u64"
          },
          {
            "name": "debtCeiling",
            "type": "u64"
          },
          {
            "name": "riskLevel",
            "type": "u8"
          },
          {
            "name": "tokenVaultNonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userTrove",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenColl",
            "type": "publicKey"
          },
          {
            "name": "rewardTokenA",
            "type": "publicKey"
          },
          {
            "name": "rewardTokenB",
            "type": "publicKey"
          },
          {
            "name": "lockedCollBalance",
            "type": "u64"
          },
          {
            "name": "debt",
            "type": "u64"
          },
          {
            "name": "lastMintTime",
            "type": "u64"
          },
          {
            "name": "userTroveNonce",
            "type": "u8"
          },
          {
            "name": "walletNonce",
            "type": "u8"
          },
          {
            "name": "tokenCollNonce",
            "type": "u8"
          },
          {
            "name": "userUsdNonce",
            "type": "u8"
          },
          {
            "name": "userTroveRewardTokenANonce",
            "type": "u8"
          },
          {
            "name": "userTroveRewardTokenBNonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ratioOrcaVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseMint",
            "type": "publicKey"
          },
          {
            "name": "lpMint",
            "type": "publicKey"
          },
          {
            "name": "ddMint",
            "type": "publicKey"
          },
          {
            "name": "isDd",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OrcaInstructions",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitGlobalFarm"
          },
          {
            "name": "InitUserFarm"
          },
          {
            "name": "ConvertTokens"
          },
          {
            "name": "RevertTokens"
          },
          {
            "name": "Harvest"
          },
          {
            "name": "RemoveRewards"
          },
          {
            "name": "SetEmissionsPerSecond"
          }
        ]
      }
    },
    {
      "name": "AccountType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Mapping"
          },
          {
            "name": "Product"
          },
          {
            "name": "Price"
          }
        ]
      }
    },
    {
      "name": "PriceStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Trading"
          },
          {
            "name": "Halted"
          },
          {
            "name": "Auction"
          }
        ]
      }
    },
    {
      "name": "CorpAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NoCorpAct"
          }
        ]
      }
    },
    {
      "name": "PriceType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unknown"
          },
          {
            "name": "Price"
          }
        ]
      }
    },
    {
      "name": "OrcaInstrunction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitGlobalFarm"
          },
          {
            "name": "InitUserFarm"
          },
          {
            "name": "ConvertTokens"
          },
          {
            "name": "RevertTokens"
          },
          {
            "name": "Harvest"
          },
          {
            "name": "RemoveRewards"
          },
          {
            "name": "SetEmissionsPerSecond"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 6002,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 6003,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 6004,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 6005,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 6006,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6007,
      "name": "InvalidOracleConfig",
      "msg": "InvalidOracleConfig"
    },
    {
      "code": 6008,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 6009,
      "name": "InvalidCluster",
      "msg": "This function works on devnet only"
    },
    {
      "code": 6010,
      "name": "TVLExceeded",
      "msg": "TVL Exceeded"
    },
    {
      "code": 6011,
      "name": "GlobalDebtCeilingExceeded",
      "msg": "Global Debt Ceiling Exceeded"
    },
    {
      "code": 6012,
      "name": "VaultDebtCeilingExceeded",
      "msg": "Vault Debt Ceiling Exceeded"
    },
    {
      "code": 6013,
      "name": "InvalidTransferAmount",
      "msg": "Transfer amount is invalid"
    }
  ]
};
