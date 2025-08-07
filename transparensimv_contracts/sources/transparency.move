// File: sources/transparency.move
// TransparensiMY - Malaysian Government Transparency Smart Contract

module transparency::transparency {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // Error codes
    const EInvalidStatus: u64 = 1;
    const EInvalidRating: u64 = 2;
    const EUnauthorized: u64 = 3;

    // Spending record stored on blockchain
    public struct SpendingRecord has key, store {
        id: UID,
        department: String,
        project_name: String,
        allocated_amount: u64,
        spent_amount: u64,
        date: String,
        status: u8, // 0=planned, 1=ongoing, 2=completed, 3=cancelled
        description: String,
        contractor: String,
        location: String,
        submitter: address,
        created_at: u64,
    }

    // Citizen feedback stored on blockchain
    public struct CitizenFeedback has key, store {
        id: UID,
        project_id: String,
        rating: u8, // 1-5 stars
        message_hash: String, // SHA-256 hash for privacy
        is_anonymous: bool,
        submitter: address,
        created_at: u64,
    }

    // Government official registry (for access control)
    public struct GovernmentOfficial has key {
        id: UID,
        official_address: address,
        department: String,
        email_domain: String,
        verified: bool,
        registered_at: u64,
    }

    // Events for indexing and frontend
    public struct SpendingRecordCreated has copy, drop {
        record_id: address,
        department: String,
        project_name: String,
        allocated_amount: u64,
        spent_amount: u64,
        submitter: address,
        timestamp: u64,
    }

    public struct FeedbackSubmitted has copy, drop {
        feedback_id: address,
        project_id: String,
        rating: u8,
        is_anonymous: bool,
        submitter: address,
        timestamp: u64,
    }

    public struct OfficialRegistered has copy, drop {
        official_address: address,
        department: String,
        email_domain: String,
        timestamp: u64,
    }

    // === Public Functions ===

    /// Create new spending record (Government officials)
    #[allow(lint(self_transfer))]
    public fun create_spending_record(
        department: vector<u8>,
        project_name: vector<u8>,
        allocated_amount: u64,
        spent_amount: u64,
        date: vector<u8>,
        status: u8,
        description: vector<u8>,
        contractor: vector<u8>,
        location: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Validate status (0-3)
        assert!(status <= 3, EInvalidStatus);

        let record = SpendingRecord {
            id: object::new(ctx),
            department: string::utf8(department),
            project_name: string::utf8(project_name),
            allocated_amount,
            spent_amount,
            date: string::utf8(date),
            status,
            description: string::utf8(description),
            contractor: string::utf8(contractor),
            location: string::utf8(location),
            submitter: tx_context::sender(ctx),
            created_at: tx_context::epoch(ctx),
        };

        let record_address = object::uid_to_address(&record.id);

        // Emit event for indexing
        event::emit(SpendingRecordCreated {
            record_id: record_address,
            department: record.department,
            project_name: record.project_name,
            allocated_amount: record.allocated_amount,
            spent_amount: record.spent_amount,
            submitter: record.submitter,
            timestamp: record.created_at,
        });

        // Transfer to sender (make it owned by government official)
        sui::transfer::transfer(record, tx_context::sender(ctx));
    }

    /// Submit citizen feedback (Anonymous via ZKLogin)
    #[allow(lint(self_transfer))]
    public fun submit_feedback(
        project_id: vector<u8>,
        rating: u8,
        message_hash: vector<u8>,
        is_anonymous: bool,
        ctx: &mut TxContext
    ) {
        // Validate rating (1-5)
        assert!(rating >= 1 && rating <= 5, EInvalidRating);

        let feedback = CitizenFeedback {
            id: object::new(ctx),
            project_id: string::utf8(project_id),
            rating,
            message_hash: string::utf8(message_hash),
            is_anonymous,
            submitter: tx_context::sender(ctx),
            created_at: tx_context::epoch(ctx),
        };

        let feedback_address = object::uid_to_address(&feedback.id);

        // Emit event for indexing
        event::emit(FeedbackSubmitted {
            feedback_id: feedback_address,
            project_id: feedback.project_id,
            rating: feedback.rating,
            is_anonymous: feedback.is_anonymous,
            submitter: feedback.submitter,
            timestamp: feedback.created_at,
        });

        // Transfer to sender (citizen keeps their feedback record)
        sui::transfer::transfer(feedback, tx_context::sender(ctx));
    }

    /// Register government official
    public fun register_official(
        department: vector<u8>,
        email_domain: vector<u8>,
        ctx: &mut TxContext
    ) {
        let official = GovernmentOfficial {
            id: object::new(ctx),
            official_address: tx_context::sender(ctx),
            department: string::utf8(department),
            email_domain: string::utf8(email_domain),
            verified: true, // For demo - in production, this would require admin approval
            registered_at: tx_context::epoch(ctx),
        };

        event::emit(OfficialRegistered {
            official_address: official.official_address,
            department: official.department,
            email_domain: official.email_domain,
            timestamp: official.registered_at,
        });

        sui::transfer::transfer(official, tx_context::sender(ctx));
    }

    /// Update spending record (only by original submitter)
    public fun update_spending_amount(
        record: &mut SpendingRecord,
        new_spent_amount: u64,
        new_status: u8,
        ctx: &TxContext
    ) {
        // Only original submitter can update
        assert!(record.submitter == tx_context::sender(ctx), EUnauthorized);
        assert!(new_status <= 3, EInvalidStatus);

        record.spent_amount = new_spent_amount;
        record.status = new_status;
    }

    // === Getter Functions (for reading data) ===

    /// Get spending record details
    public fun get_spending_details(record: &SpendingRecord): (String, String, u64, u64, u8, String, String) {
        (
            record.department,
            record.project_name,
            record.allocated_amount,
            record.spent_amount,
            record.status,
            record.contractor,
            record.location
        )
    }

    /// Get feedback details
    public fun get_feedback_details(feedback: &CitizenFeedback): (String, u8, bool, address) {
        (
            feedback.project_id,
            feedback.rating,
            feedback.is_anonymous,
            feedback.submitter
        )
    }

    /// Get official details
    public fun get_official_details(official: &GovernmentOfficial): (address, String, String, bool) {
        (
            official.official_address,
            official.department,
            official.email_domain,
            official.verified
        )
    }

    // === Helper Functions ===

    /// Check if address is registered government official (for frontend)
    public fun is_verified_official(official: &GovernmentOfficial): bool {
        official.verified
    }

    /// Get record status as string (for frontend)
    public fun status_to_string(status: u8): String {
        if (status == 0) {
            string::utf8(b"planned")
        } else if (status == 1) {
            string::utf8(b"ongoing")
        } else if (status == 2) {
            string::utf8(b"completed")
        } else {
            string::utf8(b"cancelled")
        }
    }
}