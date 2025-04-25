use anchor_lang::prelude::*;
use crate::{state::{User, UserRegistered, UserRole}, USER_SEED};

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + User::INIT_SPACE,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn register(
    ctx: Context<Register>,
    did: String,
    role: UserRole,
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let authority = &ctx.accounts.authority;

    user_account.did = did;
    user_account.public_key = authority.key();
    user_account.role = role;
    user_account.created_at = Clock::get()?.unix_timestamp;

    emit!(UserRegistered {
        did: user_account.did.clone(),
        role: user_account.role.clone(),
        timestamp: user_account.created_at,
    });

    Ok(())
}