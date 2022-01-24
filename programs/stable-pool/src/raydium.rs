
use anchor_lang::{
    prelude::*,
    solana_program::{
        program::{invoke_signed},
        instruction::{AccountMeta, Instruction},
    }
};
use arrayref::{array_mut_ref, mut_array_refs, array_ref};

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
