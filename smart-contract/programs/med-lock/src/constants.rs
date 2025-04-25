use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

pub const MAX_DID_LENGTH: usize = 64;
pub const LOG_SEED: &[u8] = b"log";
pub const RECORD_SEED: &[u8] = b"record";
pub const ACCESS_SEED: &[u8] = b"access";
pub const USER_SEED: &[u8] = b"user";
pub const CONTRIBUTION_SEED: &[u8] = b"contribution";
pub const POOL_SEED: &[u8] = b"pool";
