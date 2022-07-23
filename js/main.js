'use strict'

const createBtn = document.getElementById('create-btn');
const findBtn = document.getElementById('find-btn');
const exportBtn = document.getElementById('export-btn');
const downloadBtn = document.getElementById('download-btn');
const checkBtn = document.getElementById('check-btn');
const updateBtn = document.getElementById('update-btn');
const downloadChangesBtn = document.getElementById('download-changes-btn');

const menuToggler = document.querySelector('.menu__toggler');
const fileInput = document.getElementById('input-file');
const fileLabel = document.querySelector('label[for=input-file]');
const urlInput = document.getElementById('input-url');
const overlay = document.querySelector('.overlay');
const loader = document.querySelector('.loader');

const apiKey = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

createBtn.addEventListener('click', () => {

  showSection('create');
  findBtn.classList.remove('active');
  createBtn.classList.add('active');
  menuToggler.classList.remove('switched');

});

findBtn.addEventListener('click', () => {

  showSection('find');
  createBtn.classList.remove('active');
  findBtn.classList.add('active');
  menuToggler.classList.add('switched');

});

exportBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  let playlist = null;

  try {
    const playlistId = getId(urlInput.value);
    playlist = await getPlaylist(playlistId);
  } catch(err) {
    if(err.message == 'Invalid URL') {
      createError(urlInput, err.message);
    } else if(err.message == 'Playlist not found') {
      createError(urlInput, err.message, 'Check the URL or playlist privacy settings - should be set to public or unlisted');
    } else {
      createError(urlInput, 'Data retrieving problem', 'Please try again later');
    }
    return;
  }

  const backupFile = playlistToCSV(playlist.info, playlist.items);

  downloadBtn.addEventListener(
    'click', 
    downloadFile(downloadBtn, backupFile, playlist.info['Playlist title'])
  );

  showPlaylistInfo(playlist.info, backupFile.size);
  showSection('export');
});

checkBtn.addEventListener('click', (e) => {
  e.preventDefault();
  
  if(!fileInput.files[0]) {
    createError(fileLabel, 'Add your backup file');
    return;
  }
  
  const reader = new FileReader();
  reader.readAsText(fileInput.files[0]);
  
  reader.onload = async () => {
    let backup, playlist, diff = null;

    try{
      backup = csvToPlaylist(reader.result);
      const playlistId = getId(backup.info['Playlist URL']);

      if(backup.items[0].includes('Description')) {
        document.getElementById('add-description').checked = true;
      }

      playlist = await getPlaylist(playlistId);
      diff = compareItems(backup.items, playlist.items);

    } catch(err) { 
      if(err.message == 'Playlist not found') {
        createError(fileLabel, err.message, 'Check the Playlist URL in your backup file');
      } else {
        createError(fileLabel, 'Cannot read the data', 'Your backup file could have corrupted data');
      }
      return;
    }

    updateBtn.addEventListener('click', () => {
      const playlistFile = playlistToCSV(playlist.info, playlist.items);
      downloadFile(downloadBtn, playlistFile, playlist.info['Playlist title']);
      showPlaylistInfo(playlist.info, playlistFile.size);
      showSection('export');
    });

    downloadChangesBtn.addEventListener('click', () => {
      const changesFile = new Blob([
        `"Added videos: ${compared.added.length}"\r\n`,
        arrayToCSV(compared.added),
        '\r\n\r\n',
        `"Removed videos: ${compared.removed.length}"\r\n`,
        arrayToCSV(compared.removed)
      ], {type: 'text/csv;charset=utf-8;'});
      
      downloadFile(downloadChangesBtn, changesFile, 'playlist-changes');
    });

    showComparedItems(diff);
    showSection('compare');
  };  
});

