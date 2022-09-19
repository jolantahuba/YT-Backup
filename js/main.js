'use strict'

const API_KEY = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

const elements = {
  createBtn: document.getElementById('create-btn'),
  findBtn: document.getElementById('find-btn'),
  exportBtn: document.getElementById('export-btn'),
  downloadBtn: document.getElementById('download-btn'),
  checkBtn: document.getElementById('check-btn'),
  updateBtn: document.getElementById('update-btn'),
  downloadChangesBtn: document.getElementById('download-changes-btn'),

  menuToggler: document.querySelector('.menu__toggler'),
  fileInput: document.getElementById('input-file'),
  fileLabel: document.querySelector('label[for=input-file]'),
  urlInput: document.getElementById('input-url'),
  descriptionCheckbox: document.getElementById('add-description'),

  sections: [...document.querySelectorAll('.section')],
  overlay: document.querySelector('.overlay'),
  loader: document.querySelector('.loader'),
}

function init() {
  elements.createBtn.addEventListener('click', createBtnHandler);
  elements.findBtn.addEventListener('click', findBtnHandler);
  elements.fileInput.addEventListener('change', addFileNameDisplay);
  
  elements.exportBtn.addEventListener('click', exportBtnHandler);
  elements.checkBtn.addEventListener('click', checkBtnHandler);
}

// Controllers

function createBtnHandler() {
  elements.urlInput.value = '';
  elements.findBtn.classList.remove('active');
  elements.createBtn.classList.add('active');
  elements.menuToggler.classList.remove('switched');
  showSection('create');
}

function findBtnHandler() {
  elements.createBtn.classList.remove('active');
  elements.findBtn.classList.add('active');
  elements.menuToggler.classList.add('switched');
  showSection('find');
}

async function exportBtnHandler(e) {
  e.preventDefault();
  addScreenLock();
  await exportController();
  removeScreenLock();
}

async function exportController() {
  try {
    const playlistId = getId(elements.urlInput.value);
    const hasDescription = elements.descriptionCheckbox.checked;
    const backupPlaylist = await fetchPlaylist(playlistId, hasDescription);
    const backupFile = playlistToCSV(backupPlaylist);

    elements.downloadBtn.addEventListener(
      'click', 
      downloadFile(elements.downloadBtn, backupFile, backupPlaylist.info['Playlist title'])
    );

    showPlaylistInfo(backupPlaylist.info, backupFile.size);
    showSection('export');

  } catch(err) {
    let message, details;
    if(err == 'urlErr') {
      message = 'Invalid URL';
    } else if(err == 'notFoundErr') {
      message = 'Playlist not found';
      details = 'Check the URL or playlist privacy settings - should be set to public or unlisted';
    } else {
      message = 'Data retrieving problem';
      details = 'Please try again later';
    }
    createError(elements.urlInput, message, details);
  }
}

function checkBtnHandler(e) {
  e.preventDefault();
  
  if(!elements.fileInput.files[0]) {
    createError(elements.fileLabel, 'Add your backup file');
    return;
  }

  const reader = new FileReader();
  reader.readAsText(elements.fileInput.files[0]);
  reader.addEventListener('load', async () => {
    addScreenLock();
    await compareBackupController(reader);
    removeScreenLock();
  });
}

async function compareBackupController(reader) {
  try {
    const backupPlaylist = csvToPlaylist(reader.result);
    const playlistId = getId(backupPlaylist.info['Playlist URL']);
    const hasDescription = backupPlaylist.items[0].includes('Description') ? true : false;

    const currentPlaylist = await fetchPlaylist(playlistId, hasDescription);
    const changes = compareItems(backupPlaylist.items, currentPlaylist.items);

    addDownloadChangesBtnHandler(changes);
    addUpdateBtnHandler(currentPlaylist);

    showComparedItems(changes);
    showSection('compare');

  } catch(err) {
    let message, details;
    if(err == 'notFoundErr') {
      message = 'Cannot compare playlist';
      details = 'Playlist from your backup no longer exists or was changed to private';
    } else {
      message = 'Cannot read the data';
      details = 'Your backup file have corrupted data';
    }
    createError(elements.fileLabel, message, details);
  }
}

