export type OrcaTest = {
  "version": "0.1.0",
  "name": "orca_test",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [],
      "args": []
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolTokenAccount",
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
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userFarm",
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
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "ratioAuthorityBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
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
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolTokenAccount",
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
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userFarm",
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
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "ratioAuthorityBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
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
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "INSTRUCTIONS",
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
  ]
};

export const IDL: OrcaTest = {
  "version": "0.1.0",
  "name": "orca_test",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [],
      "args": []
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolTokenAccount",
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
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userFarm",
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
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "ratioAuthorityBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
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
          "name": "userBaseTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPoolTokenAccount",
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
          "name": "ratioRewardTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalFarm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userFarm",
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
        },
        {
          "name": "associatedTokenProgram",
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
          "name": "ratioAuthorityBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
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
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "INSTRUCTIONS",
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
  ]
};
