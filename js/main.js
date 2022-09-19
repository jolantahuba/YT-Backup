import { elements } from "./elements.js";
import { downloadFile, createChangesFile } from "./helper.js";
import * as playlist from "./playlist.js";
import * as view from "./view.js";

function createBtnHandler() {
  elements.urlInput.value = '';
  elements.findBtn.classList.remove('active');
  elements.createBtn.classList.add('active');
  elements.menuToggler.classList.remove('switched');
  view.showSection('create');
}

function findBtnHandler() {
  elements.createBtn.classList.remove('active');
  elements.findBtn.classList.add('active');
  elements.menuToggler.classList.add('switched');
  view.showSection('find');
}

async function exportBtnHandler(e) {
  e.preventDefault();
  view.addScreenLock();
  await exportController();
  view.showSection('export');
}

async function exportController() {
  try {
    const playlistId = playlist.getId(elements.urlInput.value);
    const hasDescription = elements.descriptionCheckbox.checked;
    const backupPlaylist = await playlist.fetchPlaylist(playlistId, hasDescription);
    const backupFile = playlist.playlistToCSV(backupPlaylist);

    elements.downloadBtn.addEventListener(
      'click', 
      downloadFile(elements.downloadBtn, backupFile, backupPlaylist.info['Playlist title'])
    );

    view.showPlaylistInfo(backupPlaylist.info, backupFile.size);
    view.removeScreenLock();

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
    view.createError(elements.urlInput, message, details);
  }
}

function checkBtnHandler(e) {
  e.preventDefault();
  
  if(!elements.fileInput.files[0]) {
    view.createError(elements.fileLabel, 'Add your backup file');
    return;
  }

  const reader = new FileReader();
  reader.readAsText(elements.fileInput.files[0]);
  reader.addEventListener('load', async () => {
    view.addScreenLock();
    await compareBackupController(reader);
    view.removeScreenLock();
  });
}

async function compareBackupController(reader) {
  try {
    const backupPlaylist = playlist.csvToPlaylist(reader.result);
    const playlistId = playlist.getId(backupPlaylist.info['Playlist URL']);
    const hasDescription = backupPlaylist.items[0].includes('Description') ? true : false;

    const currentPlaylist = await playlist.fetchPlaylist(playlistId, hasDescription);
    const changes = playlist.compareItems(backupPlaylist.items, currentPlaylist.items);

    addDownloadChangesBtnHandler(changes);
    addUpdateBtnHandler(currentPlaylist);

    view.showComparedItems(changes);
    view.showSection('compare');

  } catch(err) {
    let message, details;
    if(err == 'notFoundErr') {
      message = 'Cannot compare playlist';
      details = 'Playlist from your backup no longer exists or was changed to private';
    } else {
      message = 'Cannot read the data';
      details = 'Your backup file has corrupted data';
    }
    view.createError(elements.fileLabel, message, details);
  }
}

function addUpdateBtnHandler(currentPlaylist) {
  elements.updateBtn.addEventListener('click', () => {
    const playlistFile = playlist.playlistToCSV(currentPlaylist);
    downloadFile(elements.downloadBtn, playlistFile, currentPlaylist.info['Playlist title']);
    view.showPlaylistInfo(currentPlaylist.info, playlistFile.size);
    view.showSection('export');
  });
}

function addDownloadChangesBtnHandler(changes) {
  elements.downloadChangesBtn.addEventListener('click', () => {
    const changesFile = createChangesFile(changes);
    downloadFile(elements.downloadChangesBtn, changesFile, 'playlist-changes');
  });
}

function init() {
  elements.createBtn.addEventListener('click', createBtnHandler);
  elements.findBtn.addEventListener('click', findBtnHandler);
  elements.fileInput.addEventListener('change', view.addFileNameDisplay);
  
  elements.exportBtn.addEventListener('click', exportBtnHandler);
  elements.checkBtn.addEventListener('click', checkBtnHandler);
}

init();