<?php

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/db_connect.php';


/*
|--------------------------------------------------------------------------
| Read Request
|--------------------------------------------------------------------------
*/

$data = json_decode(
    file_get_contents('php://input'),
    true
);

$username = trim(
    $data['username'] ?? ''
);

$password = $data['password'] ?? '';


/*
|--------------------------------------------------------------------------
| Validate Username and Password
|--------------------------------------------------------------------------
*/

if (
    $username === '' ||
    $password === ''
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'Username and password are required.'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Find Account
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT
        admin_id,
        username,
        password,
        role
    FROM admins
    WHERE username = :username
    LIMIT 1
");

$stmt->execute([
    ':username' => $username
]);

$admin = $stmt->fetch();


/*
|--------------------------------------------------------------------------
| Verify Username and Password
|--------------------------------------------------------------------------
*/

if (
    !$admin ||
    !password_verify(
        $password,
        $admin['password']
    )
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'Invalid username or password.'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Check Authorized Role
|--------------------------------------------------------------------------
*/

if (
    !in_array(
        $admin['role'],
        [
            'Secretary',
            'Barangay Captain',
            'Captain'
        ],
        true
    )
) {

    echo json_encode([
        'success' => false,
        'message' =>
            'This account is not authorized to access the system.'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Prevent Session Fixation
|--------------------------------------------------------------------------
*/

session_regenerate_id(true);


/*
|--------------------------------------------------------------------------
| Store Session Information
|--------------------------------------------------------------------------
*/

$_SESSION['logged_in'] = true;

$_SESSION['admin_id'] =
    (int) $admin['admin_id'];

$_SESSION['username'] =
    $admin['username'];

$_SESSION['role'] =
    $admin['role'];


/*
|--------------------------------------------------------------------------
| Determine Destination Based on Role
|--------------------------------------------------------------------------
*/

if ($admin['role'] === 'Secretary') {

    $redirect =
        'index.php';

} else {

    $redirect =
        'admin/dashboard.php';

}


/*
|--------------------------------------------------------------------------
| Login Success
|--------------------------------------------------------------------------
*/

echo json_encode([
    'success' => true,

    'admin_id' =>
        (int) $admin['admin_id'],

    'username' =>
        $admin['username'],

    'role' =>
        $admin['role'],

    'redirect' =>
        $redirect
]);

exit;