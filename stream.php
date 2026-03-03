<?php
// ✏️ Same path as movies.php
$MOVIES_DIR = 'C:/Users/YourName/move';  // <-- CHANGE THIS (same as above)

$type = $_GET['type'] ?? '';
$file = basename($_GET['file'] ?? '');

if (empty($file)) { http_response_code(400); exit('Bad request'); }

$filePath = $MOVIES_DIR . '/' . $file;

if (!file_exists($filePath)) { http_response_code(404); exit('Not found'); }

$IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

if ($type === 'thumbnail') {
    $mimeMap = ['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','gif'=>'image/gif','webp'=>'image/webp'];
    header('Content-Type: ' . ($mimeMap[$ext] ?? 'image/jpeg'));
    header('Cache-Control: max-age=3600');
    readfile($filePath);
    exit;
}

if ($type === 'video') {
    $mimeMap = ['mp4'=>'video/mp4','mkv'=>'video/x-matroska','avi'=>'video/x-msvideo',
                'mov'=>'video/quicktime','wmv'=>'video/x-ms-wmv','webm'=>'video/webm','m4v'=>'video/mp4'];
    $mime = $mimeMap[$ext] ?? 'video/mp4';
    $fileSize = filesize($filePath);

    header('Content-Type: ' . $mime);
    header('Accept-Ranges: bytes');
    header('Access-Control-Allow-Origin: *');

    if (isset($_SERVER['HTTP_RANGE'])) {
        preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $m);
        $start = (int)$m[1];
        $end = isset($m[2]) && $m[2] !== '' ? (int)$m[2] : $fileSize - 1;
        $length = $end - $start + 1;

        http_response_code(206);
        header("Content-Range: bytes $start-$end/$fileSize");
        header("Content-Length: $length");

        $fp = fopen($filePath, 'rb');
        fseek($fp, $start);
        $buf = 8192;
        $sent = 0;
        while (!feof($fp) && $sent < $length) {
            $chunk = min($buf, $length - $sent);
            echo fread($fp, $chunk);
            $sent += $chunk;
            flush();
        }
        fclose($fp);
    } else {
        header("Content-Length: $fileSize");
        readfile($filePath);
    }
    exit;
}

http_response_code(400); exit('Invalid type');
?>
