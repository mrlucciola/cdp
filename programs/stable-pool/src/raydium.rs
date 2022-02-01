use anchor_lang::prelude::*;
use arrayref::{array_mut_ref, array_ref, mut_array_refs};

#[derive(Clone, Copy, Debug)]
pub struct CreateLedgerAccount {
    pub instruction: u8,
}

impl CreateLedgerAccount {
    pub const LEN: usize = 1;

    pub fn get_size(&self) -> usize {
        CreateLedgerAccount::LEN
    }

    pub fn pack(&self, output: &mut [u8]) -> Result<usize, ProgramError> {
        output[0] = self.instruction as u8;

        Ok(CreateLedgerAccount::LEN)
    }

    pub fn to_vec(&self) -> Result<Vec<u8>, ProgramError> {
        let mut output: [u8; CreateLedgerAccount::LEN] = [0; CreateLedgerAccount::LEN];
        if let Ok(len) = self.pack(&mut output[..]) {
            Ok(output[..len].to_vec())
        } else {
            Err(ProgramError::InvalidInstructionData)
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct Stake {
    pub instruction: u8,
    pub amount: u64,
}

impl Stake {
    pub const LEN: usize = 9;

    pub fn get_size(&self) -> usize {
        Stake::LEN
    }

    pub fn pack(&self, output: &mut [u8]) -> Result<usize, ProgramError> {
        let output = array_mut_ref![output, 0, Stake::LEN];

        let (instruction_out, amount_out) = mut_array_refs![output, 1, 8];

        instruction_out[0] = self.instruction as u8;
        *amount_out = self.amount.to_le_bytes();

        Ok(Stake::LEN)
    }

    pub fn to_vec(&self) -> Result<Vec<u8>, ProgramError> {
        let mut output: [u8; Stake::LEN] = [0; Stake::LEN];
        if let Ok(len) = self.pack(&mut output[..]) {
            Ok(output[..len].to_vec())
        } else {
            Err(ProgramError::InvalidInstructionData)
        }
    }
}
