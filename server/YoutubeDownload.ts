import { EventEmitter } from 'events';
import ffmpeg from 'fluent-ffmpeg';
import ytdl from 'ytdl-core';
import async from 'async';
import progress, { Progress } from 'progress-stream';
import sanitize from 'sanitize-filename';
import os from 'os';
import fs from 'fs';


declare namespace YoutubeDownloader {
    export interface IYoutubeDownloaderOptions {
        ffmpegPath?: string;
        outputPath: string;
        // https://github.com/fent/node-ytdl-core/blob/0574df33f3382f3a825e4bef30f21e51cd78eafe/typings/index.d.ts#L7
        youtubeVideoQuality?: 'lowest' | 'highest' | string | number;
        queueParallelism: number;
        progressTimeout: number;
    }

    interface IStats {
        transferredBytes: number;
        runtime: number;
        averageSpeed: number;
    }


    export interface IResultObject {
        videoId: string;
        stats: IStats;
        file: string;
        youtubeUrl: string;
        videoTitle: string;
        artist: string;
        title: string;
        thumbnail: string;
    }

    /*
    export interface YoutubeMp3DownloaderEvents {
        'queueSize' : number;
        'error' : any;
        'finished' : any;
        'progress' : IVideoTask;
    }
    */

    export interface IVideoTask {
        videoId: string;
        // https://github.com/freeall/progress-stream#usage
        fileName: string;
        mp3: boolean;
        progress: {
            percentage: number;
            transferred: number;
            length: number;
            remaining: number;
            eta: number;
            runtime: number;
            delta: number;
            speed: number;
        };
    }

}

export class YoutubeDownloader extends EventEmitter {

    youtubeBaseUrl: string;
    youtubeVideoQuality: string | number;
    outputPath: string;
    queueParallelism: number;
    progressTimeout: number;
    fileNameReplacements: any;
    requestOptions: any;
    outputOptions: any;
    downloadQueue: async.AsyncQueue<YoutubeDownloader.IVideoTask>;

    /*  on(event: 'queueSize', listener: (total : number) => void): this;
      on(event: 'error' | 'finished', listener: (err: any, data: any) => void): this;
      on(event: 'progress', listener: (video: YoutubeMp3Downloader.IVideoTask) => void): this;
      */


