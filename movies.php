<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// ✏️ ඔබේ move folder path එක මෙහි දාන්න
$MOVIES_DIR = 'C:/Users/YourName/move';  // <-- CHANGE THIS

$VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
$IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (!is_dir($MOVIES_DIR)) {
    echo json_encode(['error' => 'Movies folder not found: ' . $MOVIES_DIR]);
    exit;
}

$movies = [];
$files = scandir($MOVIES_DIR);

foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue;
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, $VIDEO_EXTS)) continue;

    $nameNoExt = pathinfo($file, PATHINFO_FILENAME);
    $thumbnail = null;

    foreach ($IMAGE_EXTS as $imgExt) {
        $imgFile = $MOVIES_DIR . '/' . $nameNoExt . '.' . $imgExt;
        if (file_exists($imgFile)) {
            $thumbnail = $nameNoExt . '.' . $imgExt;
            break;
        }
    }

    $fullPath = $MOVIES_DIR . '/' . $file;
    $sizeMB = round(filesize($fullPath) / (1024 * 1024), 1);
    $modified = filemtime($fullPath);

    $movies[] = [
        'name' => $nameNoExt,
        'file' => $file,
        'thumbnail' => $thumbnail,
        'size' => $sizeMB . ' MB',
        'modified' => $modified,
        'path' => $fullPath
    ];
}

usort($movies, fn($a, $b) => $b['modified'] - $a['modified']);
echo json_encode($movies);
?>
