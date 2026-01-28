# VeriVote
VeriVote - The Aleo program creates a privacy-focused election system with up to 4 candidates/Object/Governace, allowing anyone to set up votes using hidden commitments and nullifiers to prevent double-voting, while publicly tallying results, ending elections, and providing admin controls like extending time or canceling

## Privacy-Preserving Decentralized Elections on Aleo Blockchain

**VeriVote** is a fully on-chain, privacy-first election system built with the Leo programming language on the **Aleo blockchain**. It enables secure, verifiable, and anonymous voting with up to 4 candidates per election. Voter choices remain completely private through zero-knowledge commitments and unique nullifiers that prevent double-voting, while vote counts are transparently tallied publicly on-chain.

This program (`election_voting1212.aleo`) powers tamper-proof elections where:
- Anyone can create an election
- Voters cast private votes
- Admins manage duration, ownership, and finalization
- Results are provably fair and immutable

By leveraging Aleo's zero-knowledge execution environment, VeriVote achieves **true voter anonymity** without relying on off-chain mixers or trusted third parties — a major leap forward for decentralized governance in Web3.

### Why VeriVote Matters in the Web3 Ecosystem

In today's Web3 world, most voting systems (DAOs, governance tokens, community polls) suffer from:
- Lack of privacy → voters can be doxxed or coerced
- Double-voting vulnerabilities
- Central points of failure (off-chain tallying)
- Transparency vs. anonymity trade-offs

**VeriVote solves these** by combining:
- **End-to-end privacy** (vote choice hidden, only aggregates revealed)
- **On-chain public verifiability** (anyone can audit totals and winner)
- **Nullifier-based double-vote prevention** (cryptographic uniqueness per voter per election)
- **No trusted setup** (Aleo's zk-SNARKs are universal)

This makes VeriVote ideal for:
- DAO governance votes
- Community token-holder polls
- Decentralized public elections
- Anonymous quadratic voting experiments
- Private referendums in DAOs or protocols

As Web3 scales toward real-world adoption, privacy-preserving voting becomes critical infrastructure — VeriVote is a foundational building block.

### Scalability & Performance Advantages

Aleo's architecture gives VeriVote strong scalability properties:
- **Private execution**: All sensitive vote logic runs in zero-knowledge, minimizing on-chain data leakage
- **Efficient state updates**: Only public counters (votes per candidate, total_votes) are updated — no per-vote storage bloat
- **Low gas costs**: Fixed 4-candidate design avoids dynamic arrays; simple u32 counters scale well
- **Off-chain proof generation**: Heavy zk computations happen client-side → blockchain only sees succinct proofs
- **Parallelizable**: Multiple elections can run independently without interference

Future scalability roadmap:
- Multi-election support via mappings
- Batch voting (multiple votes in one tx)
- Integration with Aleo credits, USDx for incentivized voting

### Key Features

- **Private Voting**: Uses cryptographic commitments + per-voter nullifiers to hide choices and prevent reuse
- **Public Tallying**: Real-time vote counts visible on-chain
- **Time-Locked Elections**: Automatic end-time enforcement
- **Admin Controls**: Extend duration, transfer ownership, cancel, finalize results
- **Verification Tools**: Check vote validity, election status, current leader, time left
- **Immutable Design**: `@noupgrade` constructor — no post-deployment changes possible
- **Simple & Auditable**: Only 4 candidate slots, clear logic, no external dependencies

### Program Components

1. **Records** (on-chain private data structures)
   - `Election` — title, description, candidates, vote counters, end time, active status
   - `Vote` — voter proof (commitment, nullifier, timestamp)
   - `Result` — finalized winner, vote totals

2. **Transitions** (public callable entry points)
   - `create_election` — anyone starts a new election
   - `cast_vote` — voter submits private choice
   - `end_election` — admin finalizes and declares winner
   - Utility: `verify_vote`, `check_status`, `get_results`, `get_leader`, `time_left_days`, etc.
   - Admin: `extend_election`, `transfer_election`, `cancel_election`

3. **Cryptographic Primitives**
   - BHP256 hashes for commitments and nullifiers
   - Nullifier = hash(caller + election_id + seed) → collision-resistant uniqueness

4. **Constructor**
   ```leo
   @noupgrade
   async constructor() {}
   ```
   Ensures the program is immutable after deployment — maximum security.

### Core Program Functions (Examples)

```leo
// 1. Create Election (anyone)
transition create_election(
    title: field,
    description: field,
    current_time: u64,
    duration_days: u64,
    c1: field, c2: field, c3: field, c4: field
) -> Election { ... }
```

```leo
// 2. Cast Private Vote
transition cast_vote(
    election: Election,
    choice: u8,             // 1–4
    current_time: u64,
    nullifier_seed: field
) -> (Election, Vote) {
    // Validates election active, time not expired, valid candidate
    // Computes nullifier & commitment
    // Increments public vote counter for chosen candidate
    // Returns updated election + private vote proof
}
```

```leo
// 3. End Election & Finalize Winner
transition end_election(
    election: Election,
    current_time: u64
) -> (Election, Result) {
    // Only admin/owner
    // Time must be past end_time
    // Computes winner by comparing public counters
}
```

### Roadmap & Cool Upcoming Features

- **Multi-candidate support** (dynamic candidate lists via mappings)
- **Quadratic voting** (weighted private votes)
- **Delegation** (vote-by-proxy with privacy)
- **Incentive layer** (Aleo credits rewards for participation)
- **DAO integration** (plug-and-play voting module for Aleo-based DAOs)
- **Frontend dApp** (React/Vue + Aleo SDK for beautiful voter/admin interfaces)
- **Cross-chain voting** (bridge votes from Ethereum, Solana via Aleo’s future interoperability)

### Deployment & Interaction

**Testnet/Mainnet Deployment**
- Use Leo CLI: `leo deploy`
- Guide: https://github.com/ProvableHQ/leo

**Interact**
```bash
# Example: Create election
leo execute create_election 23591550407488638065392153794507794895440field 187097780455280392392170548224313401579267733062789169960413271field 1738000000u64 7u64 123456field 789012field 345678field 901234field

# Cast vote (private inputs handled client-side)
leo execute cast_vote ...
```

**Privacy Guarantee**
Voter choice is never revealed — only the hash commitment and nullifier are stored. Anyone can verify the tally matches the commitments via zk-proofs.

**Demo Videos**  
FULL DEMO (Voiceless): https://youtu.be/jQDrBApN9Js 

**Flowchart**  
<img width="1439" height="831" alt="Screenshot from 2026-01-28 17-59-38" src="https://github.com/user-attachments/assets/c3f23817-b6c2-40bf-825a-537cc3720946" />


**Transaction IDs**  
MAINNET: *(Pending – update after deployment)*  
TESTNET PROGRAM: https://testnet.explorer.provable.com/program/election_voting1212.aleo

For full source code, see the repository files.  
Contributions, forks, and PRs are very welcome!  
Let's build private governance together on Aleo. 🚀
