export type StablePool = {
  "version": "0.0.0",
  "name": "stable_pool",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": false,
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
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
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
          "name": "tokenColl",
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
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "globalStateNonce",
          "type": "u8"
        },
        {
          "name": "tokenCollNonce",
          "type": "u8"
        },
        {
          "name": "riskLevel",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createUserTrove",
      "accounts": [
        {
          "name": "troveOwner",
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
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositCollateral",
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
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
      "name": "withdrawCollateral",
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
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
      "name": "borrowUsd",
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
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "userTroveNonce",
          "type": "u8"
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "userTroveNonce",
          "type": "u8"
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
          "name": "userUsdTokenNonce",
          "type": "u8"
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
            "name": "tokenColl",
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
            "name": "riskLevel",
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
          }
        ]
      }
    }
  ],
  "types": [
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
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 301,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 302,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 303,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 304,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 305,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 306,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 307,
      "name": "InvalidOracleConfig",
      "msg": "InvalidOracleConfig"
    },
    {
      "code": 308,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 309,
      "name": "InvalidCluster",
      "msg": "This function works on devnet only"
    }
  ]
};

export const IDL: StablePool = {
  "version": "0.0.0",
  "name": "stable_pool",
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": false,
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
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "payer",
          "isMut": false,
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
          "name": "tokenColl",
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
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "globalStateNonce",
          "type": "u8"
        },
        {
          "name": "tokenCollNonce",
          "type": "u8"
        },
        {
          "name": "riskLevel",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createUserTrove",
      "accounts": [
        {
          "name": "troveOwner",
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
        }
      ],
      "args": [
        {
          "name": "userTroveNonce",
          "type": "u8"
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositCollateral",
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
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
      "name": "withdrawCollateral",
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
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
      "name": "borrowUsd",
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
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "userTroveNonce",
          "type": "u8"
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
        },
        {
          "name": "tokenVaultNonce",
          "type": "u8"
        },
        {
          "name": "userTroveNonce",
          "type": "u8"
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
          "name": "userUsdTokenNonce",
          "type": "u8"
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
            "name": "tokenColl",
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
            "name": "riskLevel",
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
          }
        ]
      }
    }
  ],
  "types": [
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
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 301,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 302,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 303,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 304,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 305,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 306,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 307,
      "name": "InvalidOracleConfig",
      "msg": "InvalidOracleConfig"
    },
    {
      "code": 308,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 309,
      "name": "InvalidCluster",
      "msg": "This function works on devnet only"
    }
  ]
};
