use anchor_lang::prelude::*;
use crate::{state::{ErrorCode, MedicalRecord, RecordAdded, User, UserRole}, RECORD_SEED};

#[derive(Accounts)]
#[instruction(record_counter: u8)]
pub struct AddRecord<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MedicalRecord::INIT_SPACE, 
        seeds = [RECORD_SEED, patient_account.key().as_ref(), &[record_counter]],
        bump
    )]
    pub record_account: Account<'info, MedicalRecord>,
    
    #[account(
        mut,
    )]
    pub doctor_account: Account<'info, User>,
    
    #[account(mut)]
    pub patient_account: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn add_record(
    ctx: Context<AddRecord>,
    _record_counter: u8,
    cid: String,
    metadata: String,
) -> Result<()> {
    let record_account = &mut ctx.accounts.record_account;
    let doctor_account = &ctx.accounts.doctor_account;
    let patient_account = &ctx.accounts.patient_account;

    record_account.cid = cid;
    record_account.doctor_did = doctor_account.full_name.clone();
    record_account.patient_did = patient_account.full_name.clone();
    record_account.timestamp = Clock::get()?.unix_timestamp;
    record_account.metadata = metadata;

    emit!(RecordAdded {
        cid: record_account.cid.clone(),
        patient_did: record_account.patient_did.clone(),
        doctor_did: record_account.doctor_did.clone(),
        timestamp: record_account.timestamp,
    });

    Ok(())
}