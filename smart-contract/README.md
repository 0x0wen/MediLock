# medilock
 
### Run the Smart Contract on with Local Validator
1. Run the local validator
```bash
    solana-test-validator
```
2. Build the smart contract
```bash
    anchor build
```
3. Deploy the program
```bash
    anchor deploy
```
4. Sync the keys
```bash
    anchor keys sync 
```

### Test the instructions
```bash
    anchor test --skip-local-validator --skip-deploy
```