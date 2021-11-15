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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "vaultOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
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
          "name": "nonce",
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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "lockLp",
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
          "name": "poolTokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
            "name": "vaultOwner",
            "type": "publicKey"
          },
          {
            "name": "tokenLp",
            "type": "publicKey"
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
            "name": "troveOwner",
            "type": "publicKey"
          },
          {
            "name": "tokenVault",
            "type": "publicKey"
          },
          {
            "name": "lockedLpBalance",
            "type": "u64"
          },
          {
            "name": "debt",
            "type": "u64"
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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createTokenVault",
      "accounts": [
        {
          "name": "vaultOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
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
          "name": "nonce",
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
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "lockLp",
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
          "name": "poolTokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenLp",
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
            "name": "vaultOwner",
            "type": "publicKey"
          },
          {
            "name": "tokenLp",
            "type": "publicKey"
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
            "name": "troveOwner",
            "type": "publicKey"
          },
          {
            "name": "tokenVault",
            "type": "publicKey"
          },
          {
            "name": "lockedLpBalance",
            "type": "u64"
          },
          {
            "name": "debt",
            "type": "u64"
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
    }
  ]
};
