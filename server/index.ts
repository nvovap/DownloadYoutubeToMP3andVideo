
import { YoutubeDownloader } from './YoutubeDownload';
import os from 'os';
import path from 'path';

// Configure YoutubeMp3Downloader with your settings

// Path for windows will be " current path + mpeg\win\x32 or x64\ "
// Path for Mac OS will be " current path + mpeg/mac/ "
const ffmpegPath = (os.platform() === 'win32' ? path.resolve(__dirname, 'mpeg\\win\\' + (os.arch()) + '\\ffmpeg.exe') : path.resolve(__dirname, 'mpeg/mac/ffmpeg'));
// Path for download files will be "  current path + downloads "
const outputPath = (os.platform() === 'win32' ? path.resolve(__dirname, 'downloads\\') : path.resolve(__dirname, 'downloads/'));

const YD = new YoutubeDownloader({
    'ffmpegPath': ffmpegPath,           // Where is the FFmpeg binary located?
    'outputPath': outputPath,           // Where should the downloaded and encoded files be stored?
    'youtubeVideoQuality': 'highest',   // What video quality should be used?
    'queueParallelism': 2,              // How many parallel downloads/encodes should be started?
    'progressTimeout': 2000             // How long should be the interval of the progress reports
});

// Download video and save as MP3 file


// YD.downloadMp3('https://www.youtube.com/watch?v=iftZddRnbJo&feature=share', 'monetka10.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=43ScNT79o50&feature=share', 'splin_my_love.mp3');
// YD.downloadMp3('https://www.youtube.com/watch?v=Y-TCZ_OxOA4&feature=share', 'splin_moon.mp3');

// YD.downloadVideo('https://www.youtube.com/watch?v=gYaJGdb-MGE', 'Hollow.mp3');
/*
YD.downloadMp3('https://www.youtube.com/watch?v=rw8ZUpzt5ZU&feature=share', 'monetka2.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=WY2qICxjxyQ&feature=share', 'monetka4.mp3');

YD.downloadMp3('https://www.youtube.com/watch?v=gYaJGdb-MGE', 'Hollow.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=AIMKs7rayr8', 'Itishik.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=mfJhMfOPWdE', 'BlahBlah.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=vtQgs1cGAlI', 'InAndOutOfLove.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=0Cih47XDcNw', 'Стук.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=RbiPh__286o', 'itsmylife.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=ikFFVfObwss&list=PLxGB9kNnluF766VGi9mOsgK1JJb7Rtf2f', 'ACDC.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=iaoqcc_Q3fE', 'дыхание.mp3');
YD.downloadMp3('https://www.youtube.com/watch?v=KjyCCQ1N8s8', 'Kings&Queens.mp3');
*/


// YD.downloadVideo('https://youtu.be/e7MaO1MOOfY', 'video1.avi');
// YD.downloadVideo('https://youtu.be/rAO-2r-HL_Y', 'video2.avi');
// YD.downloadVideo('https://youtu.be/qwR6VEtg7Vc', 'video3.avi');
// YD.downloadVideo('https://youtu.be/KLqZl6RHLMk', 'video4.avi');
// YD.downloadVideo('https://youtu.be/kBCvL1d4lGo', 'video5.avi');
// YD.downloadVideo('https://youtu.be/8oESwocbreA', 'video6.avi');
// YD.downloadVideo('https://youtu.be/3uV6_0fjz9c', 'video7.avi');
// YD.downloadVideo('https://youtu.be/POvlbyFGpYY', 'video8.avi');
// YD.downloadVideo('https://www.youtube.com/watch?v=E6hpDH1j8ao', 'QQXMiV3wHt4');


// YD.downloadVideo('https://www.youtube.com/watch?v=LW6AXH0Oatg', 'LW6AXH0Oatg');

// ffmpeg.exe -i noize.mp3 -ss 1:51:42 -to 1:56:24 -c copy noize2.mp3



// Download video and save as VIDEO file
// YD.downloadVideo('BiQIc7fG9pA', 'BiQIc7fG9pA.mp4');

YD.on('finished', function (err, data) {
    console.log('finished');
    console.log(err);
    console.log(JSON.stringify(data));
});

YD.on('error', function (error) {
    console.log('error');
    console.log(error);
});

YD.on('progress', function (progress) {
    console.log(JSON.stringify(progress));
});

YD.on('progressSaveVideo', function (progress) {
    console.log('======== progress Video ==============');
    console.log(JSON.stringify(progress));
});


/*
function youtube_parser(url){
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
/*  let match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}


console.log(youtube_parser('https://www.youtube.com/watch?v=UDLpUprnOLc'))


//================ Start SERVER ================
let server = app.listen(process.env.PORT || 3000, function(){
  console.log('Server running on port '+(process.env.PORT || 3000)+'.');
  console.log('-----------------------------------');
  console.log(express.static(__dirname+'/public'));
  console.log(__dirname+'/public');
  console.log('-----------------------------------');

})
*/
