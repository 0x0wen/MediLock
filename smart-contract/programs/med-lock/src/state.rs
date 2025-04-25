use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

#[account]
#[derive(InitSpace)]
pub struct User {
    pub public_key: Pubkey,
    #[max_len(16)]
    pub nik: String,
    #[max_len(64)]
    pub full_name: String,
    #[max_len(3)]
    pub blood_type: String,
    pub birthdate: i64,
    pub gender: Gender,
    #[max_len(64)]
    pub email: String,
    #[max_len(16)]
    pub phone_number: String,
    pub role: UserRole,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct MedicalRecord {
    #[max_len(64)]
    pub cid: String,
    #[max_len(64)]
    pub doctor_did: String,
    #[max_len(64)]
    pub patient_did: String,
    pub timestamp: i64,
    #[max_len(256)]
    pub metadata: String,
}

#[account]
#[derive(InitSpace)]
pub struct AccessRequest {
    #[max_len(64)]
    pub doctor_did: String,
    #[max_len(64)]
    pub patient_did: String,
    pub requested_at: i64,
    #[max_len(64)]
    pub scope: String,
    pub expires_at: i64,
    pub status: RequestStatus,
    pub responded_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct AccessLog {
    #[max_len(64)]
    pub record_cid: String,
    #[max_len(64)]
    pub user_did: String,
    pub timestamp: i64,
    #[max_len(32)]
    pub action: String,
}

#[account]
#[derive(InitSpace)]
pub struct DataPool {
    pub id: u64,             
    pub creator: Pubkey, 
    #[max_len(64)]    
    pub name: String,
    #[max_len(200)]    
    pub description: String,
    pub price_per_record: u64,
    pub total_needed: u64,
    pub collected: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Contribution {
    pub id: u64,
    pub pool_id: u64,
    pub record_id: u64,
    pub contributor: Pubkey,
    pub paid: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug, InitSpace)]
pub enum UserRole {
    Patient,
    Doctor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug, InitSpace)]
pub enum Gender {
    Male,
    Female,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug, InitSpace)]
pub enum RequestStatus {
    Pending,
    Approved,
    Denied,
}

#[event]
pub struct UserRegistered {
    pub nik: String,
    pub full_name: String,
    pub role: UserRole,
    pub email: String,
    pub timestamp: i64,
}

#[event]
pub struct RecordAdded {
    pub cid: String,
    pub patient_did: String,
    pub doctor_did: String,
    pub timestamp: i64,
}

#[event]
pub struct AccessRequested {
    pub doctor_did: String,
    pub patient_did: String,
    pub timestamp: i64,
}

#[event]
pub struct AccessRequestResponded {
    pub doctor_did: String,
    pub patient_did: String,
    pub approved: bool,
    pub timestamp: i64,
}

#[event]
pub struct AccessLogged {
    pub record_cid: String,
    pub user_did: String,
    pub action: String,
    pub timestamp: i64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized role for this operation")]
    UnauthorizedRole,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Access denied")]
    AccessDenied,
    #[msg("Access has expired")]
    AccessExpired,
    #[msg("Pool has already collected the maximum number of contributions.")]
    PoolFull,
    #[msg("This contribution has already been paid out.")]
    AlreadyPaid,
}