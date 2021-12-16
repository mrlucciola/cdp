import * as anchor from '@project-serum/anchor';

const LIMIT = 1000

export async function analyzeFaucet(connection: anchor.web3.Connection, programId: anchor.web3.PublicKey) {
    let result:any = {}
    const limit = LIMIT
    let confirmedSigInfos: anchor.web3.ConfirmedSignatureInfo[] = []
    let tempInfos = []
    do {
        console.log('getting transactions from ' + confirmedSigInfos.length + ' ...')
        if(confirmedSigInfos.length > 0){
            const before = confirmedSigInfos[confirmedSigInfos.length-1].signature
            tempInfos = await connection.getConfirmedSignaturesForAddress2(programId, {limit: limit, before: before}, 'finalized')
        }
        else {
            tempInfos = await connection.getConfirmedSignaturesForAddress2(programId, {limit:limit}, 'finalized')
        }
        confirmedSigInfos = [...confirmedSigInfos, ...tempInfos]
    }
    while(tempInfos.length >= limit);
    console.log('confirmed faucet signatures count', confirmedSigInfos.length)

    const signatures = []

    confirmedSigInfos.forEach((info) => {
        signatures.push(info.signature)
    })
    
    const parsedConfirmedTxs = await connection.getParsedConfirmedTransactions(signatures, 'finalized')
    parsedConfirmedTxs.forEach((parsedConfirmedTx) => {
        try{
            const owner = (parsedConfirmedTx.meta.postTokenBalances[0] as any).owner;
            const mint = (parsedConfirmedTx.meta.postTokenBalances[0] as any).mint;
            if(result[owner] === undefined) {
                result[owner] = {}
            }
            result[owner][mint] = result[owner][mint] ? result[owner][mint] + 1 : 1
        }
        catch(e){}
    })
    return result
}

export async function analyzePool(connection: anchor.web3.Connection, programId: anchor.web3.PublicKey) {
    let result:any = {}
    const limit = LIMIT
    let confirmedSigInfos: anchor.web3.ConfirmedSignatureInfo[] = []
    let tempInfos = []
    do {
        console.log('getting transactions from ' + confirmedSigInfos.length + ' ...')
        if(confirmedSigInfos.length > 0){
            const before = confirmedSigInfos[confirmedSigInfos.length-1].signature
            tempInfos = await connection.getConfirmedSignaturesForAddress2(programId, {limit: limit, before: before}, 'finalized')
        }
        else {
            tempInfos = await connection.getConfirmedSignaturesForAddress2(programId, {limit:limit}, 'finalized')
        }
        confirmedSigInfos = [...confirmedSigInfos, ...tempInfos]
    }
    while(tempInfos.length >= limit);
    console.log('confirmed pool signatures count', confirmedSigInfos.length)

    const signatures = []

    confirmedSigInfos.forEach((info) => {
        signatures.push(info.signature)
    })
    
    const parsedConfirmedTxs = await connection.getParsedConfirmedTransactions(signatures, 'finalized')
    parsedConfirmedTxs.forEach((parsedConfirmedTx) => {
        try{
            if(parsedConfirmedTx.meta.postTokenBalances.length > 0) {
                for(let i=0;i<parsedConfirmedTx.meta.postTokenBalances.length;i++){
                    const owner = (parsedConfirmedTx.meta.postTokenBalances[i] as any).owner;
                    const mint = (parsedConfirmedTx.meta.postTokenBalances[i] as any).mint;
                    const amount = parsedConfirmedTx.meta.preTokenBalances[i].uiTokenAmount.uiAmount - parsedConfirmedTx.meta.postTokenBalances[i].uiTokenAmount.uiAmount
                    if(result[owner] === undefined) {
                        result[owner] = {}
                    }
                    if(result[owner][mint] === undefined) {
                        result[owner][mint] = {
                            'decreaseCount': 0,
                            'decreaseAmount': 0,
                            'increaseCount': 0,
                            'increaseAmount': 0,
                            'zeroCount': 0,
                        }
                    }
                    if(amount < 0){
                        result[owner][mint]['decreaseCount'] += 1
                        result[owner][mint]['decreaseAmount'] += amount
                    }
                    else if (amount > 0){
                        result[owner][mint]['increaseCount'] += 1
                        result[owner][mint]['increaseAmount'] += amount
                    }
                    else {
                        result[owner][mint]['zeroCount'] += 1
                    }
                }
            }
        }
        catch(e){}
    })
    return result
}