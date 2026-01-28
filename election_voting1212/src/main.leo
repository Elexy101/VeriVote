program election_voting1212.aleo {

    @noupgrade
    async constructor() {}

    // ==============================================
    // RECORD DEFINITIONS
    // ==============================================

    // Election record that anyone can create
    record Election {
        owner: address,
        admin: address,
        election_id: field,
        title: field,
        description: field,
        // 4 fixed candidate slots (use 0field for empty)
        candidate1: field, votes1: u32,
        candidate2: field, votes2: u32,
        candidate3: field, votes3: u32,
        candidate4: field, votes4: u32,
        end_time: u64,        // Relative or absolute time
        total_votes: u32,
        is_active: bool
    }

    // Vote record that proves someone voted
    record Vote {
        owner: address,
        election_id: field,
        voter_address: address,
        vote_commitment: field,
        nullifier: field,
        timestamp: u64,
        is_used: bool
    }

    // Result record for election outcome
    record Result {
        owner: address,
        election_id: field,
        winner_name: field,
        winner_votes: u32,
        total_votes_cast: u32,
        is_finalized: bool
    }

    // ==============================================
    // ELECTION FUNCTIONS
    // ==============================================

    // 1. CREATE - Create new election
    transition create_election(
        title: field,
        description: field,
        current_time: u64, //in unix timestamp
        duration_days: u64,
        c1: field,
        c2: field,
        c3: field,
        c4: field
    ) -> Election {
        // Validate inputs
        let valid: bool = title != 0field && c1 != 0field && duration_days > 0u64 ? true : false;
        assert_eq(valid, true);
        
        // Generate election ID from caller address, duration_days, field, title, description and options (simulated)
        let id_seed: field = BHP256::hash_to_field(self.caller as field + duration_days as field + title + description + c1 * c2 * c3 * c4);
        let election_id: field = id_seed;
        
        // Calculate end time (relative, in seconds)
        let seconds_per_day: u64 = 86400u64;
        let end_time: u64 = current_time + (duration_days * seconds_per_day);
        
        return Election {
            owner: self.caller,
            admin: self.caller,
            election_id: election_id,
            title: title,
            description: description,
            candidate1: c1, votes1: 0u32,
            candidate2: c2, votes2: 0u32,
            candidate3: c3, votes3: 0u32,
            candidate4: c4, votes4: 0u32,
            end_time: end_time,
            total_votes: 0u32,
            is_active: true
        };
    }

    // 2. VOTE - Cast a vote in an election
    transition cast_vote(
        election: Election,
        choice: u8,
        current_time: u64,
        nullifier_seed: field
    ) -> (Election, Vote) {
        // Check election status
        assert_eq(election.is_active, true);
        
        // Check if election has ended
        let has_ended: bool = current_time > election.end_time ? true : false;
        assert_eq(has_ended, false);
        
        // Validate choice
        let valid_choice: bool = choice >= 1u8 && choice <= 4u8 ? true : false;
        assert_eq(valid_choice, true);
        
        // Check if candidate exists
        let candidate_exists: bool = false;
        candidate_exists = choice == 1u8 && election.candidate1 != 0field ? true : candidate_exists;
        candidate_exists = choice == 2u8 && election.candidate2 != 0field ? true : candidate_exists;
        candidate_exists = choice == 3u8 && election.candidate3 != 0field ? true : candidate_exists;
        candidate_exists = choice == 4u8 && election.candidate4 != 0field ? true : candidate_exists;
        assert_eq(candidate_exists, true);
        
        // Create unique nullifier to prevent double voting
        let nullifier: field = BHP256::hash_to_field(
            self.caller as field + 
            election.election_id  + 
            nullifier_seed
        );
        
        // Create vote commitment (hides the actual choice)
        let vote_commitment: field = BHP256::hash_to_field(
            self.caller as field + 
            choice as field + 
            nullifier + 
            current_time as field
        );
        
        // Update election with new vote
        let v1: u32 = election.votes1 + (choice == 1u8 ? 1u32 : 0u32);
        let v2: u32 = election.votes2 + (choice == 2u8 ? 1u32 : 0u32);
        let v3: u32 = election.votes3 + (choice == 3u8 ? 1u32 : 0u32);
        let v4: u32 = election.votes4 + (choice == 4u8 ? 1u32 : 0u32);
        
        let updated_election: Election = Election {
            owner: election.owner,
            admin: election.admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: v1,
            candidate2: election.candidate2, votes2: v2,
            candidate3: election.candidate3, votes3: v3,
            candidate4: election.candidate4, votes4: v4,
            end_time: election.end_time,
            total_votes: election.total_votes + 1u32,
            is_active: election.is_active
        };
        
        // Create vote proof
        let vote_proof: Vote = Vote {
            owner: self.caller,
            election_id: election.election_id,
            voter_address: self.caller,
            vote_commitment: vote_commitment,
            nullifier: nullifier,
            timestamp: current_time,
            is_used: true
        };
        
        return (updated_election, vote_proof);
    }

    // 3. END - End election and calculate results
    transition end_election(
        election: Election,
        current_time: u64
    ) -> (Election, Result) {
        // Only admin or owner can end election
        let can_end: bool = self.caller == election.admin || self.caller == election.owner ? true : false;
        assert_eq(can_end, true);
        
        // Check if election can be ended
        let can_be_ended: bool = current_time > election.end_time ? true : false;
        assert_eq(can_be_ended, true);
        
        // Calculate winner
        let winner_name: field = election.candidate1;
        let max_votes: u32 = election.votes1;
        
        // Check candidate 2
        let candidate2_better: bool = election.votes2 > max_votes && election.candidate2 != 0field ? true : false;
        winner_name = candidate2_better ? election.candidate2 : winner_name;
        max_votes = candidate2_better ? election.votes2 : max_votes;
        
        // Check candidate 3
        let candidate3_better: bool = election.votes3 > max_votes && election.candidate3 != 0field ? true : false;
        winner_name = candidate3_better ? election.candidate3 : winner_name;
        max_votes = candidate3_better ? election.votes3 : max_votes;
        
        // Check candidate 4
        let candidate4_better: bool = election.votes4 > max_votes && election.candidate4 != 0field ? true : false;
        winner_name = candidate4_better ? election.candidate4 : winner_name;
        max_votes = candidate4_better ? election.votes4 : max_votes;
        
        // Create finalized election
        let finalized_election: Election = Election {
            owner: election.owner,
            admin: election.admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: election.votes1,
            candidate2: election.candidate2, votes2: election.votes2,
            candidate3: election.candidate3, votes3: election.votes3,
            candidate4: election.candidate4, votes4: election.votes4,
            end_time: election.end_time,
            total_votes: election.total_votes,
            is_active: false
        };
        
        // Create result record
        let election_result: Result = Result {
            owner: self.caller,
            election_id: election.election_id,
            winner_name: winner_name,
            winner_votes: max_votes,
            total_votes_cast: election.total_votes,
            is_finalized: true
        };
        
        return (finalized_election, election_result);
    }

    // 4. VERIFY - Verify a vote was cast
    transition verify_vote(
        vote: Vote,
        election_id: field,
        voter_address: address,
        current_time: u64
    ) -> bool {
        // Check vote belongs to this election
        let correct_election: bool = vote.election_id == election_id ? true : false;
        
        // Check vote belongs to this voter
        let correct_voter: bool = vote.voter_address == voter_address ? true : false;
        
        // Check vote was used
        let was_used: bool = vote.is_used;
        
        // Check timestamp is reasonable
        let reasonable_time: bool = current_time >= vote.timestamp ? true : false;
        
        // All checks must pass
        let is_valid: bool = correct_election && correct_voter && was_used && reasonable_time ? true : false;
        
        return is_valid;
    }

    // 5. CHECK - Check election status
    transition check_status(
        election: Election,
        current_time: u64
    ) -> (bool, bool, bool, u32) {
        let is_active: bool = election.is_active;
        let has_ended: bool = current_time > election.end_time ? true : false;
        let can_vote: bool = is_active && !has_ended ? true : false;
        let time_left: u64 = election.end_time > current_time ? election.end_time - current_time : 0u64;
        
        return (is_active, has_ended, can_vote, time_left as u32);
    }

    // 6. RESULTS - Get current results without ending
    transition get_results(election: Election) -> (field, u32, u32, u32, u32, u32) {
        // Calculate current winner
        let winner_name: field = election.candidate1;
        let max_votes: u32 = election.votes1;
        
        let candidate2_better: bool = election.votes2 > max_votes && election.candidate2 != 0field ? true : false;
        winner_name = candidate2_better ? election.candidate2 : winner_name;
        max_votes = candidate2_better ? election.votes2 : max_votes;
        
        let candidate3_better: bool = election.votes3 > max_votes && election.candidate3 != 0field ? true : false;
        winner_name = candidate3_better ? election.candidate3 : winner_name;
        max_votes = candidate3_better ? election.votes3 : max_votes;
        
        let candidate4_better: bool = election.votes4 > max_votes && election.candidate4 != 0field ? true : false;
        winner_name = candidate4_better ? election.candidate4 : winner_name;
        max_votes = candidate4_better ? election.votes4 : max_votes;
        
        return (winner_name, max_votes, election.votes1, election.votes2, election.votes3, election.votes4);
    }

    // 7. EXTEND - Extend election duration
    transition extend_election(
        election: Election,
        extra_days: u64,
        current_time: u64
    ) -> Election {
        // Only admin can extend
        assert_eq(self.caller, election.admin);
        
        // Validate extension
        let valid_extension: bool = extra_days <= 30u64 ? true : false; // Max 30 days
        assert_eq(valid_extension, true);
        
        // Calculate new end time
        let seconds_per_day: u64 = 86400u64;
        let extra_seconds: u64 = extra_days * seconds_per_day;
        let new_end_time: u64 = election.end_time + extra_seconds;
        
        return Election {
            owner: election.owner,
            admin: election.admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: election.votes1,
            candidate2: election.candidate2, votes2: election.votes2,
            candidate3: election.candidate3, votes3: election.votes3,
            candidate4: election.candidate4, votes4: election.votes4,
            end_time: new_end_time,
            total_votes: election.total_votes,
            is_active: election.is_active
        };
    }

    // 8. TRANSFER - Transfer election ownership
    transition transfer_election(
        election: Election,
        new_admin: address
    ) -> Election {
        // Only current admin can transfer
        assert_eq(self.caller, election.admin);
        
        return Election {
            owner: election.owner,
            admin: new_admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: election.votes1,
            candidate2: election.candidate2, votes2: election.votes2,
            candidate3: election.candidate3, votes3: election.votes3,
            candidate4: election.candidate4, votes4: election.votes4,
            end_time: election.end_time,
            total_votes: election.total_votes,
            is_active: election.is_active
        };
    }

    // 9. CANCEL - Cancel election
    transition cancel_election(
        election: Election
    ) -> Election {
        // Only admin can cancel
        assert_eq(self.caller, election.admin);
        
        return Election {
            owner: election.owner,
            admin: election.admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: election.votes1,
            candidate2: election.candidate2, votes2: election.votes2,
            candidate3: election.candidate3, votes3: election.votes3,
            candidate4: election.candidate4, votes4: election.votes4,
            end_time: election.end_time,
            total_votes: election.total_votes,
            is_active: false
        };
    }

    // 10. MIRROR - Create backup of election
    transition mirror_election(
        election: Election,
        current_time: u64
    ) -> Election {
        // Create identical backup with current timestamp
        return Election {
            owner: self.caller,
            admin: election.admin,
            election_id: election.election_id,
            title: election.title,
            description: election.description,
            candidate1: election.candidate1, votes1: election.votes1,
            candidate2: election.candidate2, votes2: election.votes2,
            candidate3: election.candidate3, votes3: election.votes3,
            candidate4: election.candidate4, votes4: election.votes4,
            end_time: election.end_time,
            total_votes: election.total_votes,
            is_active: election.is_active
        };
    }

    // 11. TIME_LEFT - Calculate time left in days
    transition time_left_days(
        election: Election,
        current_time: u64
    ) -> u64 {
        let seconds_per_day: u64 = 86400u64;
        let remaining_seconds: u64 = election.end_time > current_time ? election.end_time - current_time : 0u64;
        let days: u64 = remaining_seconds / seconds_per_day;
        
        // Add 1 if there's a remainder (partial day)
        let has_remainder: bool = (remaining_seconds % seconds_per_day) > 0u64 ? true : false;
        return has_remainder ? days + 1u64 : days;
    }

    // 12. LEADER - Get current leader
    transition get_leader(election: Election) -> (field, u32) {
        // Calculate current leader
        let leader_name: field = election.candidate1;
        let leader_votes: u32 = election.votes1;
        
        let candidate2_leads: bool = election.votes2 > leader_votes && election.candidate2 != 0field ? true : false;
        leader_name = candidate2_leads ? election.candidate2 : leader_name;
        leader_votes = candidate2_leads ? election.votes2 : leader_votes;
        
        let candidate3_leads: bool = election.votes3 > leader_votes && election.candidate3 != 0field ? true : false;
        leader_name = candidate3_leads ? election.candidate3 : leader_name;
        leader_votes = candidate3_leads ? election.votes3 : leader_votes;
        
        let candidate4_leads: bool = election.votes4 > leader_votes && election.candidate4 != 0field ? true : false;
        leader_name = candidate4_leads ? election.candidate4 : leader_name;
        leader_votes = candidate4_leads ? election.votes4 : leader_votes;
        
        return (leader_name, leader_votes);
    }

    // 13. TOTAL - Get total votes per candidate
    transition get_totals(election: Election) -> (u32, u32, u32, u32, u32) {
        return (election.total_votes, election.votes1, election.votes2, election.votes3, election.votes4);
    }

    // 14. VALIDATE - Validate election configuration
    transition validate_election(election: Election) -> bool {
        let valid_title: bool = election.title != 0field ? true : false;
        let valid_candidate1: bool = election.candidate1 != 0field ? true : false;
        let valid_total: bool = election.total_votes == election.votes1 + election.votes2 + election.votes3 + election.votes4 ? true : false;
        
        return valid_title && valid_candidate1 && valid_total ? true : false;
    }
}