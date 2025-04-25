use anchor_lang::prelude::*;
use crate::{state::{User, UserRegistered, UserRole, Gender}, USER_SEED};

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
    nik: String,
    full_name: String,
    blood_type: String,
    birthdate: i64,
    gender: Gender,
    email: String,
    phone_number: String,
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let authority = &ctx.accounts.authority;

    user_account.public_key = authority.key();
    user_account.nik = nik.clone();
    user_account.full_name = full_name.clone();
    user_account.blood_type = blood_type;
    user_account.birthdate = birthdate;
    user_account.gender = gender;
    user_account.email = email.clone();
    user_account.phone_number = phone_number;
    user_account.role = UserRole::Patient;
    user_account.created_at = Clock::get()?.unix_timestamp;

    emit!(UserRegistered {
        nik,
        full_name,
        role: user_account.role.clone(),
        email,
        timestamp: user_account.created_at,
    });

    Ok(())
}