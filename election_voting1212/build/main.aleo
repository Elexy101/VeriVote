program election_voting1212.aleo;

record Election:
    owner as address.private;
    admin as address.private;
    election_id as field.private;
    title as field.private;
    description as field.private;
    candidate1 as field.private;
    votes1 as u32.private;
    candidate2 as field.private;
    votes2 as u32.private;
    candidate3 as field.private;
    votes3 as u32.private;
    candidate4 as field.private;
    votes4 as u32.private;
    end_time as u64.private;
    total_votes as u32.private;
    is_active as boolean.private;

record Vote:
    owner as address.private;
    election_id as field.private;
    voter_address as address.private;
    vote_commitment as field.private;
    nullifier as field.private;
    timestamp as u64.private;
    is_used as boolean.private;

record Result:
    owner as address.private;
    election_id as field.private;
    winner_name as field.private;
    winner_votes as u32.private;
    total_votes_cast as u32.private;
    is_finalized as boolean.private;

function create_election:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as u64.private;
    input r3 as u64.private;
    input r4 as field.private;
    input r5 as field.private;
    input r6 as field.private;
    input r7 as field.private;
    is.neq r0 0field into r8;
    is.neq r4 0field into r9;
    and r8 r9 into r10;
    gt r3 0u64 into r11;
    and r10 r11 into r12;
    ternary r12 true false into r13;
    assert.eq r13 true;
    cast self.caller into r14 as field;
    cast r3 into r15 as field;
    add r14 r15 into r16;
    add r16 r0 into r17;
    add r17 r1 into r18;
    mul r4 r5 into r19;
    mul r19 r6 into r20;
    mul r20 r7 into r21;
    add r18 r21 into r22;
    hash.bhp256 r22 into r23 as field;
    mul r3 86400u64 into r24;
    add r2 r24 into r25;
    cast self.caller self.caller r23 r0 r1 r4 0u32 r5 0u32 r6 0u32 r7 0u32 r25 0u32 true into r26 as Election.record;
    output r26 as Election.record;

function cast_vote:
    input r0 as Election.record;
    input r1 as u8.private;
    input r2 as u64.private;
    input r3 as field.private;
    assert.eq r0.is_active true;
    gt r2 r0.end_time into r4;
    ternary r4 true false into r5;
    assert.eq r5 false;
    gte r1 1u8 into r6;
    lte r1 4u8 into r7;
    and r6 r7 into r8;
    ternary r8 true false into r9;
    assert.eq r9 true;
    is.eq r1 1u8 into r10;
    is.neq r0.candidate1 0field into r11;
    and r10 r11 into r12;
    ternary r12 true false into r13;
    is.eq r1 2u8 into r14;
    is.neq r0.candidate2 0field into r15;
    and r14 r15 into r16;
    ternary r16 true r13 into r17;
    is.eq r1 3u8 into r18;
    is.neq r0.candidate3 0field into r19;
    and r18 r19 into r20;
    ternary r20 true r17 into r21;
    is.eq r1 4u8 into r22;
    is.neq r0.candidate4 0field into r23;
    and r22 r23 into r24;
    ternary r24 true r21 into r25;
    assert.eq r25 true;
    cast self.caller into r26 as field;
    add r26 r0.election_id into r27;
    add r27 r3 into r28;
    hash.bhp256 r28 into r29 as field;
    cast self.caller into r30 as field;
    cast r1 into r31 as field;
    add r30 r31 into r32;
    add r32 r29 into r33;
    cast r2 into r34 as field;
    add r33 r34 into r35;
    hash.bhp256 r35 into r36 as field;
    ternary r10 1u32 0u32 into r37;
    add r0.votes1 r37 into r38;
    ternary r14 1u32 0u32 into r39;
    add r0.votes2 r39 into r40;
    ternary r18 1u32 0u32 into r41;
    add r0.votes3 r41 into r42;
    ternary r22 1u32 0u32 into r43;
    add r0.votes4 r43 into r44;
    add r0.total_votes 1u32 into r45;
    cast r0.owner r0.admin r0.election_id r0.title r0.description r0.candidate1 r38 r0.candidate2 r40 r0.candidate3 r42 r0.candidate4 r44 r0.end_time r45 r0.is_active into r46 as Election.record;
    cast self.caller r0.election_id self.caller r36 r29 r2 true into r47 as Vote.record;
    output r46 as Election.record;
    output r47 as Vote.record;

