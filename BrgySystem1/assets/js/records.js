function displayRecords() {

    recordsBody.innerHTML = "";

    let filtered =
        [...incidents];


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const search =
        filterSearch.value
            .trim()
            .toLowerCase();


    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    const status =
        filterStatus.value;


    /*
    |--------------------------------------------------------------------------
    | Filter Records
    |--------------------------------------------------------------------------
    */

    filtered =
        filtered.filter(
            function (incident) {

                const searchable =
                    (
                        incident.id +
                        " " +
                        incident.type +
                        " " +
                        incident.complainant +
                        " " +
                        (incident.respondent || "") +
                        " " +
                        incident.location
                    ).toLowerCase();


                const matchesSearch =
                    searchable.includes(
                        search
                    );


                const matchesStatus =
                    status === "All" ||
                    incident.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    /*
    |--------------------------------------------------------------------------
    | No Records
    |--------------------------------------------------------------------------
    */

    if (filtered.length === 0) {

        const row =
            document.createElement("tr");


        const cell =
            document.createElement("td");


        cell.colSpan = 7;

        cell.style.textAlign =
            "center";

        cell.textContent =
            "No records found.";


        row.appendChild(cell);

        recordsBody.appendChild(row);

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Sort Records
    |--------------------------------------------------------------------------
    */

    filtered.sort(
        function (a, b) {

            return b.createdAt.localeCompare(
                a.createdAt
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Create Table Rows
    |--------------------------------------------------------------------------
    */

    filtered.forEach(
        function (incident) {

            const row =
                document.createElement("tr");


            /*
            |--------------------------------------------------------------------------
            | ID
            |--------------------------------------------------------------------------
            */

            const idCell =
                document.createElement("td");


            const idStrong =
                document.createElement("strong");


            idStrong.textContent =
                incident.id;


            idCell.appendChild(
                idStrong
            );


            /*
            |--------------------------------------------------------------------------
            | Date
            |--------------------------------------------------------------------------
            */

            const dateCell =
                document.createElement("td");


            dateCell.textContent =
                incident.date;


            /*
            |--------------------------------------------------------------------------
            | Type
            |--------------------------------------------------------------------------
            */

            const typeCell =
                document.createElement("td");


            typeCell.textContent =
                incident.type;


            /*
            |--------------------------------------------------------------------------
            | Complainant
            |--------------------------------------------------------------------------
            */

            const complainantCell =
                document.createElement("td");


            complainantCell.textContent =
                incident.complainant;


            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            const locationCell =
                document.createElement("td");


            locationCell.textContent =
                incident.location;


            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            const statusCell =
                document.createElement("td");


            statusCell.innerHTML =
                statusBadge(
                    incident.status
                );


            /*
            |--------------------------------------------------------------------------
            | Action
            |--------------------------------------------------------------------------
            */

            const actionCell =
                document.createElement("td");


            /*
            |--------------------------------------------------------------------------
            | View Button
            |--------------------------------------------------------------------------
            */

            const viewButton =
                document.createElement("button");


            viewButton.type =
                "button";


            viewButton.className =
                "btn primary";


            viewButton.textContent =
                "View";


            viewButton.addEventListener(
                "click",
                function () {

                    viewIncident(
                        incident.id
                    );

                }
            );


            /*
            |--------------------------------------------------------------------------
            | Delete Button
            |--------------------------------------------------------------------------
            */

            const deleteButton =
                document.createElement("button");


            deleteButton.type =
                "button";


            deleteButton.className =
                "btn danger";


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteIncident(
                        incident.id
                    );

                }
            );


            /*
            |--------------------------------------------------------------------------
            | Add Buttons
            |--------------------------------------------------------------------------
            */

            actionCell.appendChild(
                viewButton
            );


            actionCell.appendChild(
                deleteButton
            );


            /*
            |--------------------------------------------------------------------------
            | Add Cells To Row
            |--------------------------------------------------------------------------
            */

            row.appendChild(
                idCell
            );

            row.appendChild(
                dateCell
            );

            row.appendChild(
                typeCell
            );

            row.appendChild(
                complainantCell
            );

            row.appendChild(
                locationCell
            );

            row.appendChild(
                statusCell
            );

            row.appendChild(
                actionCell
            );


            /*
            |--------------------------------------------------------------------------
            | Add Row To Table
            |--------------------------------------------------------------------------
            */

            recordsBody.appendChild(
                row
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| Search Records
|--------------------------------------------------------------------------
*/

filterSearch.addEventListener(
    "input",
    displayRecords
);


/*
|--------------------------------------------------------------------------
| Filter By Status
|--------------------------------------------------------------------------
*/

filterStatus.addEventListener(
    "change",
    displayRecords
);


/*
|--------------------------------------------------------------------------
| Dashboard Search
|--------------------------------------------------------------------------
*/

searchInput.addEventListener(
    "input",
    displaySearchResults
);


/*
|--------------------------------------------------------------------------
| Delete / Archive Incident
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This does NOT permanently delete the incident.
|
| The API changes:
|
| secretary_deleted = 1
|
| Therefore:
|
| Secretary → record disappears
| Captain   → record remains saved
|
*/

async function deleteIncident(id) {

    const incident =
        incidents.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!incident) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Confirmation
    |--------------------------------------------------------------------------
    */

    const confirmed =
        confirm(
            "Are you sure you want to delete incident " +
            incident.id +
            "?\n\n" +
            "The record will be removed from the Secretary panel " +
            "but will remain available to the Barangay Captain."
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
        |--------------------------------------------------------------------------
        | Send DELETE Request
        |--------------------------------------------------------------------------
        */

        const response =
            await fetch(
                API_URL,
                {

                    method: "DELETE",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            id:
                                incident.id

                        })

                }
            );


        /*
        |--------------------------------------------------------------------------
        | Check Unauthorized
        |--------------------------------------------------------------------------
        */

        if (
            checkUnauthorized(
                response
            )
        ) {

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Read Response
        |--------------------------------------------------------------------------
        */

        const result =
            await response.json();


        /*
        |--------------------------------------------------------------------------
        | Check HTTP Status
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {

            throw new Error(

                result.message ||
                "Failed to delete incident."

            );

        }


        /*
        |--------------------------------------------------------------------------
        | Check API Success
        |--------------------------------------------------------------------------
        */

        if (!result.success) {

            throw new Error(

                result.message ||
                "Failed to delete incident."

            );

        }


        /*
        |--------------------------------------------------------------------------
        | Reload Records
        |--------------------------------------------------------------------------
        */

        await loadIncidents();


        /*
        |--------------------------------------------------------------------------
        | Success Message
        |--------------------------------------------------------------------------
        */

        alert(
            "Incident " +
            incident.id +
            " was deleted from the Secretary panel."
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            error.message ||
            "Failed to delete the incident. Please try again."
        );

    }

}