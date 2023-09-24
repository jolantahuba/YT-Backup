# YouTube Playlist Backup

Available here:
[**YouTube Playlist Backup**](https://jolantahuba.github.io/YT-Backup/)

Simple application that allows you to export information about the YouTube playlist videos.  
Created with the use of [YouTube Data API v3](https://developers.google.com/youtube/v3).

## Features
- Export playlist data to CSV file
- Compare created CSV file with current playlist
  - Check what videos have been added or removed (also changed to private)
  - Download changes between your file and current playlist

### Private playlists

Playlist has to be **public** or **unlisted** in order to get the data.  
- [How to change playlist privacy setting?](https://support.google.com/youtube/answer/3127309?hl=en)

## Exported Data
You can export following information about the video:
| Data  | Description |
| ------------- | ------------- |
| Video ID  | The unique ID of YouTube video  |
| Title  | The video title  |
| Channel  |  The channel that uploaded the video |
| Added At  | The date that video was added to the playlist  |
| Published At  | The date that video was published to YouTube  |
| Thumbnail URL  | The video image URL  |
| Description  | Optional; The video description  |

## Setup (self-hosting)
To run this project locally you need to create your own [**Google API key**](https://cloud.google.com/docs/authentication/api-keys#creating_an_api_key).  
Then, go to [js/config.js](https://github.com/jolantahuba/YT-Backup/blob/192c1de2aecd48a1f699adee499f9afa664890aa/js/config.js#L1) file and change `API_KEY` value to your generated key:  
`const API_KEY = 'your_api_key';`

## Technologies
- HTML 5
- CSS 3 (SASS)
- JavaScript

## Inspiration
Personal needs.  
Created to never again wonder what's behind "Unavailable videos are hidden" in my YouTube playlist. :relaxed:

*This project is not endorsed or certified by YouTube / Google LLC.*