    constructor(options: YoutubeDownloader.IYoutubeDownloaderOptions) {

        super();

        this.youtubeBaseUrl = 'http://www.youtube.com/watch?v=';
        this.youtubeVideoQuality = (options && options.youtubeVideoQuality ? options.youtubeVideoQuality : 'highest');
        this.outputPath = (options && options.outputPath ? options.outputPath : (os.platform() === 'win32' ? 'C:/Windows/Temp' : '/tmp'));
        this.queueParallelism = (options && options.queueParallelism ? options.queueParallelism : 1);
        this.progressTimeout = (options && options.progressTimeout ? options.progressTimeout : 1000);
        this.fileNameReplacements = [[/'/g, ''], [/\|/g, ''], [/'/g, ''], [/\//g, ''], [/\?/g, ''], [/:/g, ''], [/;/g, '']];
        // this.requestOptions = (options && options.requestOptions ? options.requestOptions : { maxRedirects: 5 });
        // this.outputOptions = (options && options.outputOptions ? options.outputOptions : []);

        if (options && options.ffmpegPath) {
            ffmpeg.setFfmpegPath(options.ffmpegPath);
        }

        const self = this;
        // Async download/transcode queue
        this.downloadQueue = async.queue(function (task: YoutubeDownloader.IVideoTask, callback: any) {

            const size = self.downloadQueue.running() + self.downloadQueue.length();

            self.emit('queueSize', size);

            self.performDownload(task, function (err: any, result: any) {
                callback(err, result);
            });

        }, this.queueParallelism);

    }


    cleanFileName(fileName: string): string {

        this.fileNameReplacements.forEach(function (replacement: any) {
            fileName = fileName.replace(replacement[0], replacement[1]);
        });

        return fileName;
    }


    downloadMp3(videoId: string, fileName?: string): void {
        let task: YoutubeDownloader.IVideoTask;

        task = {
            videoId: videoId, fileName: fileName, mp3: true, progress: {
                percentage: 0,
                transferred: 0,
                length: 0,
                remaining: 0,
                eta: 0,
                runtime: 0,
                delta: 0,
                speed: 0
            }
        };

        const self = this;
        this.downloadQueue.push(task, function (err: any, data: any) {

            self.emit('queueSize', self.downloadQueue.running() + self.downloadQueue.length());

            if (err) {
                self.emit('error', err, data);
            } else {
                self.emit('finished', err, data);
            }
        });
    }

    downloadVideo(videoId: string, fileName?: string): void {
        let task: YoutubeDownloader.IVideoTask;

        task = {
            videoId: videoId, fileName: fileName, mp3: false, progress: {
                percentage: 0,
                transferred: 0,
                length: 0,
                remaining: 0,
                eta: 0,
                runtime: 0,
                delta: 0,
                speed: 0
            }
        };

        const self = this;

        this.downloadQueue.push(task, function (err: any, data: any) {

            self.emit('queueSize', self.downloadQueue.running() + self.downloadQueue.length());

            if (err) {
                self.emit('error', err, data);
            } else {
                self.emit('finished', err, data);
            }
        });

    }

    async performDownload(task: YoutubeDownloader.IVideoTask, callback: (errorNessage?: string, output?: any) => void) {

        // const videoUrl = this.youtubeBaseUrl + task.videoId;
        const videoUrl = task.videoId;
        const resultObj = {
            videoId: task.videoId,
            stats: {},
            file: '',
            youtubeUrl: '',
            videoTitle: '',
            artist: '',
            title: '',
            thumbnail: '',
        };

        const self = this;
        try {
            const info = await ytdl.getInfo(videoUrl);
            // Map new structure to old one
            const infoT = info.player_response.videoDetails;
            const videoTitle = self.cleanFileName(infoT.title);
            let artist = 'Unknown';
            let title = 'Unknown';
            const thumbnail = infoT.thumbnail.thumbnails[0].url || undefined;

            if (videoTitle.indexOf('-') > -1) {
                const temp = videoTitle.split('-');
                if (temp.length >= 2) {
                    artist = temp[0].trim();
                    title = temp[1].trim();
                }
            } else {
                title = videoTitle;
            }

            // Derive file name, if given, use it, if not, from video title
            const fileName = (task.fileName ? self.outputPath + '/' + task.fileName : self.outputPath + '/' + (sanitize(videoTitle) || info.vid) + '.mp3');

            try {
                const info = await ytdl.getInfo(videoUrl);

                // Stream setup
                const stream = ytdl.downloadFromInfo(info,
                //    {
                //    quality: self.youtubeVideoQuality,
                //    requestOptions: self.requestOptions
                // }
                );

                stream.on('response', function (httpResponse) {

                    // Setup of progress module
                    const str = progress({
                        length: parseInt(httpResponse.headers['content-length']),
                        time: self.progressTimeout
                    });

                    // Add progress event listener
                    str.on('progress', function (progress: Progress) {
                        if (progress.percentage === 100) {
                            resultObj.stats = {
                                transferredBytes: progress.transferred,
                                runtime: progress.runtime,
                                averageSpeed: parseFloat(progress.speed.toFixed(2))
                            };
                        }
                        self.emit('progress', { videoId: task.videoId, progress: progress });
                    });
                    let outputOptions = [
                        '-id3v2_version', '4',
                        '-metadata', 'title=' + title,
                        '-metadata', 'artist=' + artist
                    ];
                    if (this.outputOptions) {
                        outputOptions = outputOptions.concat(this.outputOptions);
                    }

                    // Start encoding
                    // .audioBitrate(info.formats[0].audioBitrate)
                    if (task.mp3) {
                        const proc = ffmpeg({ source: stream.pipe(str) })
                            .withAudioCodec('libmp3lame')
                            .toFormat('mp3')
                            .outputOptions(outputOptions)
                            .on('error', function (err: any) {
                                callback(err.message, undefined);
                            })
                            .on('end', function () {
                                resultObj.file = fileName;
                                resultObj.youtubeUrl = videoUrl;
                                resultObj.videoTitle = videoTitle;
                                resultObj.artist = artist;
                                resultObj.title = title;
                                resultObj.thumbnail = thumbnail;
                                callback(undefined, resultObj);
                            })
                            .saveToFile(fileName);
                    } else {
                        const writeStream = fs.createWriteStream(fileName);

                        stream.pipe(str).pipe(writeStream);
                    }

                    const strVideo = progress({
                        length: parseInt(httpResponse.headers['content-length']),
                        time: this.progressTimeout
                    });

                    // Add progress event listener
                    strVideo.on('progress', function (progress: Progress) {
                        if (progress.percentage === 100) {
                            resultObj.stats = {
                                transferredBytes: progress.transferred,
                                runtime: progress.runtime,
                                averageSpeed: parseFloat(progress.speed.toFixed(2))
                            };
                        }
                        self.emit('progressSaveVideo', { videoId: task.videoId, progress: progress });
                    });
                });
            } catch (err) {
                callback(err.message, undefined);
            }
        } catch (err) {
            callback(err.message, resultObj);
        }
    }
}