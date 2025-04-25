pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB");

#[program]
pub mod medilock {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
    
    pub fn register(
        ctx: Context<Register>, 
        nik: String, 
        full_name: String,
        blood_type: String,
        birthdate: i64,
        gender: Gender,
        email: String,
        phone_number: String
    ) -> Result<()> {
        register::register(ctx, nik, full_name, blood_type, birthdate, gender, email, phone_number)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        marketplace::withdraw(ctx)
    }

    pub fn contribute(ctx: Context<Contribute>, record_id: u64) -> Result<()>{
        marketplace::contribute(ctx,record_id)
    } 

    pub fn add_pool(ctx: Context<AddPool>, id: u64, name: String, description: String, price_per_record: u64, total_needed: u64) -> Result<()>{
        marketplace::add_pool(ctx, id, name, description, price_per_record, total_needed)
    }

    pub fn add_record(
        ctx: Context<AddRecord>,
        record_counter: u8,
        cid: String,
        metadata: String,
    ) -> Result<()> {
        record::add_record(ctx, record_counter, cid, metadata)
    }

    pub fn request_access(
        ctx: Context<RequestAccess>,
        scope: String,
        expiration: i64,
    ) -> Result<()> {
        record::request_access(ctx, scope, expiration)
    }

    pub fn respond_access(
        ctx: Context<RespondAccess>,
        approved: bool,
    ) -> Result<()> {
        record::respond_access(ctx, approved)
    }
}
