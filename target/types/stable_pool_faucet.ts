export type StablePoolFaucet = {
  "version": "0.0.0",
  "name": "stable_pool_faucet",
  "instructions": [
    {
      "name": "createState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsdcUsdxLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintEthSolLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAtlasRayLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintSamoRayLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintUsdcUsdxLpNonce",
          "type": "u8"
        },
        {
          "name": "mintEthSolLpNonce",
          "type": "u8"
        },
        {
          "name": "mintAtlasRayLpNonce",
          "type": "u8"
        },
        {
          "name": "mintSamoRayLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetUsdcUsdxLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetEthSolLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetAtlasRayLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetSamoRayLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "faucet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "mintUsdcUsdxLp",
            "type": "publicKey"
          },
          {
            "name": "mintEthSolLp",
            "type": "publicKey"
          },
          {
            "name": "mintAtlasRayLp",
            "type": "publicKey"
          },
          {
            "name": "mintSamoRayLp",
            "type": "publicKey"
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
    }
  ]
};

export const IDL: StablePoolFaucet = {
  "version": "0.0.0",
  "name": "stable_pool_faucet",
  "instructions": [
    {
      "name": "createState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintUsdcUsdxLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintEthSolLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAtlasRayLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintSamoRayLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintUsdcUsdxLpNonce",
          "type": "u8"
        },
        {
          "name": "mintEthSolLpNonce",
          "type": "u8"
        },
        {
          "name": "mintAtlasRayLpNonce",
          "type": "u8"
        },
        {
          "name": "mintSamoRayLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetUsdcUsdxLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetEthSolLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetAtlasRayLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "faucetSamoRayLp",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "faucetState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
          "name": "stateNonce",
          "type": "u8"
        },
        {
          "name": "mintLpNonce",
          "type": "u8"
        },
        {
          "name": "userTokenLpNonce",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "faucet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "mintUsdcUsdxLp",
            "type": "publicKey"
          },
          {
            "name": "mintEthSolLp",
            "type": "publicKey"
          },
          {
            "name": "mintAtlasRayLp",
            "type": "publicKey"
          },
          {
            "name": "mintSamoRayLp",
            "type": "publicKey"
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
    }
  ]
};