function end_election:
    input r0 as Election.record;
    input r1 as u64.private;
    is.eq self.caller r0.admin into r2;
    is.eq self.caller r0.owner into r3;
    or r2 r3 into r4;
    ternary r4 true false into r5;
    assert.eq r5 true;
    gt r1 r0.end_time into r6;
    ternary r6 true false into r7;
    assert.eq r7 true;
    gt r0.votes2 r0.votes1 into r8;
    is.neq r0.candidate2 0field into r9;
    and r8 r9 into r10;
    ternary r10 true false into r11;
    ternary r11 r0.candidate2 r0.candidate1 into r12;
    ternary r11 r0.votes2 r0.votes1 into r13;
    gt r0.votes3 r13 into r14;
    is.neq r0.candidate3 0field into r15;
    and r14 r15 into r16;
    ternary r16 true false into r17;
    ternary r17 r0.candidate3 r12 into r18;
    ternary r17 r0.votes3 r13 into r19;
    gt r0.votes4 r19 into r20;
    is.neq r0.candidate4 0field into r21;
    and r20 r21 into r22;
    ternary r22 true false into r23;
    ternary r23 r0.candidate4 r18 into r24;
    ternary r23 r0.votes4 r19 into r25;
    cast r0.owner r0.admin r0.election_id r0.title r0.description r0.candidate1 r0.votes1 r0.candidate2 r0.votes2 r0.candidate3 r0.votes3 r0.candidate4 r0.votes4 r0.end_time r0.total_votes false into r26 as Election.record;
    cast self.caller r0.election_id r24 r25 r0.total_votes true into r27 as Result.record;
    output r26 as Election.record;
    output r27 as Result.record;

function verify_vote:
    input r0 as Vote.record;
    input r1 as field.private;
    input r2 as address.private;
    input r3 as u64.private;
    is.eq r0.election_id r1 into r4;
    ternary r4 true false into r5;
    is.eq r0.voter_address r2 into r6;
    ternary r6 true false into r7;
    gte r3 r0.timestamp into r8;
    ternary r8 true false into r9;
    and r5 r7 into r10;
    and r10 r0.is_used into r11;
    and r11 r9 into r12;
    ternary r12 true false into r13;
    output r13 as boolean.private;

function check_status:
    input r0 as Election.record;
    input r1 as u64.private;
    gt r1 r0.end_time into r2;
    ternary r2 true false into r3;
    not r3 into r4;
    and r0.is_active r4 into r5;
    ternary r5 true false into r6;
    gt r0.end_time r1 into r7;
    sub r0.end_time r1 into r8;
    ternary r7 r8 0u64 into r9;
    cast r9 into r10 as u32;
    output r0.is_active as boolean.private;
    output r3 as boolean.private;
    output r6 as boolean.private;
    output r10 as u32.private;

function get_results:
    input r0 as Election.record;
    gt r0.votes2 r0.votes1 into r1;
    is.neq r0.candidate2 0field into r2;
    and r1 r2 into r3;
    ternary r3 true false into r4;
    ternary r4 r0.candidate2 r0.candidate1 into r5;
    ternary r4 r0.votes2 r0.votes1 into r6;
    gt r0.votes3 r6 into r7;
    is.neq r0.candidate3 0field into r8;
    and r7 r8 into r9;
    ternary r9 true false into r10;
    ternary r10 r0.candidate3 r5 into r11;
    ternary r10 r0.votes3 r6 into r12;
    gt r0.votes4 r12 into r13;
    is.neq r0.candidate4 0field into r14;
    and r13 r14 into r15;
    ternary r15 true false into r16;
    ternary r16 r0.candidate4 r11 into r17;
    ternary r16 r0.votes4 r12 into r18;
    output r17 as field.private;
    output r18 as u32.private;
    output r0.votes1 as u32.private;
    output r0.votes2 as u32.private;
    output r0.votes3 as u32.private;
    output r0.votes4 as u32.private;

