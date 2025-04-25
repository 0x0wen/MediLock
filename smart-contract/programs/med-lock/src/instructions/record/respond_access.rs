
use anchor_lang::prelude::*;
use crate::{state::{AccessRequest, AccessRequestResponded, ErrorCode, RequestStatus, User, UserRole}, ACCESS_SEED};

#[derive(Accounts)]
pub struct RespondAccess<'info> {
    #[account(
        mut,
        seeds = [ACCESS_SEED, doctor_account.key().as_ref(), patient_account.key().as_ref()],
        bump
    )]
    pub access_request: Account<'info, AccessRequest>,
    
    #[account(
        // constraint = doctor_account.role == UserRole::Doctor
    )]
    pub doctor_account: Account<'info, User>,
    
    #[account(
        constraint = patient_account.role == UserRole::Patient && patient_account.public_key == authority.key() @ ErrorCode::UnauthorizedRole
    )]
    pub patient_account: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn respond_access(
    ctx: Context<RespondAccess>,
    approved: bool,
) -> Result<()> {
    let access_request = &mut ctx.accounts.access_request;
    let patient_account = &ctx.accounts.patient_account;

    // compare two keys, and throws an error if not equal
    require_keys_eq!(
        ctx.accounts.authority.key(),
        patient_account.public_key,
        ErrorCode::UnauthorizedAccess
    );

    access_request.status = if approved {
        RequestStatus::Approved
    } else {
        RequestStatus::Denied
    };
    access_request.responded_at = Clock::get()?.unix_timestamp;

    emit!(AccessRequestResponded {
        doctor_did: access_request.doctor_did.clone(),
        patient_did: access_request.patient_did.clone(),
        approved,
        timestamp: access_request.responded_at,
    });

    Ok(())
}