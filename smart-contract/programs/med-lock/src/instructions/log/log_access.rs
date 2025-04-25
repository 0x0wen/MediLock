use anchor_lang::prelude::*;
use crate::{state::{AccessLog, AccessLogged, AccessRequest, ErrorCode, RequestStatus, User, UserRole}, LOG_SEED};

#[derive(Accounts)]
#[instruction(nonce: u8, record_cid: String)]
pub struct LogAccess<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 64 + 8 + 32,
        seeds = [LOG_SEED, record_cid.as_bytes(), user_account.key().as_ref(), &[nonce]],
        bump
    )]
    pub access_log: Account<'info, AccessLog>,
    
    #[account(mut)]
    pub user_account: Account<'info, User>,
    
    #[account(
        mut,
        seeds = [b"access", user_account.key().as_ref(), patient_account.key().as_ref()],
        bump,
        constraint = access_request.status == RequestStatus::Approved || 
                    user_account.role == UserRole::Patient
    )]
    pub access_request: Account<'info, AccessRequest>,
    
    #[account(
        constraint = patient_account.role == UserRole::Patient
    )]
    pub patient_account: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn log_access(
    ctx: Context<LogAccess>,
    _nonce: u8,
    record_cid: String,
    action: String,
) -> Result<()> {
    let access_log = &mut ctx.accounts.access_log;
    let user_account = &ctx.accounts.user_account;
    let access_request = &ctx.accounts.access_request;

    if user_account.role == UserRole::Doctor {
        require!(
            access_request.status == RequestStatus::Approved,
            ErrorCode::AccessDenied
        );
        require!(
            access_request.expires_at > Clock::get()?.unix_timestamp,
            ErrorCode::AccessExpired
        );
    }

    access_log.record_cid = record_cid;
    access_log.user_did = user_account.did.clone();
    access_log.timestamp = Clock::get()?.unix_timestamp;
    access_log.action = action;

    emit!(AccessLogged {
        record_cid: access_log.record_cid.clone(),
        user_did: access_log.user_did.clone(),
        action: access_log.action.clone(),
        timestamp: access_log.timestamp,
    });

    Ok(())
}