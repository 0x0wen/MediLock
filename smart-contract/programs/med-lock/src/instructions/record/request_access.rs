use anchor_lang::prelude::*;
use crate::{state::{AccessRequest, AccessRequested, ErrorCode, RequestStatus, User, UserRole}, ACCESS_SEED};

#[derive(Accounts)]
pub struct RequestAccess<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + AccessRequest::INIT_SPACE,
        seeds = [ACCESS_SEED, doctor_account.key().as_ref(), patient_account.key().as_ref()],
        bump
    )]
    pub access_request: Account<'info, AccessRequest>,
    
    #[account(
        constraint = doctor_account.role == UserRole::Doctor @ ErrorCode::UnauthorizedRole
    )]
    pub doctor_account: Account<'info, User>,
    
    #[account(
        constraint = patient_account.role == UserRole::Patient @ ErrorCode::UnauthorizedRole
    )]
    pub patient_account: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn request_access(
    ctx: Context<RequestAccess>,
    scope: String,
    expiration: i64,
) -> Result<()> {
    let access_request = &mut ctx.accounts.access_request;
    let doctor_account = &ctx.accounts.doctor_account;
    let patient_account = &ctx.accounts.patient_account;

    access_request.doctor_did = doctor_account.full_name.clone();
    access_request.patient_did = patient_account.full_name.clone();
    access_request.requested_at = Clock::get()?.unix_timestamp;
    access_request.scope = scope;
    access_request.expires_at = expiration;
    access_request.status = RequestStatus::Pending;

    emit!(AccessRequested {
        doctor_did: access_request.doctor_did.clone(),
        patient_did: access_request.patient_did.clone(),
        timestamp: access_request.requested_at,
    });

    Ok(())
}
