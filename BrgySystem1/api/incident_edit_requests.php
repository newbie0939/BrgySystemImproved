
<?php

header('Content-Type: application/json');

date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_connect.php';

/*
|--------------------------------------------------------------------------
| Only the Secretary can submit edit requests
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION['admin_id']) ||
    !isset($_SESSION['username']) ||
    !isset($_SESSION['role']) ||
    $_SESSION['role'] !== 'Secretary'
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Only the Secretary can submit edit requests.'
    ]);

    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| POST: Submit an incident edit request
|--------------------------------------------------------------------------
*/

if ($method === 'POST') {

    try {

        $data = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($data)) {
            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'Invalid request data.'
            ]);

            exit;
        }

        $incidentId = trim($data['incident_id'] ?? '');
        $reason = trim($data['reason'] ?? '');

        if ($incidentId === '') {
            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'Incident ID is required.'
            ]);

            exit;
        }

        if ($reason === '') {
            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'A reason is required when requesting an edit.'
            ]);

            exit;
        }

        /*
        |--------------------------------------------------------------------------
        | Retrieve the original incident from the database
        |--------------------------------------------------------------------------
        */

        $stmt = $pdo->prepare(
            "SELECT
                id,
                incident_date,
                incident_time,
                incident_type,
                location,
                complainant,
                respondent,
                description,
                status,
                recorded_by,
                created_at
             FROM incidents
             WHERE id = :id
             LIMIT 1"
        );

        $stmt->execute([
            ':id' => $incidentId
        ]);

        $incident = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$incident) {
            http_response_code(404);

            echo json_encode([
                'success' => false,
                'message' => 'Incident not found.'
            ]);

            exit;
        }

        /*
        |--------------------------------------------------------------------------
        | Original incident data
        |--------------------------------------------------------------------------
        */

        $oldData = [
            'id' => $incident['id'],
            'date' => $incident['incident_date'],
            'time' => $incident['incident_time'],
            'type' => $incident['incident_type'],
            'location' => $incident['location'],
            'complainant' => $incident['complainant'],
            'respondent' => $incident['respondent'],
            'description' => $incident['description'],
            'status' => $incident['status'],
            'recordedBy' => $incident['recorded_by'],
            'createdAt' => $incident['created_at']
        ];

        /*
        |--------------------------------------------------------------------------
        | Proposed changes
        |--------------------------------------------------------------------------
        | The Secretary cannot change the original date, time,
        | recorded-by name, or creation timestamp.
        |--------------------------------------------------------------------------
        */

        $proposedData = [
            'id' => $incident['id'],
            'date' => $incident['incident_date'],
            'time' => $incident['incident_time'],
            'type' => trim((string) ($data['type'] ?? $incident['incident_type'])),
            'location' => trim((string) ($data['location'] ?? $incident['location'])),
            'complainant' => trim((string) ($data['complainant'] ?? $incident['complainant'])),
            'respondent' => trim((string) ($data['respondent'] ?? $incident['respondent'])),
            'description' => trim((string) ($data['description'] ?? $incident['description'])),
            'status' => $data['status'] ?? $incident['status'],
            'recordedBy' => $incident['recorded_by'],
            'createdAt' => $incident['created_at']
        ];

        /*
        |--------------------------------------------------------------------------
        | Validate required proposed fields
        |--------------------------------------------------------------------------
        */

        if (
            $proposedData['type'] === '' ||
            $proposedData['location'] === '' ||
            $proposedData['complainant'] === '' ||
            $proposedData['description'] === ''
        ) {
            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'Incident type, location, complainant, and description are required.'
            ]);

            exit;
        }

        $allowedStatuses = ['Pending', 'Ongoing', 'Resolved'];

        if (!in_array($proposedData['status'], $allowedStatuses, true)) {
            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'Invalid incident status.'
            ]);

            exit;
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent duplicate pending requests
        |--------------------------------------------------------------------------
        */

        $checkStmt = $pdo->prepare(
            "SELECT request_id
             FROM incident_edit_requests
             WHERE incident_id = :incident_id
               AND status = 'Pending'
             LIMIT 1"
        );

        $checkStmt->execute([
            ':incident_id' => $incidentId
        ]);

        if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(409);

            echo json_encode([
                'success' => false,
                'message' => 'There is already a pending edit request for this incident.'
            ]);

            exit;
        }

        /*
        |--------------------------------------------------------------------------
        | Save the edit request for Barangay Captain review
        |--------------------------------------------------------------------------
        */

        $stmt = $pdo->prepare(
            "INSERT INTO incident_edit_requests
            (
                incident_id,
                requested_by,
                reason,
                old_data,
                proposed_data,
                status
            )
            VALUES
            (
                :incident_id,
                :requested_by,
                :reason,
                :old_data,
                :proposed_data,
                'Pending'
            )"
        );

        $stmt->execute([
            ':incident_id' => $incidentId,
            ':requested_by' => (int) $_SESSION['admin_id'],
            ':reason' => $reason,
            ':old_data' => json_encode(
                $oldData,
                JSON_UNESCAPED_UNICODE
            ),
            ':proposed_data' => json_encode(
                $proposedData,
                JSON_UNESCAPED_UNICODE
            )
        ]);

        http_response_code(201);

        echo json_encode([
            'success' => true,
            'request_id' => (int) $pdo->lastInsertId(),
            'message' => 'Edit request submitted successfully. It is now waiting for Barangay Captain approval.'
        ]);

        exit;

    } catch (PDOException $e) {

        error_log(
            'Incident edit request error: ' . $e->getMessage()
        );

        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit edit request. Please check the server error log.'
        ]);

        exit;
    }
}

/*
|--------------------------------------------------------------------------
| Reject unsupported methods
|--------------------------------------------------------------------------
*/

http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);

exit;
