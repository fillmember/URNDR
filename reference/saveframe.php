<?php
$path = '/export/frames/';
if(isset($_POST['data']) && isset($_POST['i']) && is_numeric($_POST['i'])) {
    // split the data URL at the comma
    $data = explode(',', $_POST['data']);
    // decode the base64 into binary data
    $data = base64_decode(trim($data[1]));
 
    // create the numbered image file
    $filename = sprintf('%s%08d.png', $path, $_POST['i']);
    file_put_contents($filename, $data);
}
