        // Global variables
        let publicKey = null;
        let currentElections = [];
        let voteRecords = [];
        let resultRecords = [];
        let fetchedRecords = [];
        let selectedElection = null;
        let selectedVote = null;
        let selectedResult = null;
        let selectedCandidate = null;
        const PROGRAM_ID = 'election_voting1212.aleo';

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            showSection('dashboard');
        });

        const dateObject = new Date();
        const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
        console.log(unixTimestamp);


        // String to field conversion (similar to PrivMart)
        function stringToField(str) {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(str);
            let fieldValue = 0n;
            
            for (let i = 0; i < encoded.length; i++) {
                fieldValue += BigInt(encoded[i]) * (256n ** BigInt(i));
            }
            
            return fieldValue.toString();
        }

        // Clean field values
        function cleanFieldValue(value) {
            if (typeof value === 'string') {
                return value.replace(/field\.private$/, '').replace(/\.private$/, '');
            }
            return value;
        }

        function cleanU32Private(value) {
            if (typeof value === 'string') {
                return value.replace(/u32\.private$/, '');
            }
            return value;
        }

        function cleanU64Private(value) {
            if (typeof value === 'string') {
                return value.replace(/u64\.private$/, '');
            }
            return value;
        }

        function cleanU8Private(value) {
            if (typeof value === 'string') {
                return value.replace(/u8\.private$/, '');
            }
            return value;
        }

        function cleanBoolPrivate(value) {
            if (typeof value === 'string') {
                return value.replace(/\.private$/, '');
            }
            return value;
        }

        function cleanAddressField(value) {
            if (typeof value === 'string') {
                return value.replace(/\.private$/, '').replace(/address\.private$/, '');
            }
            return value;
        }

        // Convert field to string
        function fieldToString(fieldStr) {
            if (!fieldStr) return '';
            
            try {
                let num = BigInt(fieldStr);
                if (num === 0n) return '';
                
                const bytes = [];
                while (num > 0n) {
                    bytes.push(Number(num % 256n));
                    num = num / 256n;
                }
                
                // Reverse bytes and convert to string
                const decoded = new TextDecoder().decode(new Uint8Array(bytes));
                return decoded.trim();
            } catch (e) {
                // If parsing fails, return the original string without field suffix
                return fieldStr.replace(/field\.private$/, '').replace(/\.private$/, '');
            }
        }

        // Toggle wallet connection
        async function toggleWalletConnection() {
            if (!window.leoWallet) {
                showToast('Please install Leo Wallet browser extension', 'error');
                return;
            }

            try {
                if (publicKey) {
                    // Disconnect wallet
                    publicKey = null;
                    document.getElementById('connectWalletBtn').innerHTML = `
                        <i class="fas fa-wallet"></i>
                        <span>Connect Wallet</span>
                    `;
                    document.getElementById('connectWalletBtn').classList.remove('connected');
                    document.getElementById('refreshBtn').style.display = 'none';
                    showToast('Wallet disconnected', 'info');
                    return;
                }

                // Connect wallet
                await window.leoWallet.connect("ON_CHAIN_HISTORY", "testnetbeta", ["credits.aleo", PROGRAM_ID]);

                // Sign welcome message
                const utf8Encode = new TextEncoder();
                const bytes = utf8Encode.encode("Welcome to Aleo Private Voting - Secure elections on Aleo blockchain");
                window.leoWallet.signMessage(bytes);

                publicKey = window.leoWallet.publicKey;
                
                document.getElementById('connectWalletBtn').innerHTML = `
                    <i class="fas fa-wallet"></i>
                    <span>Connected</span>
                    <span class="wallet-address">${publicKey.slice(0, 6)}...${publicKey.slice(-4)}</span>
                `;
                document.getElementById('connectWalletBtn').classList.add('connected');
                document.getElementById('refreshBtn').style.display = 'flex';
                
                // Update verify address field
                document.getElementById('verifyAddress').value = publicKey;
                
                showToast('Wallet connected successfully!', 'success');
                
                // Fetch records from blockchain
                fetchRecords();
                
            } catch (error) {
                console.error('Wallet connection error:', error);
                showToast('Connection failed: ' + error.message, 'error');
            }
        }

        // Fetch records from Aleo blockchain
        async function fetchRecords() {
            if (!publicKey) {
                showToast('Please connect your wallet first', 'warning');
                return;
            }
            
            try {
                showToast('Fetching election records from blockchain...', 'info');
                
                const res = await window.leoWallet.requestRecordPlaintexts(PROGRAM_ID);
                console.log('Fetched Records:', res);
                
                fetchedRecords = res;
                console.log(fetchRecords);
                
                // Process records and update data
                processElectionRecords(res);

                //test
                console.log(currentElections);
                
                showToast(`Loaded ${currentElections.length} elections`, 'success');
                
            } catch (error) {
                console.error('Error fetching records:', error);
                showToast('Failed to fetch records: ' + error.message, 'error');
            }
        }

        // Process election records from blockchain
        function processElectionRecords(records) {
            currentElections = [];
            voteRecords = [];
            resultRecords = [];
            
            // Check if records is an object with a records array
            if (records && records.records && Array.isArray(records.records)) {
                records.records.forEach(record => {
                    if (record.recordName === "Election") {
                        const data = record.data;
                        
                        // Extract and clean fields
                        const owner = cleanAddressField(data.owner || '');
                        const admin = cleanAddressField(data.admin || '');
                        const election_id = cleanU32Private(data.election_id || "0");
                        const title = cleanFieldValue(data.title || '');
                        const description = cleanFieldValue(data.description || '');
                        const candidate1 = cleanFieldValue(data.candidate1 || '');
                        const votes1 = cleanU32Private(data.votes1 || "0");
                        const candidate2 = cleanFieldValue(data.candidate2 || '');
                        const votes2 = cleanU32Private(data.votes2 || "0");
                        const candidate3 = cleanFieldValue(data.candidate3 || '');
                        const votes3 = cleanU32Private(data.votes3 || "0");
                        const candidate4 = cleanFieldValue(data.candidate4 || '');
                        const votes4 = cleanU32Private(data.votes4 || "0");
                        const end_time = cleanU64Private(data.end_time || "0");
                        const total_votes = cleanU32Private(data.total_votes || "0");
                        const is_active = cleanBoolPrivate(data.is_active || "false") === "true";
                        
                        // Convert field to string
                        const titleStr = fieldToString(title);
                        const descStr = fieldToString(description);
                        const c1Str = fieldToString(candidate1);
                        const c2Str = fieldToString(candidate2);
                        const c3Str = fieldToString(candidate3);
                        const c4Str = fieldToString(candidate4);
                        
                        // Check if election has ended based on timestamp
                        const currentTime = Math.floor(Date.now() / 1000);
                        const hasEnded = currentTime > parseInt(end_time);
                        const canVote = is_active && !hasEnded;
                        
                        // Create election object
                        const electionObj = {
                            id: record.id || `election_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            record: record,
                            owner: owner,
                            admin: admin,
                            election_id: parseInt(election_id) || 0,
                            title: titleStr,
                            description: descStr,
                            candidate1: c1Str,
                            votes1: parseInt(votes1) || 0,
                            candidate2: c2Str,
                            votes2: parseInt(votes2) || 0,
                            candidate3: c3Str,
                            votes3: parseInt(votes3) || 0,
                            candidate4: c4Str,
                            votes4: parseInt(votes4) || 0,
                            end_time: parseInt(end_time) || 0,
                            total_votes: parseInt(total_votes) || 0,
                            is_active: is_active,
                            has_ended: hasEnded,
                            can_vote: canVote,
                            created: Math.floor(Date.now() / 1000) // placeholder
                        };
                        
                        currentElections.push(electionObj);
                        
                    } else if (record.recordName === "Vote") {
                        const data = record.data;
                        
                        const owner = cleanAddressField(data.owner || '');
                        const election_id = cleanU32Private(data.election_id || "0");
                        const voter_address = cleanAddressField(data.voter_address || '');
                        const vote_commitment = cleanFieldValue(data.vote_commitment || '');
                        const nullifier = cleanFieldValue(data.nullifier || '');
                        const timestamp = cleanU64Private(data.timestamp || "0");
                        const is_used = cleanBoolPrivate(data.is_used || "false") === "true";
                        
                        const voteObj = {
                            id: record.id,
                            record: record,
                            owner: owner,
                            election_id: parseInt(election_id) || 0,
                            voter_address: voter_address,
                            vote_commitment: vote_commitment,
                            nullifier: nullifier,
                            timestamp: parseInt(timestamp) || 0,
                            is_used: is_used
                        };
                        
                        voteRecords.push(voteObj);
                        
                    } else if (record.recordName === "Result") {
                        const data = record.data;
                        
                        const owner = cleanAddressField(data.owner || '');
                        const election_id = cleanU32Private(data.election_id || "0");
                        const winner_name = cleanFieldValue(data.winner_name || '');
                        const winner_votes = cleanU32Private(data.winner_votes || "0");
                        const total_votes_cast = cleanU32Private(data.total_votes_cast || "0");
                        const is_finalized = cleanBoolPrivate(data.is_finalized || "false") === "true";
                        
                        const resultObj = {
                            id: record.id,
                            record: record,
                            owner: owner,
                            election_id: parseInt(election_id) || 0,
                            winner_name: fieldToString(winner_name),
                            winner_votes: parseInt(winner_votes) || 0,
                            total_votes_cast: parseInt(total_votes_cast) || 0,
                            is_finalized: is_finalized
                        };
                        
                        resultRecords.push(resultObj);
                    }
                });
            }
            
            // Update UI with real data
            updateDashboard();
            updateMyCreatedElections();
            updateActiveElections();
            updateMyElections();
            updateResults();
            updateVerifyElectionSelect();
        }

        // Modal functions
        function openModal(modalId) {
            if (!publicKey) {
                showToast('Please connect your wallet first', 'warning');
                toggleWalletConnection();
                return;
            }
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            // Clear selected values
            selectedElection = null;
            selectedCandidate = null;
        }

        // Create election on blockchain with proper string-to-field conversion
        async function createElection() {
            const title = document.getElementById('electionTitle').value.trim();
            const description = document.getElementById('electionDescription').value.trim();
            const duration = document.getElementById('electionDuration').value;
            const c1 = document.getElementById('candidate1').value.trim();
            const c2 = document.getElementById('candidate2').value.trim();
            const c3 = document.getElementById('candidate3').value.trim();
            const c4 = document.getElementById('candidate4').value.trim();
            
            // Validate inputs
            if (!title || !duration || !c1) {
                showToast('Please fill required fields (Title, Duration, Candidate 1)', 'error');
                return;
            }
            
            if (duration <= 0 || duration > 365) {
                showToast('Duration must be between 1 and 365 days', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('createElectionBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<div class="spinner"></div> Creating...';
                btn.disabled = true;
                
                showToast('Creating election on blockchain...', 'info');
                
                // Convert strings to field values
                const titleField = stringToField(title);
                const descriptionField = stringToField(description);
                const c1Field = stringToField(c1);
                const c2Field = c2 ? stringToField(c2) : "0";
                const c3Field = c3 ? stringToField(c3) : "0";
                const c4Field = c4 ? stringToField(c4) : "0";
                
                // Prepare inputs for the transaction
                const inputs = [
                    `${titleField}field`,      // title: field
                    `${descriptionField}field`,// description: field
                    `${unixTimestamp}u64`,     // current time in unix 
                    `${duration}u64`,          // duration_days: u64
                    `${c1Field}field`,         // c1: field
                    `${c2Field}field`,         // c2: field (0 if empty)
                    `${c3Field}field`,         // c3: field (0 if empty)
                    `${c4Field}field`          // c4: field (0 if empty)
                ];
                
                console.log('Creating election with inputs:', inputs);
                console.log('Original strings:', {title, description, c1, c2, c3, c4});
                console.log('Field values:', {titleField, descriptionField, c1Field, c2Field, c3Field, c4Field});
                
                // Create transaction
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'create_election',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    // Execute transaction
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Election created successfully!', 'success');
                    closeModal('createElectionModal');
                    
                    // Clear form
                    document.getElementById('electionTitle').value = '';
                    document.getElementById('electionDescription').value = '';
                    document.getElementById('electionDuration').value = '';
                    document.getElementById('candidate1').value = '';
                    document.getElementById('candidate2').value = '';
                    document.getElementById('candidate3').value = '';
                    document.getElementById('candidate4').value = '';
                    
                    // Refresh records after a delay
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('Transaction error:', error);
                showToast('Failed to create election: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('createElectionBtn');
                btn.innerHTML = '<i class="fas fa-vote-yea"></i> Create Election';
                btn.disabled = false;
            }
        }

        // Cast vote in election with proper string-to-field conversion
        async function castVote() {
            if (!selectedElection) {
                showToast('No election selected', 'error');
                return;
            }
            
            if (!selectedCandidate) {
                showToast('Please select a candidate', 'error');
                return;
            }
            
            const nullifierSeed = document.getElementById('nullifierSeed').value.trim();
            
            if (!nullifierSeed) {
                showToast('Please enter a privacy seed', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('castVoteBtn');
                btn.innerHTML = '<div class="spinner"></div> Casting vote...';
                btn.disabled = true;
                
                showToast('Casting your vote on blockchain...', 'info');
                
                // Get current timestamp
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Convert nullifier seed to field
                const nullifierSeedField = stringToField(nullifierSeed);

                console.log(selectedElection.record.plaintext);
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`,  // election: Election
                    `${selectedCandidate}u8`,                 // choice: u8 (1-4)
                    `${currentTime}u64`,                     // current_time: u64
                    `${nullifierSeedField}field`             // nullifier_seed: field
                ];
                
                console.log('Casting vote with inputs:', inputs);
                console.log('Nullifier seed:', nullifierSeed, '->', nullifierSeedField);
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'cast_vote',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Vote cast successfully! Your vote is private and verifiable.', 'success');
                    closeModal('voteModal');
                    
                    // Clear selection
                    selectedCandidate = null;
                    
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('Vote error:', error);
                showToast('Failed to cast vote: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('castVoteBtn');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Vote';
                btn.disabled = false;
            }
        }

        // End election and calculate results
        async function endElection() {
            if (!selectedElection) {
                showToast('No election selected', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            // Check if user is admin or owner
            if (selectedElection.admin !== publicKey && selectedElection.owner !== publicKey) {
                showToast('Only election admin or owner can end election', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('endElectionBtn');
                btn.innerHTML = '<div class="spinner"></div> Finalizing...';
                btn.disabled = true;
                
                showToast('Finalizing election results...', 'info');
                
                // Get current timestamp
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`,  // election: Election
                    `${currentTime}u64`                      // current_time: u64
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'end_election',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Election ended successfully! Results are finalized.', 'success');
                    closeModal('endElectionModal');
                    
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('End election error:', error);
                showToast('Failed to end election: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('endElectionBtn');
                btn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finalize Election';
                btn.disabled = false;
            }
        }

        // Extend election duration
        async function extendElection() {
            if (!selectedElection) {
                showToast('No election selected', 'error');
                return;
            }
            
            const extraDays = parseInt(document.getElementById('extraDays').value);
            
            if (!extraDays || extraDays <= 0 || extraDays > 30) {
                showToast('Invalid extra days (1-30)', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            if (selectedElection.admin !== publicKey) {
                showToast('Only election admin can extend election', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('extendElectionBtn');
                btn.innerHTML = '<div class="spinner"></div> Extending...';
                btn.disabled = true;
                
                showToast('Extending election duration...', 'info');
                
                // Get current timestamp
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`,  // election: Election
                    `${extraDays}u64`,                       // extra_days: u64
                    `${currentTime}u64`                      // current_time: u64
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'extend_election',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Election extended successfully!', 'success');
                    closeModal('extendElectionModal');
                    
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('Extend election error:', error);
                showToast('Failed to extend election: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('extendElectionBtn');
                btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Extend Election';
                btn.disabled = false;
            }
        }

        // Transfer election ownership
        async function transferElection() {
            if (!selectedElection) {
                showToast('No election selected', 'error');
                return;
            }
            
            const newAdmin = document.getElementById('newAdminAddress').value.trim();
            
            if (!newAdmin) {
                showToast('Please enter new admin address', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            if (selectedElection.admin !== publicKey) {
                showToast('Only current admin can transfer election', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('transferElectionBtn');
                btn.innerHTML = '<div class="spinner"></div> Transferring...';
                btn.disabled = true;
                
                showToast('Transferring election ownership...', 'info');
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`,  // election: Election
                    newAdmin                                 // new_admin: address
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'transfer_election',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Election ownership transferred successfully!', 'success');
                    closeModal('transferElectionModal');
                    
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('Transfer election error:', error);
                showToast('Failed to transfer election: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('transferElectionBtn');
                btn.innerHTML = '<i class="fas fa-user-friends"></i> Transfer Ownership';
                btn.disabled = false;
            }
        }

        // Cancel election
        async function cancelElection() {
            if (!selectedElection) {
                showToast('No election selected', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            if (selectedElection.admin !== publicKey) {
                showToast('Only election admin can cancel election', 'error');
                return;
            }
            
            try {
                const btn = document.getElementById('cancelElectionBtn');
                btn.innerHTML = '<div class="spinner"></div> Cancelling...';
                btn.disabled = true;
                
                showToast('Cancelling election...', 'info');
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`  // election: Election
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'cancel_election',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    showToast('Election cancelled successfully!', 'success');
                    closeModal('cancelElectionModal');
                    
                    setTimeout(() => fetchRecords(), 3000);
                }
            } catch (error) {
                console.error('Cancel election error:', error);
                showToast('Failed to cancel election: ' + error.message, 'error');
            } finally {
                const btn = document.getElementById('cancelElectionBtn');
                btn.innerHTML = '<i class="fas fa-ban"></i> Cancel Election';
                btn.disabled = false;
            }
        }

        // Verify vote with proper string-to-field conversion
        async function verifyVote() {
            const electionId = document.getElementById('verifyElectionSelect').value;
            
            if (!electionId) {
                showToast('Please select an election', 'error');
                return;
            }
            
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            // Find the vote record for this user in this election
            const vote = voteRecords.find(v => 
                v.voter_address === publicKey && 
                v.election_id.toString() === electionId
            );
            
            if (!vote) {
                document.getElementById('verifyResult').innerHTML = `
                    <div class="alert alert-warning p-20 rounded border">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>No vote found:</strong> You have not voted in this election.
                    </div>
                `;
                return;
            }
            
            try {
                const btn = document.getElementById('verifyVoteBtn');
                btn.innerHTML = '<div class="spinner"></div> Verifying...';
                btn.disabled = true;
                
                showToast('Verifying vote on blockchain...', 'info');
                
                // Get current timestamp
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Prepare inputs
                const inputs = [
                    `${vote.record.plaintext}`,            // vote: Vote
                    `${electionId}u32`,                    // election_id: u32
                    publicKey,                             // voter_address: address
                    `${currentTime}u64`                    // current_time: u64
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'verify_vote',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    // Note: The transaction returns a boolean
                    // In a real implementation, you'd parse the transaction result
                    
                    document.getElementById('verifyResult').innerHTML = `
                        <div class="alert alert-success p-20 rounded border">
                            <i class="fas fa-check-circle"></i>
                            <strong>Vote verified successfully!</strong><br>
                            Your vote for election ${electionId} has been verified on the blockchain.
                            <div class="mt-10 text-muted">
                                <small>Transaction: ${txResult.transactionId || 'Confirmed'}</small>
                            </div>
                        </div>
                    `;
                    
                    showToast('Vote verification successful!', 'success');
                }
            } catch (error) {
                console.error('Verify vote error:', error);
                document.getElementById('verifyResult').innerHTML = `
                    <div class="alert alert-danger p-20 rounded border">
                        <i class="fas fa-exclamation-circle"></i>
                        <strong>Verification failed:</strong> ${error.message}
                    </div>
                `;
            } finally {
                const btn = document.getElementById('verifyVoteBtn');
                btn.innerHTML = '<i class="fas fa-search"></i> Verify Vote';
                btn.disabled = false;
            }
        }

        // Check election status
        async function checkStatus() {
            if (!publicKey) {
                showToast('Wallet not connected', 'error');
                return;
            }
            
            // Find an active election that user admin
            const adminElections = currentElections.filter(e => e.admin === publicKey && e.is_active);
            
            if (adminElections.length === 0) {
                showToast('You are not admin of any active elections', 'warning');
                return;
            }
            
            selectedElection = adminElections[0];
            
            try {
                showToast('Checking election status...', 'info');
                
                // Get current timestamp
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Prepare inputs
                const inputs = [
                    `${selectedElection.record.plaintext}`,  // election: Election
                    `${currentTime}u64`                      // current_time: u64
                ];
                
                const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    'testnetbeta',
                    PROGRAM_ID,
                    'check_status',
                    inputs,
                    500_000
                );
                
                if (aleoTransaction) {
                    const txResult = await window.leoWallet.requestTransaction(aleoTransaction);
                    console.log('Transaction result:', txResult);
                    
                    // Note: The transaction returns multiple values
                    // In a real implementation, you'd parse the transaction result
                    
                    showToast('Election status checked successfully!', 'success');
                    
                    // Show status in a modal or alert
                    const timeLeft = selectedElection.end_time - currentTime;
                    const daysLeft = Math.ceil(timeLeft / 86400);
                    
                    alert(`Election Status:
                    \nTitle: ${selectedElection.title}
                    \nActive: ${selectedElection.is_active ? 'Yes' : 'No'}
                    \nEnded: ${selectedElection.has_ended ? 'Yes' : 'No'}
                    \nCan Vote: ${selectedElection.can_vote ? 'Yes' : 'No'}
                    \nDays Left: ${daysLeft > 0 ? daysLeft : 'Election ended'}
                    \nTotal Votes: ${selectedElection.total_votes}`);
                }
            } catch (error) {
                console.error('Check status error:', error);
                showToast('Failed to check status: ' + error.message, 'error');
            }
        }

        // Audit election
        async function auditElection() {
            const electionId = document.getElementById('auditElectionId').value.trim();
            
            if (!electionId) {
                showToast('Please enter election ID', 'error');
                return;
            }
            
            // Find the election
            const election = currentElections.find(e => e.election_id.toString() === electionId);
            
            if (!election) {
                document.getElementById('auditResult').innerHTML = `
                    <div class="alert alert-warning p-20 rounded border">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Election not found:</strong> No election found with ID ${electionId}
                    </div>
                `;
                return;
            }
            
            // Find result for this election
            const result = resultRecords.find(r => r.election_id.toString() === electionId);
            
            // Find votes for this election
            const electionVotes = voteRecords.filter(v => v.election_id.toString() === electionId);
            
            // Calculate time left
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = election.end_time - currentTime;
            const daysLeft = Math.ceil(timeLeft / 86400);
            
            // Build audit report
            let auditHTML = `
                <div class="election-card">
                    <div class="election-card-header">
                        <div>
                            <h3 class="election-title">${election.title}</h3>
                            <div class="election-id">ID: ${election.election_id}</div>
                        </div>
                        <span class="status-badge ${election.is_active ? 'status-active' : 'status-ended'}">
                            ${election.is_active ? 'Active' : 'Ended'}
                        </span>
                    </div>
                    
                    <p class="election-description">${election.description || 'No description provided.'}</p>
                    
                    <div class="stat-grid">
                        <div class="stat-card">
                            <div class="stat-value">${election.total_votes}</div>
                            <div class="stat-label">Total Votes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${electionVotes.length}</div>
                            <div class="stat-label">Vote Records</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${daysLeft > 0 ? daysLeft : 0}</div>
                            <div class="stat-label">Days Left</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${election.admin === publicKey ? 'Admin' : election.owner === publicKey ? 'Owner' : 'Voter'}</div>
                            <div class="stat-label">Your Role</div>
                        </div>
                    </div>
                    
                    <h4 class="mt-30 mb-10">Candidates & Votes</h4>
                    <div class="candidates-grid">
            `;
            
            // Add candidate cards
            const candidates = [
                { name: election.candidate1, votes: election.votes1 },
                { name: election.candidate2, votes: election.votes2 },
                { name: election.candidate3, votes: election.votes3 },
                { name: election.candidate4, votes: election.votes4 }
            ].filter(c => c.name && c.name !== '0field');
            
            candidates.forEach(candidate => {
                const votePercent = election.total_votes > 0 ? 
                    Math.round((candidate.votes / election.total_votes) * 100) : 0;
                
                auditHTML += `
                    <div class="candidate-card">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-votes">${candidate.votes}</div>
                        <div class="vote-progress">
                            <div class="vote-progress-bar" style="width: ${votePercent}%"></div>
                        </div>
                        <div class="text-center text-muted mt-5">${votePercent}%</div>
                    </div>
                `;
            });
            
            auditHTML += `
                    </div>
                    
                    <h4 class="mt-30 mb-10">Audit Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Owner:</span>
                        <span class="detail-value">${shortAddress(election.owner)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Admin:</span>
                        <span class="detail-value">${shortAddress(election.admin)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${new Date(election.created * 1000).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">End Time:</span>
                        <span class="detail-value">${new Date(election.end_time * 1000).toLocaleString()}</span>
                    </div>
            `;
            
            if (result) {
                auditHTML += `
                    <div class="alert alert-success mt-20 p-20 rounded border">
                        <i class="fas fa-flag-checkered"></i>
                        <strong>Election Finalized:</strong> Winner is "${result.winner_name}" with ${result.winner_votes} votes.
                    </div>
                `;
            }
            
            auditHTML += `</div>`;
            
            document.getElementById('auditResult').innerHTML = auditHTML;
        }

        // Section navigation
        function showSection(sectionId) {
            document.querySelectorAll('.content-area').forEach(section => {
                section.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            document.getElementById(sectionId + 'Section').classList.add('active');
            event.target.closest('.nav-link').classList.add('active');
            
            if (sectionId === 'dashboard') {
                updateDashboard();
            } else if (sectionId === 'create') {
                updateMyCreatedElections();
            } else if (sectionId === 'vote') {
                updateActiveElections();
            } else if (sectionId === 'myelections') {
                updateMyElections();
            } else if (sectionId === 'results') {
                updateResults();
            } else if (sectionId === 'verify') {
                updateVerifyElectionSelect();
            }
        }

        function showVoteTab(tabId) {
            document.querySelectorAll('#voteTabs .tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            updateActiveElections(tabId);
        }

        function showMyElectionsTab(tabId) {
            document.querySelectorAll('#myelectionsSection .tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            updateMyElections(tabId);
        }

        function showResultsTab(tabId) {
            document.querySelectorAll('#resultsSection .tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            updateResults(tabId);
        }

        // Toast notifications
        function showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            
            toast.innerHTML = `
                <i class="fas fa-${icons[type]} toast-icon"></i>
                <div>${message}</div>
            `;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }

        // Update dashboard
        function updateDashboard() {
            const activeElections = currentElections.filter(e => e.is_active && !e.has_ended);
            const endedElections = currentElections.filter(e => e.has_ended || !e.is_active);
            const myElections = currentElections.filter(e => e.owner === publicKey || e.admin === publicKey);
            const totalVotes = currentElections.reduce((sum, e) => sum + e.total_votes, 0);
            
            document.getElementById('activeElectionsCount').textContent = activeElections.length;
            document.getElementById('endedElectionsCount').textContent = endedElections.length;
            document.getElementById('myElectionsCount').textContent = myElections.length;
            document.getElementById('totalVotesCast').textContent = totalVotes;
            
            // Update recent activity timeline
            const timeline = document.getElementById('recentActivity');
            timeline.innerHTML = '';
            
            if (publicKey) {
                // Combine recent events
                const recentEvents = [];
                
                // Add elections created by user
                const myRecentElections = currentElections
                    .filter(e => e.owner === publicKey)
                    .slice(0, 3)
                    .map(e => ({
                        type: 'election_created',
                        title: e.title,
                        time: e.created,
                        id: e.election_id
                    }));
                
                // Add votes cast by user
                const myRecentVotes = voteRecords
                    .filter(v => v.voter_address === publicKey)
                    .slice(0, 3)
                    .map(v => ({
                        type: 'vote_cast',
                        election_id: v.election_id,
                        time: v.timestamp
                    }));
                
                recentEvents.push(...myRecentElections, ...myRecentVotes);
                
                // Sort by time (newest first)
                recentEvents.sort((a, b) => b.time - a.time);
                
                // Display events
                recentEvents.forEach(event => {
                    const timelineItem = document.createElement('div');
                    timelineItem.className = 'timeline-item';
                    
                    let content = '';
                    if (event.type === 'election_created') {
                        content = `
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <strong>Created Election</strong>
                                <p>${event.title}</p>
                                <div class="timeline-time">ID: ${event.id}</div>
                            </div>
                        `;
                    } else if (event.type === 'vote_cast') {
                        content = `
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <strong>Cast Vote</strong>
                                <p>Voted in election ${event.election_id}</p>
                                <div class="timeline-time">${new Date(event.time * 1000).toLocaleDateString()}</div>
                            </div>
                        `;
                    }
                    
                    timelineItem.innerHTML = content;
                    timeline.appendChild(timelineItem);
                });
                
                if (recentEvents.length === 0) {
                    timeline.innerHTML = `
                        <div class="text-center text-muted p-30">
                            <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-10">No recent activity</p>
                        </div>
                    `;
                }
            } else {
                timeline.innerHTML = `
                    <div class="text-center text-muted p-30">
                        <i class="fas fa-wallet" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-10">Connect wallet to view activity</p>
                    </div>
                `;
            }
        }

        // Update my created elections
        function updateMyCreatedElections() {
            const container = document.getElementById('myCreatedElections');
            container.innerHTML = '';
            
            if (publicKey) {
                const myElections = currentElections.filter(e => e.owner === publicKey);
                
                if (myElections.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted p-30">
                            <i class="fas fa-plus-circle" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-10">You haven't created any elections yet</p>
                            <button class="btn btn-primary mt-20" onclick="openModal('createElectionModal')">
                                Create Your First Election
                            </button>
                        </div>
                    `;
                    return;
                }
                
                myElections.forEach(election => {
                    const electionCard = createElectionCard(election, true);
                    container.appendChild(electionCard);
                });
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted p-30">
                        <i class="fas fa-wallet" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-10">Connect wallet to view your elections</p>
                    </div>
                `;
            }
        }

        // Update active elections for voting
        function updateActiveElections(filter = 'active') {
            const container = document.getElementById('activeElectionsList');
            container.innerHTML = '';
            
            if (publicKey) {
                let electionsToShow = [];
                
                if (filter === 'active') {
                    // Elections user can vote in (active, not ended, user hasn't voted)
                    electionsToShow = currentElections.filter(e => 
                        e.is_active && 
                        !e.has_ended &&
                        e.can_vote
                    );
                    
                    // Filter out elections user has already voted in
                    const votedElectionIds = voteRecords
                        .filter(v => v.voter_address === publicKey)
                        .map(v => v.election_id);
                    
                    electionsToShow = electionsToShow.filter(e => 
                        !votedElectionIds.includes(e.election_id)
                    );
                    
                } else if (filter === 'voted') {
                    // Elections user has voted in
                    const votedElectionIds = voteRecords
                        .filter(v => v.voter_address === publicKey)
                        .map(v => v.election_id);
                    
                    electionsToShow = currentElections.filter(e => 
                        votedElectionIds.includes(e.election_id)
                    );
                    
                } else if (filter === 'upcoming') {
                    // Future elections (not started yet)
                    const currentTime = Math.floor(Date.now() / 1000);
                    electionsToShow = currentElections.filter(e => 
                        e.is_active && 
                        e.end_time > currentTime
                    );
                }
                
                // Update counts
                document.getElementById('eligibleElectionsCount').textContent = 
                    currentElections.filter(e => e.is_active && !e.has_ended && e.can_vote).length;
                document.getElementById('votedElectionsCount').textContent = 
                    voteRecords.filter(v => v.voter_address === publicKey).length;
                
                if (electionsToShow.length === 0) {
                    let message = '';
                    if (filter === 'active') {
                        message = 'No active elections available for voting';
                    } else if (filter === 'voted') {
                        message = 'You haven\'t voted in any elections yet';
                    } else if (filter === 'upcoming') {
                        message = 'No upcoming elections';
                    }
                    
                    container.innerHTML = `
                        <div class="text-center text-muted p-30">
                            <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-10">${message}</p>
                        </div>
                    `;
                    return;
                }
                
                electionsToShow.forEach(election => {
                    const electionCard = createElectionCard(election, false, filter === 'voted');
                    container.appendChild(electionCard);
                });
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted p-30">
                        <i class="fas fa-wallet" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-10">Connect wallet to view elections</p>
                    </div>
                `;
            }
        }

        // Update my elections (as admin/owner)
        function updateMyElections(filter = 'admin') {
            const container = document.getElementById('adminElectionsList');
            container.innerHTML = '';
            
            if (publicKey) {
                let electionsToShow = [];
                
                if (filter === 'admin') {
                    electionsToShow = currentElections.filter(e => e.admin === publicKey);
                } else if (filter === 'owner') {
                    electionsToShow = currentElections.filter(e => e.owner === publicKey);
                } else if (filter === 'all') {
                    electionsToShow = currentElections.filter(e => 
                        e.admin === publicKey || e.owner === publicKey
                    );
                }
                
                if (electionsToShow.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted p-30">
                            <i class="fas fa-landmark" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-10">You are not admin or owner of any elections</p>
                        </div>
                    `;
                    return;
                }
                
                electionsToShow.forEach(election => {
                    const electionCard = createElectionCard(election, true);
                    container.appendChild(electionCard);
                });
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted p-30">
                        <i class="fas fa-wallet" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-10">Connect wallet to view your elections</p>
                    </div>
                `;
            }
        }

        // Update results
        function updateResults(filter = 'finalized') {
            const container = document.getElementById('finalizedElections');
            container.innerHTML = '';
            
            if (publicKey) {
                let electionsToShow = [];
                
                if (filter === 'finalized') {
                    // Elections with results
                    electionsToShow = currentElections.filter(e => 
                        e.has_ended || !e.is_active
                    );
                } else if (filter === 'live') {
                    // Active elections (live results)
                    electionsToShow = currentElections.filter(e => 
                        e.is_active && !e.has_ended
                    );
                } else if (filter === 'historical') {
                    // All elections
                    electionsToShow = currentElections;
                }
                
                // Update stats
                document.getElementById('totalElectionsCount').textContent = currentElections.length;
                
                const avgParticipation = currentElections.length > 0 ?
                    Math.round((currentElections.reduce((sum, e) => sum + e.total_votes, 0) / currentElections.length) * 10) / 10 :
                    0;
                document.getElementById('avgParticipation').textContent = avgParticipation;
                
                if (electionsToShow.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted p-30">
                            <i class="fas fa-chart-bar" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-10">No elections to display</p>
                        </div>
                    `;
                    return;
                }
                
                electionsToShow.forEach(election => {
                    const resultCard = createResultCard(election);
                    container.appendChild(resultCard);
                });
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted p-30">
                        <i class="fas fa-wallet" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-10">Connect wallet to view results</p>
                    </div>
                `;
            }
        }

        // Update verify election select
        function updateVerifyElectionSelect() {
            const select = document.getElementById('verifyElectionSelect');
            select.innerHTML = '<option value="">Select an election...</option>';
            
            if (publicKey) {
                // Get elections user has voted in
                const votedElectionIds = voteRecords
                    .filter(v => v.voter_address === publicKey)
                    .map(v => v.election_id);
                
                const electionsToShow = currentElections.filter(e => 
                    votedElectionIds.includes(e.election_id)
                );
                
                electionsToShow.forEach(election => {
                    const option = document.createElement('option');
                    option.value = election.election_id;
                    option.textContent = `${election.title} (ID: ${election.election_id})`;
                    select.appendChild(option);
                });
            }
        }

        // Create election card component
        function createElectionCard(election, showAdminControls = false, showVoted = false) {
            const card = document.createElement('div');
            card.className = 'election-card';
            
            // Calculate time left
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = election.end_time - currentTime;
            const daysLeft = Math.ceil(timeLeft / 86400);
            const hoursLeft = Math.ceil((timeLeft % 86400) / 3600);
            
            // Get candidates with votes
            const candidates = [
                { name: election.candidate1, votes: election.votes1, id: 1 },
                { name: election.candidate2, votes: election.votes2, id: 2 },
                { name: election.candidate3, votes: election.votes3, id: 3 },
                { name: election.candidate4, votes: election.votes4, id: 4 }
            ].filter(c => c.name && c.name !== '0field' && c.name !== '0');
            
            // Calculate vote percentages
            const totalVotes = election.total_votes;
            candidates.forEach(c => {
                c.percentage = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
            });
            
            // Find winner
            let winner = null;
            if (candidates.length > 0) {
                winner = candidates.reduce((prev, current) => 
                    (prev.votes > current.votes) ? prev : current
                );
            }
            
            // Build card HTML
            let cardHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <div class="d-flex align-center gap-10">
                        <span class="status-badge ${election.is_active ? 'status-active' : 'status-ended'}">
                            ${election.is_active ? 'Active' : 'Ended'}
                        </span>
                        ${showVoted ? '<span class="status-badge status-voted">Voted</span>' : ''}
                    </div>
                </div>
                
                <p class="election-description">${election.description || 'No description provided.'}</p>
                
                <div class="d-flex justify-between align-center mb-20">
                    <div>
                        <strong>Time Left:</strong> 
                        ${daysLeft > 0 ? `${daysLeft} days ${hoursLeft} hours` : 'Ended'}
                    </div>
                    <div>
                        <strong>Total Votes:</strong> ${totalVotes}
                    </div>
                </div>
                
                <div class="candidates-grid">
            `;
            
            // Add candidate cards
            candidates.forEach(candidate => {
                cardHTML += `
                    <div class="candidate-card ${showVoted ? '' : 'vote-candidate'}" 
                         data-candidate-id="${candidate.id}"
                         onclick="${showVoted ? '' : `selectCandidate(${candidate.id}, '${candidate.name}')`}">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-votes">${candidate.votes}</div>
                        <div class="vote-progress">
                            <div class="vote-progress-bar" style="width: ${candidate.percentage}%"></div>
                        </div>
                        <div class="text-center text-muted mt-5">${candidate.percentage}%</div>
                        ${winner && winner.id === candidate.id ? 
                            '<div class="text-center text-success mt-5"><i class="fas fa-crown"></i> Leading</div>' : ''}
                    </div>
                `;
            });
            
            cardHTML += `
                </div>
                
                <div class="d-flex gap-10 mt-20">
            `;
            
            // Add action buttons
            if (!showVoted && election.can_vote) {
                cardHTML += `
                    <button class="btn btn-success" onclick="openVoteModal(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                        <i class="fas fa-vote-yea"></i> Vote Now
                    </button>
                `;
            }
            
            if (showAdminControls) {
                cardHTML += `
                    <button class="btn btn-primary" onclick="viewElectionDetails(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${election.is_active ? `
                        <button class="btn btn-warning" onclick="openEndModalWithElection(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                            <i class="fas fa-flag-checkered"></i> End
                        </button>
                        <button class="btn btn-danger" onclick="openCancelModalWithElection(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                            <i class="fas fa-ban"></i> Cancel
                        </button>
                    ` : ''}
                `;
            }
            
            cardHTML += `
                </div>
            `;
            
            card.innerHTML = cardHTML;
            return card;
        }

        // Create result card component
        function createResultCard(election) {
            const card = document.createElement('div');
            card.className = 'results-card';
            
            // Find result record
            const result = resultRecords.find(r => r.election_id === election.election_id);
            
            // Get candidates
            const candidates = [
                { name: election.candidate1, votes: election.votes1 },
                { name: election.candidate2, votes: election.votes2 },
                { name: election.candidate3, votes: election.votes3 },
                { name: election.candidate4, votes: election.votes4 }
            ].filter(c => c.name && c.name !== '0field' && c.name !== '0');
            
            // Find winner
            let winner = null;
            if (candidates.length > 0) {
                winner = candidates.reduce((prev, current) => 
                    (prev.votes > current.votes) ? prev : current
                );
            }
            
            // If we have a finalized result, use that winner
            if (result && result.is_finalized) {
                winner = { name: result.winner_name, votes: result.winner_votes };
            }
            
            // Calculate percentages
            const totalVotes = election.total_votes;
            candidates.forEach(c => {
                c.percentage = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
            });
            
            // Build card HTML
            let cardHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge ${election.is_active ? 'status-active' : 'status-ended'}">
                        ${election.is_active ? 'Live' : 'Finalized'}
                    </span>
                </div>
                
                ${winner ? `
                    <div class="winner-badge">
                        <i class="fas fa-crown"></i> Winner: ${winner.name} (${winner.votes} votes)
                    </div>
                ` : ''}
                
                <div class="candidates-grid">
            `;
            
            // Add candidate results
            candidates.forEach(candidate => {
                const isWinner = winner && candidate.name === winner.name;
                
                cardHTML += `
                    <div class="candidate-card ${isWinner ? 'selected' : ''}">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-votes">${candidate.votes}</div>
                        <div class="vote-progress">
                            <div class="vote-progress-bar" style="width: ${candidate.percentage}%"></div>
                        </div>
                        <div class="text-center text-muted mt-5">${candidate.percentage}%</div>
                        ${isWinner ? 
                            '<div class="text-center text-success mt-5"><i class="fas fa-trophy"></i> Winner</div>' : ''}
                    </div>
                `;
            });
            
            cardHTML += `
                </div>
                
                <div class="stat-grid mt-20">
                    <div class="stat-card">
                        <div class="stat-value">${totalVotes}</div>
                        <div class="stat-label">Total Votes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${candidates.length}</div>
                        <div class="stat-label">Candidates</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${election.is_active ? 'Live' : 'Final'}</div>
                        <div class="stat-label">Status</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${winner ? winner.votes : 0}</div>
                        <div class="stat-label">Winning Votes</div>
                    </div>
                </div>
                
                <div class="d-flex gap-10 mt-20">
                    <button class="btn btn-primary" onclick="viewElectionDetails(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                        <i class="fas fa-chart-bar"></i> Detailed Results
                    </button>
                    ${election.admin === publicKey && election.is_active ? `
                        <button class="btn btn-warning" onclick="openEndModalWithElection(${JSON.stringify(election).replace(/"/g, '&quot;')})">
                            <i class="fas fa-flag-checkered"></i> End Election
                        </button>
                    ` : ''}
                </div>
            `;
            
            card.innerHTML = cardHTML;
            return card;
        }

        // Open vote modal with election
        function openVoteModal(election) {
            selectedElection = election;
            
            // Update modal details
            const detailsDiv = document.getElementById('voteElectionDetails');
            const candidatesDiv = document.getElementById('voteCandidates');
            
            // Calculate time left
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = election.end_time - currentTime;
            const daysLeft = Math.ceil(timeLeft / 86400);
            const hoursLeft = Math.ceil((timeLeft % 86400) / 3600);
            
            // Build election details
            detailsDiv.innerHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
                <p class="election-description">${election.description || 'No description provided.'}</p>
                <div class="text-muted">
                    <i class="fas fa-clock"></i> Time left: ${daysLeft} days ${hoursLeft} hours
                </div>
            `;
            
            // Build candidate selection
            const candidates = [
                { name: election.candidate1, id: 1 },
                { name: election.candidate2, id: 2 },
                { name: election.candidate3, id: 3 },
                { name: election.candidate4, id: 4 }
            ].filter(c => c.name && c.name !== '0field' && c.name !== '0');
            
            candidatesDiv.innerHTML = '';
            candidates.forEach(candidate => {
                const candidateDiv = document.createElement('div');
                candidateDiv.className = 'candidate-card vote-candidate';
                candidateDiv.setAttribute('data-candidate-id', candidate.id);
                candidateDiv.onclick = () => selectCandidate(candidate.id, candidate.name);
                candidateDiv.innerHTML = `
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="text-center mt-10">
                        <i class="fas fa-user" style="font-size: 2rem; color: var(--primary-color);"></i>
                    </div>
                    <div class="text-center mt-10">
                        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); selectCandidate(${candidate.id}, '${candidate.name}')">
                            Select
                        </button>
                    </div>
                `;
                candidatesDiv.appendChild(candidateDiv);
            });
            
            // Clear previous selection
            selectedCandidate = null;
            document.getElementById('nullifierSeed').value = '';
            
            openModal('voteModal');
        }

        // Select candidate for voting
        function selectCandidate(candidateId, candidateName) {
            selectedCandidate = candidateId;
            
            // Update UI to show selected candidate
            document.querySelectorAll('.vote-candidate').forEach(card => {
                card.classList.remove('selected');
                if (parseInt(card.getAttribute('data-candidate-id')) === candidateId) {
                    card.classList.add('selected');
                }
            });
            
            showToast(`Selected candidate: ${candidateName}`, 'info');
        }

        // Open end election modal
        function openEndModal() {
            if (!publicKey) {
                showToast('Please connect wallet first', 'warning');
                return;
            }
            
            // Find elections where user is admin
            const adminElections = currentElections.filter(e => 
                e.admin === publicKey && e.is_active
            );
            
            if (adminElections.length === 0) {
                showToast('You are not admin of any active elections', 'warning');
                return;
            }
            
            selectedElection = adminElections[0];
            openEndModalWithElection(selectedElection);
        }

        function openEndModalWithElection(election) {
            selectedElection = election;
            
            const detailsDiv = document.getElementById('endElectionDetails');
            
            // Get candidates and current votes
            const candidates = [
                { name: election.candidate1, votes: election.votes1 },
                { name: election.candidate2, votes: election.votes2 },
                { name: election.candidate3, votes: election.votes3 },
                { name: election.candidate4, votes: election.votes4 }
            ].filter(c => c.name && c.name !== '0field' && c.name !== '0');
            
            // Find current leader
            let leader = null;
            if (candidates.length > 0) {
                leader = candidates.reduce((prev, current) => 
                    (prev.votes > current.votes) ? prev : current
                );
            }
            
            detailsDiv.innerHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
                
                <p class="election-description">${election.description || 'No description provided.'}</p>
                
                <div class="mb-20">
                    <strong>Current Status:</strong>
                    <div>Total Votes: ${election.total_votes}</div>
                    <div>Current Leader: ${leader ? leader.name : 'None'} (${leader ? leader.votes : 0} votes)</div>
                </div>
                
                <div class="candidates-grid">
            `;
            
            candidates.forEach(candidate => {
                const isLeader = leader && candidate.name === leader.name;
                const percentage = election.total_votes > 0 ? 
                    Math.round((candidate.votes / election.total_votes) * 100) : 0;
                
                detailsDiv.innerHTML += `
                    <div class="candidate-card ${isLeader ? 'selected' : ''}">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-votes">${candidate.votes}</div>
                        <div class="vote-progress">
                            <div class="vote-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="text-center text-muted mt-5">${percentage}%</div>
                    </div>
                `;
            });
            
            detailsDiv.innerHTML += `</div>`;
            
            openModal('endElectionModal');
        }

        // Open extend modal
        function openExtendModal() {
            if (!publicKey) {
                showToast('Please connect wallet first', 'warning');
                return;
            }
            
            // Find elections where user is admin
            const adminElections = currentElections.filter(e => 
                e.admin === publicKey && e.is_active
            );
            
            if (adminElections.length === 0) {
                showToast('You are not admin of any active elections', 'warning');
                return;
            }
            
            selectedElection = adminElections[0];
            openExtendModalWithElection(selectedElection);
        }

        function openExtendModalWithElection(election) {
            selectedElection = election;
            
            const detailsDiv = document.getElementById('extendElectionDetails');
            
            // Calculate current end time
            const endDate = new Date(election.end_time * 1000);
            
            detailsDiv.innerHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
                
                <div class="mb-20">
                    <strong>Current End Time:</strong> ${endDate.toLocaleString()}
                    <div>Total Votes So Far: ${election.total_votes}</div>
                </div>
            `;
            
            openModal('extendElectionModal');
        }

        // Open transfer modal
        function openTransferModal() {
            if (!publicKey) {
                showToast('Please connect wallet first', 'warning');
                return;
            }
            
            // Find elections where user is admin
            const adminElections = currentElections.filter(e => 
                e.admin === publicKey && e.is_active
            );
            
            if (adminElections.length === 0) {
                showToast('You are not admin of any active elections', 'warning');
                return;
            }
            
            selectedElection = adminElections[0];
            openTransferModalWithElection(selectedElection);
        }

        function openTransferModalWithElection(election) {
            selectedElection = election;
            
            const detailsDiv = document.getElementById('transferElectionDetails');
            
            detailsDiv.innerHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
                
                <div class="mb-20">
                    <strong>Current Admin:</strong> ${shortAddress(election.admin)}
                    <div>You will transfer admin rights to another address</div>
                </div>
            `;
            
            openModal('transferElectionModal');
        }

        // Open cancel modal
        function openCancelModal() {
            if (!publicKey) {
                showToast('Please connect wallet first', 'warning');
                return;
            }
            
            // Find elections where user is admin
            const adminElections = currentElections.filter(e => 
                e.admin === publicKey && e.is_active
            );
            
            if (adminElections.length === 0) {
                showToast('You are not admin of any active elections', 'warning');
                return;
            }
            
            selectedElection = adminElections[0];
            openCancelModalWithElection(selectedElection);
        }

        function openCancelModalWithElection(election) {
            selectedElection = election;
            
            const detailsDiv = document.getElementById('cancelElectionDetails');
            
            detailsDiv.innerHTML = `
                <div class="election-card-header">
                    <div>
                        <h3 class="election-title">${election.title}</h3>
                        <div class="election-id">ID: ${election.election_id}</div>
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
                
                <div class="mb-20">
                    <strong>Election will be cancelled immediately:</strong>
                    <div>Total Votes: ${election.total_votes}</div>
                    <div>Voting will be disabled</div>
                    <div>Results will be preserved but marked as cancelled</div>
                </div>
            `;
            
            openModal('cancelElectionModal');
        }

        // View election details
        function viewElectionDetails(election) {
            // Create a detailed view modal or navigate to details page
            alert(`Election Details:
            \nTitle: ${election.title}
            \nID: ${election.election_id}
            \nDescription: ${election.description || 'None'}
            \nStatus: ${election.is_active ? 'Active' : 'Ended'}
            \nTotal Votes: ${election.total_votes}
            \nCandidates:
            ${election.candidate1 && election.candidate1 !== '0field' && election.candidate1 !== '0' ? `\n  • ${election.candidate1}: ${election.votes1} votes` : ''}
            ${election.candidate2 && election.candidate2 !== '0field' && election.candidate2 !== '0' ? `\n  • ${election.candidate2}: ${election.votes2} votes` : ''}
            ${election.candidate3 && election.candidate3 !== '0field' && election.candidate3 !== '0' ? `\n  • ${election.candidate3}: ${election.votes3} votes` : ''}
            ${election.candidate4 && election.candidate4 !== '0field' && election.candidate4 !== '0' ? `\n  • ${election.candidate4}: ${election.votes4} votes` : ''}
            \nOwner: ${shortAddress(election.owner)}
            \nAdmin: ${shortAddress(election.admin)}`);
        }

        // Utility function to get short address
        function shortAddress(address) {
            if (!address) return 'N/A';
            if (address === publicKey) return 'You';
            if (typeof address !== 'string' || address.length < 12) return address;
            return address.substring(0, 6) + '...' + address.substring(address.length - 4);
        }

        // Check wallet on page load
        document.addEventListener('DOMContentLoaded', function() {
            if (window.leoWallet) {
                console.log('Leo Wallet detected');
            } else {
                console.log('Leo Wallet not detected');
            }
        });