
<section id="addIncidentPage" class="page">

    <div class="page-header">
        <div>
            <h2>Add New Incident</h2>
            <p>Record a new barangay incident.</p>
        </div>
    </div>

    <div class="card incident-form-card">

        <form id="incidentForm">

            <div class="form-grid">

                <div class="form-group">
                    <label for="f_type">Incident Type</label>
                    <select id="f_type" name="type" required>
                        <option value="" selected disabled>Select incident type</option>
                        <option value="Theft">Theft</option>
                        <option value="Physical Injury">Physical Injury</option>
                        <option value="Dispute / Quarrel">Dispute / Quarrel</option>
                        <option value="Noise Complaint">Noise Complaint</option>
                        <option value="Property Damage">Property Damage</option>
                        <option value="Trespassing">Trespassing</option>
                        <option value="Domestic Dispute">Domestic Dispute</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="f_location">Location</label>
                    <input
                        type="text"
                        id="f_location"
                        list="Location"
                        placeholder="Enter location"
                        required
                    >
                    <datalist id="Location"></datalist>
                </div>

                <div class="form-group">
                    <label for="f_complainant">Complainant</label>
                    <input
                        type="text"
                        id="f_complainant"
                        placeholder="Enter complainant name"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="f_respondent">Respondent</label>
                    <input
                        type="text"
                        id="f_respondent"
                        placeholder="Enter respondent name"
                    >
                </div>

                <div class="form-group">
                    <label for="f_status">Status</label>
                    <select id="f_status">
                        <option value="Pending">Pending</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="f_recordedBy">Recorded By</label>
                    <input
                        type="text"
                        id="f_recordedBy"
                        placeholder="Logged-in user"
                        readonly
                    >
                </div>

                <div class="form-group">
                    <label for="f_date">Date Reported</label>
                    <input
                        type="text"
                        id="f_date"
                        placeholder="Server-generated"
                        readonly
                        required
                    >
                    <input
                        type="date"
                        id="hiddenDate"
                        class="hidden-picker"
                        onchange="setDate(this.value)"
                    >
                </div>

                <div class="form-group">
                    <label for="f_time">Time Reported</label>
                    <input
                        type="text"
                        id="f_time"
                        placeholder="Server-generated"
                        readonly
                        required
                    >
                    <input
                        type="time"
                        id="hiddenTime"
                        class="hidden-picker"
                        onchange="setTime(this.value)"
                    >
                </div>

            </div>

            <!-- Description is the final field -->
            <div class="form-group description-group">
                <label for="f_description">Description</label>
                <textarea
                    id="f_description"
                    rows="5"
                    placeholder="Enter incident details..."
                    required
                ></textarea>
            </div>

            <!-- Shown when requesting an edit -->
            <div
                class="form-group description-group"
                id="editReasonGroup"
                style="display: none;"
            >
                <label for="f_editReason">Reason for Edit</label>
                <textarea
                    id="f_editReason"
                    rows="3"
                    placeholder="Explain why this incident needs to be edited"
                ></textarea>
            </div>

            <div class="form-actions">
                <button
                    type="button"
                    id="cancelBtn"
                    class="btn secondary"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    id="submitBtn"
                    class="btn primary"
                >
                    Save Incident
                </button>
            </div>

        </form>

    </div>

</section>