async function getPlaylist(id) {
  
  const addDesc = document.getElementById('add-description').checked;
  const playlist = {
    info: null,
    items: [],
  };
  const itemsApi = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=5&playlistId=${id}&key=${apiKey}`;
  const playlistApi = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&id=${id}&key=${apiKey}`;

  const headers = ['ID', 'Title', 'Channel', 'PublishedAt']
  if(addDesc) headers.push('Description');
  playlist.items.push(headers);

  try {
    overlay.classList.add('active');
    loader.classList.add('active');

    let responses = await Promise.all([
      fetch(itemsApi),
      fetch(playlistApi)
    ]);

    responses.forEach(res => {
      if(!res.ok) throw res.status;
    })

    let [resultItems, resultInfo] = await Promise.all(
      responses.map(r => r.json())
    );
    pushItems(resultItems.items);

    while(resultItems.nextPageToken) {
      let resp = await fetch(itemsApi + `&pageToken=${resultItems.nextPageToken}`);
      resultItems = await resp.json();
      pushItems(resultItems.items);
    }

    pushInfo(resultInfo);

    return playlist;

  } catch(err) {
    if(err === 404) {
      throw new Error('Playlist not found');
    } else {
      throw new Error('Data fetching problem');
    }
  } finally {
    overlay.classList.remove('active');
    loader.classList.remove('active');
  }

  function pushItems(items) {
    for(let item of items){
      // Skipping private videos
      // if(item.snippet.title === 'Private video') continue;
      if(!item.contentDetails.videoPublishedAt) continue;
      
      const line = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
        item.contentDetails.videoPublishedAt.slice(0,10),
      ];
      if(addDesc) line.push(item.snippet.description);
  
      playlist.items.push(line);
    }
  }

  function pushInfo(info) {
    playlist.info = {
      'Playlist URL': `https://www.youtube.com/playlist?list=${info.items[0].id}`,
      'Playlist title': info.items[0].snippet.title,
      'Playlist author': info.items[0].snippet.channelTitle,
      'Videos': playlist.items.length - 1 // videos count without private
      // 'Videos': info.items[0].contentDetails.itemCount,
    }
  }
}

function getId(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  const result = regex.test(url);

  if(!result) {
    throw new Error('Invalid URL');
  }

  const id = url.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);
  return id;
}

function downloadFile(element, file, name) {
  const date = new Date().toISOString().slice(0, 10);

  element.setAttribute("href", URL.createObjectURL(file));
  element.setAttribute('download', `${name.split(' ').join('-')}-${date}`);
}

function arrayToCSV(arr) {
  const csv = arr.map(row =>
    row
    .map(String)  // convert every value to String
    .map(v => v.replaceAll('"', '""'))  // escape double colons
    .map(v => `"${v}"`)  // quote it
    .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
  return csv;
}

function playlistToCSV(info, items) {

  const blob = new Blob([
    arrayToCSV(Object.entries(info)),
    '\r\n\r\n',
    arrayToCSV(items)
  ], {type: 'text/csv;charset=utf-8;'});

  return blob;
}

function csvToPlaylist(csv) {

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

function compareItems(backupItems, playlistItems) {
  const addedItems = [];
  const removedItems = [];

  for(let i = 0; i < playlistItems.length; i++) {
    if(!backupItems.some(item => item.includes(playlistItems[i][0]))) {
      addedItems.push(playlistItems[i]);
    }
  }

  for(let i = 0; i < backupItems.length; i++) {
    if(!playlistItems.some(item => item.includes(backupItems[i][0]))) {
      removedItems.push(backupItems[i]);
    }
  }
  
  return {
    added: addedItems,
    removed: removedItems,
  }
}

function createError(element, title, message) {
  let error = document.querySelector('.error');
  if(error) error.remove();

  error = `
  <div class="error">
    <div class="error__title">
      <img src="icons/error.svg" alt="">
      <p>${title}</p>
    </div>
    ${message ? `<p class="error__desc">${message}</p>` : ``}
  </div>`;

  element.insertAdjacentHTML('afterend', error);
}

function showSection(sectionId) {
  const sections = [...document.querySelectorAll('.section')];

  sections
    .find(section => section.classList.contains('active'))
    .classList.remove('active')

  sections
    .find(section => section.id == sectionId)
    .classList.add('active');
}

function showPlaylistInfo(info, fileSize) {
  const title = document.querySelector('[data-label=title');
  const author = document.querySelector('[data-label=author');
  const videos = document.querySelector('[data-label=videos');
  const size = document.querySelector('[data-label=size');
  
  title.textContent = info['Playlist title'];
  author.textContent = info['Playlist author'];
  videos.textContent = info['Videos'];
  size.textContent = (fileSize / 1024).toFixed(1) + 'KB';
}

function showComparedItems(compared) {
  const addedCounter = document.getElementById('added-counter');
  const removedCounter = document.getElementById('removed-counter');
  const addedList = document.getElementById('added-list');
  const removedList = document.getElementById('removed-list');

  addedList.textContent = '';
  removedList.textContent = '';
  addedCounter.textContent = compared.added.length;
  removedCounter.textContent = compared.removed.length;

  for(let item of compared.added) {
    const li = document.createElement('li');
    li.textContent = '+ ' + item[1];
    addedList.appendChild(li);
  }

  for(let item of compared.removed) {
    const li = document.createElement('li');
    li.textContent = '- ' + item[1];
    removedList.appendChild(li);
  }
}

fileInput.addEventListener('change', (e) => {
  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});