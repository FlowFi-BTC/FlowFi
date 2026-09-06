[1. Landing Page] ──(Connect Wallet / Submit)──> [2. Dashboard] ──(New Receivable)──> [3. Submit Receivable]
       │                                                                                      │
       │──(View Pilot)────────────────────────────────────────────────┐                       ▼
       │                                                              │             [4. Verification Status]
       ▼                                                              │                       │
[8. Transparency / Pilot Page] <──(View Proof)── [7. Active Funding] <──(Confirm)── [6. Funding Modal] <──(Fund)── [5. Receivable Detail]
1. Landing Page
Role: Public marketing and onboarding page explaining the sBTC receivable financing platform.

Key Components: Hero banner ("Unlock Working Capital with sBTC"), CTA buttons ("View Pilot", "Submit Receivable"), "How It Works" overview, and pilot statistics.

Connections:

"Connect Wallet" / "Submit Receivable" CTA → Directs users to the Dashboard (2) or directly to Submit Receivable (3).

"View Pilot" CTA → Directs users to Transparency / Pilot Page (8).

2. Dashboard
Role: Main control panel for logged-in users to view asset overviews and recent account activity.

Key Components: Overview metrics (Submitted, Verified, Funded, Completed Receivables), recent activity feed, and quick submit prompt.

Connections:

"Submit Receivable" Button → Opens Submit Receivable (3).

Activity List / "Verification" Link → Opens Verification Status (4).

Sidebar Navigation → Allows switching to Funding (7) or Settings.

3. Submit Receivable (5-Step Form)
Role: Multi-step submission form for businesses to register a new receivable for verification.

Key Components: 5-step progress bar (1. Business, 2. Receivable, 3. Debtor, 4. Documents, 5. Review), text inputs for registration, representative details, and wallet address.

Connections:

"Continue" (Final Step Submission) → Submits the data and forwards the user to Verification Status (4).

4. Verification Status
Role: Progress tracker showing real-time updates as the platform verifies business, debtor, and receivable authenticity.

Key Components: Status timeline (Submitted → Under Review → Business Verified → Debtor Confirmed → Receivable Verified), verifier notes, transaction hash links.

Connections:

"View Receivable" / Verification Complete → Leads directly to the Receivable Detail (5) page once verified.

5. Receivable Detail
Role: Detailed breakdown of a specific verified receivable for capital providers or business owners.

Key Components: Total sBTC requested, due date, tabbed info (Details, Verification, Documents, Activity), debtor information, and action CTA.

Connections:

"Fund This Receivable" Button → Triggers the Funding Flow Modal (6).

6. Funding Flow (Confirmation Modal)
Role: On-chain transaction execution modal for approving sBTC funding to the receivable.

Key Components: Summary box (amount requested, due date, purpose) and wallet execution button ("Connect Wallet" / "Confirm").

Connections:

"Confirm Transaction" → Executes the smart contract transaction and redirects to Funding / Active Funding (7).

"Cancel" → Closes the modal and returns to Receivable Detail (5).

7. Funding / Active Funding
Role: Portfolio management page displaying all active, repaid, and defaulted capital positions.

Key Components: Funding counters (Funded, Repaid, Defaulted), active investment table with status tags, amounts, and repayment schedules.

Connections:

Sidebar "Transparency" / Explorer Links → Opens Transparency / Pilot Page (8) for public auditability.

8. Transparency / Pilot Page
Role: Public on-chain verification ledger tracking the full lifecycle of sBTC transactions.

Key Components: On-chain status sequence (Registered, Verified, Funded, Repaid), smart contract address links, Stacks Explorer links, and repository/documentation buttons.

Connections:

Serves as the public verification endpoint accessible from any section of the app via navigation or transaction hash links.