function extend_election:
    input r0 as Election.record;
    input r1 as u64.private;
    input r2 as u64.private;
    assert.eq self.caller r0.admin;
    lte r1 30u64 into r3;
    ternary r3 true false into r4;
    assert.eq r4 true;
    mul r1 86400u64 into r5;
    add r0.end_time r5 into r6;
    cast r0.owner r0.admin r0.election_id r0.title r0.description r0.candidate1 r0.votes1 r0.candidate2 r0.votes2 r0.candidate3 r0.votes3 r0.candidate4 r0.votes4 r6 r0.total_votes r0.is_active into r7 as Election.record;
    output r7 as Election.record;

function transfer_election:
    input r0 as Election.record;
    input r1 as address.private;
    assert.eq self.caller r0.admin;
    cast r0.owner r1 r0.election_id r0.title r0.description r0.candidate1 r0.votes1 r0.candidate2 r0.votes2 r0.candidate3 r0.votes3 r0.candidate4 r0.votes4 r0.end_time r0.total_votes r0.is_active into r2 as Election.record;
    output r2 as Election.record;

function cancel_election:
    input r0 as Election.record;
    assert.eq self.caller r0.admin;
    cast r0.owner r0.admin r0.election_id r0.title r0.description r0.candidate1 r0.votes1 r0.candidate2 r0.votes2 r0.candidate3 r0.votes3 r0.candidate4 r0.votes4 r0.end_time r0.total_votes false into r1 as Election.record;
    output r1 as Election.record;

function mirror_election:
    input r0 as Election.record;
    input r1 as u64.private;
    cast self.caller r0.admin r0.election_id r0.title r0.description r0.candidate1 r0.votes1 r0.candidate2 r0.votes2 r0.candidate3 r0.votes3 r0.candidate4 r0.votes4 r0.end_time r0.total_votes r0.is_active into r2 as Election.record;
    output r2 as Election.record;

function time_left_days:
    input r0 as Election.record;
    input r1 as u64.private;
    gt r0.end_time r1 into r2;
    sub r0.end_time r1 into r3;
    ternary r2 r3 0u64 into r4;
    div r4 86400u64 into r5;
    rem r4 86400u64 into r6;
    gt r6 0u64 into r7;
    ternary r7 true false into r8;
    add r5 1u64 into r9;
    ternary r8 r9 r5 into r10;
    output r10 as u64.private;

function get_leader:
    input r0 as Election.record;
    gt r0.votes2 r0.votes1 into r1;
    is.neq r0.candidate2 0field into r2;
    and r1 r2 into r3;
    ternary r3 true false into r4;
    ternary r4 r0.candidate2 r0.candidate1 into r5;
    ternary r4 r0.votes2 r0.votes1 into r6;
    gt r0.votes3 r6 into r7;
    is.neq r0.candidate3 0field into r8;
    and r7 r8 into r9;
    ternary r9 true false into r10;
    ternary r10 r0.candidate3 r5 into r11;
    ternary r10 r0.votes3 r6 into r12;
    gt r0.votes4 r12 into r13;
    is.neq r0.candidate4 0field into r14;
    and r13 r14 into r15;
    ternary r15 true false into r16;
    ternary r16 r0.candidate4 r11 into r17;
    ternary r16 r0.votes4 r12 into r18;
    output r17 as field.private;
    output r18 as u32.private;

function get_totals:
    input r0 as Election.record;
    output r0.total_votes as u32.private;
    output r0.votes1 as u32.private;
    output r0.votes2 as u32.private;
    output r0.votes3 as u32.private;
    output r0.votes4 as u32.private;

function validate_election:
    input r0 as Election.record;
    is.neq r0.title 0field into r1;
    ternary r1 true false into r2;
    is.neq r0.candidate1 0field into r3;
    ternary r3 true false into r4;
    add r0.votes1 r0.votes2 into r5;
    add r5 r0.votes3 into r6;
    add r6 r0.votes4 into r7;
    is.eq r0.total_votes r7 into r8;
    ternary r8 true false into r9;
    and r2 r4 into r10;
    and r10 r9 into r11;
    ternary r11 true false into r12;
    output r12 as boolean.private;

constructor:
    assert.eq edition 0u16;
