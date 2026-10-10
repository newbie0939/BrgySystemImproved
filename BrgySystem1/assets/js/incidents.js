async function loadIncidents() {

    try {

        const response =
            await fetch(API_URL, {

                method: "GET",

                credentials: "same-origin"

            });


        if (checkUnauthorized(response)) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "Incidents loaded:",
            data
        );


        incidents =
            Array.isArray(data)
                ? data
                : [];


    } catch (error) {

        console.error(
            "Failed to load incidents:",
            error
        );


        incidents = [];

    }


    refreshAll();

}

/*
|--------------------------------------------------------------------------
| Reset Incident Form
|--------------------------------------------------------------------------
*/

function resetIncidentForm() {
    editingId = null;

    incidentForm.reset();

    document.getElementById("editReasonGroup").style.display = "none";
    document.getElementById("f_editReason").required = false;

    document.getElementById("submitBtn").textContent = "Save Incident";

    // Clear any previously selected date/time picker values.
    document.getElementById("hiddenDate").value = "";
    document.getElementById("hiddenTime").value = "";
}


/*
|--------------------------------------------------------------------------
| Submit Incident / Submit Edit Request
|--------------------------------------------------------------------------
*/

incidentForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const type = document.getElementById("f_type").value.trim();
    const location = document.getElementById("f_location").value.trim();
    const complainant = document.getElementById("f_complainant").value.trim();
    const respondent = document.getElementById("f_respondent").value.trim();
    const description = document.getElementById("f_description").value.trim();
    const status = document.getElementById("f_status").value;
    const editReason = document.getElementById("f_editReason").value.trim();

    const isEditRequest = Boolean(editingId);
    const submitBtn = document.getElementById("submitBtn");

    if (!type || !location || !complainant || !description) {
        alert("Please complete all required fields.");
        return;
    }

    if (isEditRequest && !editReason) {
        alert("Please provide a reason for requesting this edit.");
        document.getElementById("f_editReason").focus();
        return;
    }

    const originalButtonText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isEditRequest
        ? "Submitting Request..."
        : "Saving Incident...";

    try {
        let response;

        if (isEditRequest) {
            response = await fetch("api/incident_edit_requests.php", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    incident_id: editingId,
                    reason: editReason,
                    type: type,
                    location: location,
                    complainant: complainant,
                    respondent: respondent,
                    description: description,
                    status: status
                })
            });
        } else {
            response = await fetch(API_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: type,
                    location: location,
                    complainant: complainant,
                    respondent: respondent,
                    description: description,
                    status: status
                })
            });
        }

        if (checkUnauthorized(response)) {
            return;
        }

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(
                result.message ||
                (isEditRequest
                    ? "Failed to submit the edit request."
                    : "Failed to save the incident.")
            );
        }

        if (isEditRequest) {
            alert(
                "Edit request submitted successfully. " +
                "It is now waiting for Barangay Captain approval."
            );
        } else {
            alert("Incident record saved successfully.");
        }

        resetIncidentForm();

        await loadIncidents();

        showPage("dashboardPage");

    } catch (error) {
        console.error("Incident submission error:", error);

        alert(
            error.message ||
            "Unable to complete your request. Please try again."
        );

    } finally {
        submitBtn.disabled = false;

        if (!editingId) {
            submitBtn.textContent = "Save Incident";
        } else {
            submitBtn.textContent = originalButtonText;
        }
    }
});

cancelBtn.addEventListener(
    "click",
    function() {

        editingId = null;

        incidentForm.reset();

        document.getElementById(
            "editReasonGroup"
        ).style.display =
            "none";

        document.getElementById(
            "f_editReason"
        ).required =
            false;

        document.getElementById(
            "submitBtn"
        ).textContent =
            "Save Incident";

        showPage(
            "dashboardPage"
        );

    }
);

function viewIncident(id) {

    const incident =
        incidents.find(function(item) {

            return item.id === id;

        });


    if (!incident) {
        return;
    }


    selectedIncidentId =
        incident.id;


    viewTitle.textContent =
        "Incident " + incident.id;


    viewBody.innerHTML = `

        <div class="report-row">
            <strong>Incident ID</strong>
            <span>${escapeHTML(incident.id)}</span>
        </div>

        <div class="report-row">
            <strong>Date</strong>
            <span>${escapeHTML(incident.date)}</span>
        </div>

        <div class="report-row">
            <strong>Time</strong>
            <span>${escapeHTML(incident.time)}</span>
        </div>

        <div class="report-row">
            <strong>Incident Type</strong>
            <span>${escapeHTML(incident.type)}</span>
        </div>

        <div class="report-row">
            <strong>Location</strong>
            <span>${escapeHTML(incident.location)}</span>
        </div>

        <div class="report-row">
            <strong>Complainant</strong>
            <span>${escapeHTML(incident.complainant)}</span>
        </div>

        <div class="report-row">
            <strong>Respondent</strong>
            <span>${escapeHTML(incident.respondent || "-")}</span>
        </div>

        <div class="report-row">
            <strong>Status</strong>
            <span>${statusBadge(incident.status)}</span>
        </div>

        <div class="report-row">
            <strong>Recorded By</strong>
            <span>${escapeHTML(incident.recordedBy)}</span>
        </div>

        <div style="margin-top:20px;">

            <strong>
                Description
            </strong>

            <p>
                ${escapeHTML(incident.description)}
            </p>

        </div>

    `;


    viewOverlay.classList.add("show");

}

