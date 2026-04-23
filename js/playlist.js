import { API_KEY } from './config.js';
import { arrayToCSV } from './helper.js';

export function getId(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  const result = regex.test(url);

  if(!result) {
    throw 'urlErr';
  }

  const id = url.match(/(?:[?&]list=)([^#\&\?]*).*/);
  return id[1];
}

export async function fetchPlaylist(id, hasDescription) {

  const fetchedItems = await fetchItems(id);

  // Extract video IDs (skip private videos that lack videoPublishedAt)
  const videoIds = fetchedItems
    .filter(item => item.contentDetails.videoPublishedAt)
    .map(item => item.snippet.resourceId.videoId);

  const durationsMap = await fetchDurations(videoIds);

  const playlistItems = saveItems(fetchedItems, hasDescription, durationsMap);

  const fetchedInfo = await fetchInfo(id);
  const playlistInfo = saveInfo(fetchedInfo);

  playlistInfo['Videos'] = playlistItems.length - 1; // without private videos

  return {
    info: playlistInfo,
    items: playlistItems
  }
}

export function compareItems(backupItems, currentItems) {
  const addedItems = [];
  const removedItems = [];

  for(let i = 0; i < currentItems.length; i++) {
    if(!backupItems.some(item => item.includes(currentItems[i][0]))) {
      addedItems.push(currentItems[i]);
    }
  }

  for(let i = 0; i < backupItems.length; i++) {
    if(!currentItems.some(item => item.includes(backupItems[i][0]))) {
      removedItems.push(backupItems[i]);
    }
  }
  
  return {
    added: addedItems,
    removed: removedItems,
  }
}

export function playlistToCSV(playlist) {
  const blob = new Blob([
    '\uFEFF', // Add BOM here to fix Excel encoding issue
    arrayToCSV(Object.entries(playlist.info)),
    '\r\n\r\n',
    arrayToCSV(playlist.items)
  ], {type: 'text/csv;charset=utf-8;'});

  return blob;
}

export function csvToPlaylist(csv) {

  let arr = csv.split('\r\n');

  for(let i = 0; i < arr.length; i++) {
    arr[i] = arr[i]
      .split(',')
      .map(v => v.replace(/""/g, '"'))
      .map(v => v.replace(/^"|"$/g, ''));
  }

  return {
    info: Object.fromEntries(arr.slice(0, 4)),
    items: arr.slice(5,),
  }
}

async function fetchItems(id) {
  const itemsApi = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${id}&key=${API_KEY}`;

  const fetchedItems = [];
  const response = await fetch(itemsApi);
  
  if(!response.ok) {
    if(response.status == 404) {
      throw 'notFoundErr';
    } else {
      throw 'fetchErr';
    }
  }
  
  let result = await response.json();
  fetchedItems.push(...result.items);

  while(result.nextPageToken) {
    let resp = await fetch(itemsApi + `&pageToken=${result.nextPageToken}`);
    result = await resp.json();
    fetchedItems.push(...result.items);
  }

  return fetchedItems;
}

async function fetchInfo(id) {
  const playlistApi = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&id=${id}&key=${API_KEY}`;

  const response = await fetch(playlistApi);
  if(!response.ok) throw 'fetchErr';
  const fetchedInfo = await response.json();

  return fetchedInfo;
}


// Fetches durations from the '/videos' endpoint. Returns a Map of {videoId -> duration}.

async function fetchDurations(videoIds) {
  const durationsMap = new Map();
  const BATCH_SIZE = 50;

  for(let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const videosApi = `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${API_KEY}`;

    const response = await fetch(videosApi);
    if(!response.ok) throw 'fetchErr';

    const result = await response.json();
    for(const video of result.items) {
      durationsMap.set(video.id, parseDuration(video.contentDetails.duration));
    }
  }

  return durationsMap;
}


// Converts ISO 8601 duration ("PT1H4M13S") to "H:MM:SS" / "M:SS".

function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!match) return '';

  const hours   = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');

  return hours > 0
    ? `${hours}:${mm}:${ss}`
    : `${mm}:${ss}`;
}

function saveItems(items, hasDescription, durationsMap) {
  const result = [];

  const headers = [
    'Video ID', 'Title', 'Channel', 'Added At', 'Published At', 'Duration', 'Thumbnail URL'
  ];
  if(hasDescription) headers.push('Description');
  result.push(headers);

  for(let item of items){
    // Skipping private videos, they dont have publishedAt date
    if(!item.contentDetails.videoPublishedAt) continue;

    const videoId = item.snippet.resourceId.videoId;

    const line = [
      videoId,
      item.snippet.title,
      item.snippet.videoOwnerChannelTitle,
      item.snippet.publishedAt.slice(0,10),
      item.contentDetails.videoPublishedAt.slice(0,10),
      durationsMap.get(videoId) ?? '',
      item.snippet.thumbnails.high?.url,
    ];
    if(hasDescription) line.push(item.snippet.description);

    result.push(line);
  }

  return result;
}

function saveInfo(info) {
  const result = {
    'Playlist URL': `https://www.youtube.com/playlist?list=${info.items[0].id}`,
    'Playlist title': info.items[0].snippet.title,
    'Playlist author': info.items[0].snippet.channelTitle,
  }
  return result;
}