function addUpdateBtnHandler(currentPlaylist) {
  elements.updateBtn.addEventListener('click', () => {
    const playlistFile = playlistToCSV(currentPlaylist);
    downloadFile(elements.downloadBtn, playlistFile, currentPlaylist.info['Playlist title']);
    showPlaylistInfo(currentPlaylist.info, playlistFile.size);
    showSection('export');
  });
}

function addDownloadChangesBtnHandler(changes) {
  elements.downloadChangesBtn.addEventListener('click', () => {
    const changesFile = createChangesFile(changes);
    downloadFile(elements.downloadChangesBtn, changesFile, 'playlist-changes');
  });
}

// Playlist

function getId(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  const result = regex.test(url);

  if(!result) {
    throw 'urlErr';
  }

  const id = url.match(/(?:[?&]list=)(.[^&]+(?=&|\b))/);
  return id[1];
}

async function fetchPlaylist(id, hasDescription) {

  const fetchedItems = await fetchItems(id);
  const playlistItems = saveItems(fetchedItems, hasDescription);

  const fetchedInfo = await fetchInfo(id);
  const playlistInfo = saveInfo(fetchedInfo);

  playlistInfo['Videos'] = playlistItems.length - 1; // without private videos

  return {
    info: playlistInfo,
    items: playlistItems
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

function saveItems(items, hasDescription) {
  const result = [];

  const headers = [
    'ID', 'Title', 'Channel', 'PublishedAt'
  ];
  if(hasDescription) headers.push('Description');
  result.push(headers);

  for(let item of items){
    // Skipping private videos
    if(item.snippet.title === 'Private video') continue;
    // if(!item.contentDetails.videoPublishedAt) continue;
    
    const line = [
      item.snippet.resourceId.videoId,
      item.snippet.title,
      item.snippet.videoOwnerChannelTitle,
      item.contentDetails.videoPublishedAt.slice(0,10),
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

function compareItems(backupItems, currentItems) {
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

function playlistToCSV(playlist) {
  const blob = new Blob([
    arrayToCSV(Object.entries(playlist.info)),
    '\r\n\r\n',
    arrayToCSV(playlist.items)
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

function createChangesFile(changes) {
  const changesFile = new Blob([
    `"Added videos: ${changes.added.length}"\r\n`,
    arrayToCSV(changes.added),
    '\r\n\r\n',
    `"Removed videos: ${changes.removed.length}"\r\n`,
    arrayToCSV(changes.removed)
  ], {type: 'text/csv;charset=utf-8;'});
  return changesFile;
}

function downloadFile(element, file, name) {
  const date = new Date().toISOString().slice(0, 10);

  element.setAttribute("href", URL.createObjectURL(file));
  element.setAttribute('download', `${name.split(' ').join('-')}-${date}`);
}

// View

function createError(element, message, details) {
  clearError();
  const errSvg = 'icons/error.svg';

  let error = `
  <div class="error">
    <div class="error__title">
      <img src=${errSvg} alt="">
      <p>${message}</p>
    </div>
    ${details ? `<p class="error__desc">${details}</p>` : ``}
  </div>`;

  element.insertAdjacentHTML('afterend', error);
}

function clearError() {
  let error = document.querySelector('.error');
  if(error) error.remove();
}

function showSection(sectionId) {
  clearError();

  elements.sections
    .find(section => section.classList.contains('active'))
    .classList.remove('active')

  elements.sections
    .find(section => section.id == sectionId)
    .classList.add('active');
}

function showPlaylistInfo(info, fileSize) {
  const title = document.querySelector('[data-label=title]');
  const author = document.querySelector('[data-label=author]');
  const videos = document.querySelector('[data-label=videos]');
  const size = document.querySelector('[data-label=size]');
  
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

function addScreenLock() {
  elements.overlay.classList.add('active');
  elements.loader.classList.add('active');
}

function removeScreenLock() {
  elements.overlay.classList.remove('active');
  elements.loader.classList.remove('active');
}

function addFileNameDisplay(e) {
  if(!e.target.value) {
    elements.fileLabel.innerHTML = `
    <img src="icons/file.svg" alt="">
    Choose your backup file`
    return;
  }
  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  elements.fileLabel.textContent = fileName;
}

init();