function closeModal() {

    viewOverlay.classList.remove(
        "show"
    );

    selectedIncidentId = null;

}


closeView.addEventListener(
    "click",
    closeModal
);


closeViewBtn.addEventListener(
    "click",
    closeModal
);


viewOverlay.addEventListener(
    "click",
    function(event) {

        if (event.target === viewOverlay) {

            closeModal();

        }

    }
);



editRecordBtn.addEventListener(
    "click",
    function() {

        const incident =
            incidents.find(function(item) {

                return item.id === selectedIncidentId;

            });

        if (!incident) {
            return;
        }

        editingId =
            incident.id;

        document.getElementById(
            "f_date"
        ).value =
            incident.date;

        document.getElementById(
            "f_time"
        ).value =
            incident.time;

        document.getElementById(
            "f_type"
        ).value =
            incident.type;

        document.getElementById(
            "f_location"
        ).value =
            incident.location;

        document.getElementById(
            "f_complainant"
        ).value =
            incident.complainant;

        document.getElementById(
            "f_respondent"
        ).value =
            incident.respondent || "";

        document.getElementById(
            "f_description"
        ).value =
            incident.description;

        document.getElementById(
            "f_status"
        ).value =
            incident.status;

        document.getElementById(
            "f_recordedBy"
        ).value =
            incident.recordedBy;

        document.getElementById(
            "editReasonGroup"
        ).style.display =
            "block";

        document.getElementById(
            "f_editReason"
        ).value = "";

        document.getElementById(
            "f_editReason"
        ).required =
            true;

        document.getElementById(
            "submitBtn"
        ).textContent =
            "Submit Edit Request";

        closeModal();

        showPage(
            "addIncidentPage"
        );

    }
);


function openDatePicker() {

    const dateInput =
        document.getElementById("hiddenDate");

    try {

        if (dateInput.showPicker) {

            dateInput.showPicker();

        } else {

            dateInput.click();

        }

    } catch (error) {

        dateInput.click();

    }

}


function openTimePicker() {

    const timeInput =
        document.getElementById("hiddenTime");

    try {

        if (timeInput.showPicker) {

            timeInput.showPicker();

        } else {

            timeInput.click();

        }

    } catch (error) {

        timeInput.click();

    }

}

function setDate(value) {

    if (!value) {
        return;
    }

    const parts = value.split("-");

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    document.getElementById("f_date").value =
        `${month}/${day}/${year}`;
}


function setTime(value) {

    if (!value) {
        return;
    }

    const parts = value.split(":");

    let hour = parseInt(parts[0], 10);
    const minutes = parts[1];

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    document.getElementById("f_time").value =
        `${hour}:${minutes} ${ampm}`;
}


const dateField =
    document.getElementById("f_date");

dateField.addEventListener(
    "input",
    function () {

        let value =
            dateField.value.replace(/\D/g, "");

        if (value.length > 8) {
            value = value.substring(0, 8);
        }

        if (value.length >= 5) {

            dateField.value =
                value.substring(0, 2) +
                "/" +
                value.substring(2, 4) +
                "/" +
                value.substring(4);

        } else if (value.length >= 3) {

            dateField.value =
                value.substring(0, 2) +
                "/" +
                value.substring(2);

        } else {

            dateField.value = value;

        }

    }
);


const timeField =
    document.getElementById("f_time");

timeField.addEventListener(
    "blur",
    function () {

        let value =
            timeField.value
                .toUpperCase()
                .replace(/\s/g, "")
                .replace(/:/g, "");

        const match =
            value.match(
                /^(\d{1,2})(\d{2})(AM|PM)$/
            );

        if (!match) {
            return;
        }

        const hour =
            parseInt(match[1], 10);

        const minutes =
            parseInt(match[2], 10);

        const ampm =
            match[3];

        if (
            hour < 1 ||
            hour > 12
        ) {
            return;
        }

        if (
            minutes < 0 ||
            minutes > 59
        ) {
            return;
        }

        const formattedMinutes =
            String(minutes).padStart(2, "0");

        timeField.value =
            `${hour}:${formattedMinutes} ${ampm}`;

    }
);