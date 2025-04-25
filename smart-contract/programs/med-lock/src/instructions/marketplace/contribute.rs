use anchor_lang::prelude::*;
use crate::{state::{DataPool, ErrorCode}, Contribution, CONTRIBUTION_SEED};

#[derive(Accounts)]
#[instruction(record_id: u64)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub pool: Account<'info, DataPool>,

    #[account(
        init, 
        payer = contributor, 
        space = 8 + Contribution::INIT_SPACE, 
        seeds = [CONTRIBUTION_SEED, &pool.id.to_le_bytes(), &record_id.to_le_bytes(), contributor.key().as_ref()], 
        bump
    )]
    pub contribution: Account<'info, Contribution>,

    #[account(mut)]
    pub contributor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn contribute(ctx: Context<Contribute>, record_id: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    require!(pool.collected < pool.total_needed, ErrorCode::PoolFull);

    let contribution = &mut ctx.accounts.contribution;
    contribution.id = pool.collected;
    contribution.pool_id = pool.id;
    contribution.record_id = record_id;
    contribution.contributor = ctx.accounts.contributor.key();
    contribution.paid = false;

    pool.collected += 1;
    Ok(())
}
