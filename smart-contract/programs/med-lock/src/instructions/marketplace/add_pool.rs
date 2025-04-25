use anchor_lang::prelude::*;
use crate::{state::{DataPool}, POOL_SEED};

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct AddPool<'info> {
    #[account(
        init, 
        payer = creator, 
        space = 8 + DataPool::INIT_SPACE, 
        seeds = [POOL_SEED, creator.key().as_ref(), &id.to_le_bytes()], 
        bump
    )]
    pub pool: Account<'info, DataPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn add_pool(
    ctx: Context<AddPool>, 
    id: u64, 
    name: String, 
    description: String, 
    price_per_record: u64, 
    total_needed: u64
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.id = id;
    pool.creator = ctx.accounts.creator.key();
    pool.name = name;
    pool.description = description;
    pool.price_per_record = price_per_record;
    pool.total_needed = total_needed;
    pool.collected = 0;
    Ok(())
}
