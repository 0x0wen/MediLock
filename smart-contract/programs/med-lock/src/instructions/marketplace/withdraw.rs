use anchor_lang::prelude::*;
use crate::{state::{ErrorCode, DataPool}, Contribution};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub pool: Account<'info, DataPool>,

    #[account(mut,
        constraint = contributor.key() == contribution.contributor @ ErrorCode::UnauthorizedAccess,
        constraint = !contribution.paid @ ErrorCode::AlreadyPaid)]
    pub contributor: Signer<'info>,

    /// CHECK: This is the PDA vault for the pool
    #[account(mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump)]
    pub pool_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
    let pool = &ctx.accounts.pool;
    let amount = pool.price_per_record;
    
    // Get the PDA bump
    let seeds = &[
        b"vault",
        pool.to_account_info().key.as_ref(),
        &[ctx.bumps.pool_vault]
    ];
    let signer = &[&seeds[..]];
    
    // Transfer funds using the system program
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.contributor.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;
    
    // Mark the contribution as paid
    let contribution = &mut ctx.accounts.contribution;
    contribution.paid = true;
    
    Ok(())
}