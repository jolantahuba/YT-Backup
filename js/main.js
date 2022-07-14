'use strict'

const createBtn = document.getElementById('create-btn');
const findBtn = document.getElementById('find-btn');
const exportBtn = document.getElementById('export-btn');

const menuToggler = document.querySelector('.menu__toggler');
const inputFile = document.getElementById('input-file');
const urlInput = document.getElementById('input-url');

const apiKey = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

async function getPlaylistItems(id) {
  
  const addDesc = document.getElementById('add-description').checked;
  const playlistItems = [];
  const itemsApi = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=5&playlistId=${id}&key=${apiKey}`;

  const headers = ['ID', 'Title', 'Channel', 'PublishedAt']
  if(addDesc) headers.push('Description');
  playlistItems.push(headers);

  try {
    let response = await fetch(itemsApi);
    if(!response.ok) {
      throw response.status;
    }

    let result = await response.json();
    pushItems(result.items);

    while(result.nextPageToken) {
      // console.log('continue fetching...');
      response = await fetch(itemsApi + `&pageToken=${result.nextPageToken}`);
      result = await response.json();
      pushItems(result.items);
    }

    // console.log(playlistItems)
    return playlistItems;

  } catch(err) {
    if(err === 404) {
      urlInput.insertAdjacentHTML('afterend', createError('Playlist not found', 'Check the URL or playlist privacy settings - should be set to public or non-public'));
    } else {
      urlInput.insertAdjacentHTML('afterend', createError('Data retrieving problem.', 'Please try again later.'));
    }
  }

  function pushItems(items) {
    for(let item of items){

      const line = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
        item.contentDetails.videoPublishedAt,
      ];
      if(addDesc) line.push(item.snippet.description);
  
      playlistItems.push(line);
    }
  }
}

async function getPlaylistInfo(id) {
  const playlistApi = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&id=${id}&key=${apiKey}`;

  const response = await fetch(playlistApi);
  let result = await response.json();
  if(!result.items.length) return;

  const playlistInfo = {
    id: result.items[0].id,
    title: result.items[0].snippet.title,
    author: result.items[0].snippet.channelTitle,
    videos: result.items[0].contentDetails.itemCount,
  }
    // console.log(playlistInfo)
  return playlistInfo;
}

async function getPlaylist() {
  const playlistId = urlInput.value.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);

  const info = await getPlaylistInfo(playlistId);
  const items = await getPlaylistItems(playlistId);

  if(info && items) {
    const playlist = {
      info: info,
      items:items,
    }
    return playlist;
  }
  
}

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

exportBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearError();

  if(!checkUrl(urlInput.value)) {
    urlInput.insertAdjacentHTML('afterend', createError('Invalid URL'));
    return;
  }

  (async () => {
    const playlist = await getPlaylist();
    // if(!playlist) return;
    console.log(playlist);
    

    // showSection('export');
  })();


});

function checkUrl(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  return regex.test(url);
}

function createError(title, desc) {

  let errorElement = `
  <div class="error">
    <div class="error__title">
      <img src="icons/error.svg" alt="">
      <p>${title}</p>
    </div>
    ${desc ? `<p class="error__desc">${desc}</p>` : ``}
  </div>`;

  return errorElement;
}

function clearError() {
  const error = document.querySelector('.error');
  if(error) error.remove();
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

inputFile.addEventListener('change', (e) => {
  const fileLabel = document.querySelector('label[for=input-file]');

  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});