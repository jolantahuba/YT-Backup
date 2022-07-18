'use strict'

const createBtn = document.getElementById('create-btn');
const findBtn = document.getElementById('find-btn');
const exportBtn = document.getElementById('export-btn');
const downloadBtn = document.getElementById('download-btn');
const checkBtn = document.getElementById('check-btn');

const menuToggler = document.querySelector('.menu__toggler');
const inputFile = document.getElementById('input-file');
const fileLabel = document.querySelector('label[for=input-file]');
const urlInput = document.getElementById('input-url');

const apiKey = 'AIzaSyDlaaI4Y7-fklD-lscHes8jiC8tc7YnGOU';

async function getPlaylistItems(id, errElement) {
  
  const addDesc = document.getElementById('add-description').checked;
  const playlistItems = [];
  const itemsApi = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${id}&key=${apiKey}`;

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
      response = await fetch(itemsApi + `&pageToken=${result.nextPageToken}`);
      result = await response.json();
      pushItems(result.items);
    }

    return playlistItems;

  } catch(err) {
    if(err === 404) {
      errElement.insertAdjacentHTML('afterend', createError('Playlist not found', 'Check the URL or playlist privacy settings - should be set to public or non-public'));
    } else {
      errElement.insertAdjacentHTML('afterend', createError('Data retrieving problem.', 'Please try again later.'));
    }
  }

  function pushItems(items) {
    for(let item of items){

      const line = [
        item.snippet.resourceId.videoId,
        item.snippet.title,
        item.snippet.videoOwnerChannelTitle,
        item.contentDetails.videoPublishedAt.slice(0,10),
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
    'Playlist URL': `https://www.youtube.com/playlist?list=${result.items[0].id}`,
    'Playlist title': result.items[0].snippet.title,
    'Playlist author': result.items[0].snippet.channelTitle,
    'Videos': result.items[0].contentDetails.itemCount,
  }
  return playlistInfo;
}

// async function getPlaylist(id, errElement) {

//   const info = await getPlaylistInfo(id);
//   const items = await getPlaylistItems(id, errElement);

//   if(info && items) {
//     const playlist = {
//       info: info,
//       items:items,
//     }
//     return playlist;
//   }

// }

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

  if(!checkUrl(urlInput.value)) return;

  const playlistId = urlInput.value.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);

  (async () => {
    const playlistInfo = await getPlaylistInfo(playlistId);
    const playlistItems = await getPlaylistItems(playlistId, urlInput);
    if(!playlistItems) return;

    const fileCSV = makeCSV(playlistInfo, playlistItems);
    const fileUrl = URL.createObjectURL(fileCSV);
    // console.log(fileCSV);

    downloadBtn.addEventListener(
      'click', 
      downloadFile(downloadBtn, fileUrl, playlistInfo['Playlist title'])
    );

    showPlaylistInfo(playlistInfo, fileCSV.size);
    showSection('export');
  })();
});

checkBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const file = inputFile.files[0];

  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    const csv = reader.result;
    const backupData = csvToArray(csv);
    const backupItems = backupData.slice(5,);
    const playlistId = idFromUrl(backupData[0][1]);
    console.log(backupItems);
    
    (async () => {
      let playlistInfo = await getPlaylistInfo(playlistId);
      let playlistItems = await getPlaylistItems(playlistId, fileLabel);

      compareItems(backupItems, playlistItems);

    })();
  };
  // reader.onerror = () => {
  //   fileLabel.insertAdjacentHTML('afterend', createError('Cannot read the file'));
  // }
});




function downloadFile(link, url, name) {
  const date = new Date().toISOString().slice(0, 10);

  link.setAttribute("href", url);
  link.setAttribute('download', `${name}-${date}`);
}

function idFromUrl(url) {
  return url.match(/(?<=[?&]list=).[^&]+(?=&|\b)/);
}

function makeCSV(info, items) {

  const blob = new Blob([
    arrayToCSV(Object.entries(info)),
    '\r\n\r\n',
    arrayToCSV(items)
  ], {type: 'text/csv;charset=utf-8;'});

  return blob;
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

function csvToArray(csv) {

  let arr = csv.split('\r\n');
  
  for(let i = 0; i < arr.length; i++) {

    arr[i] = arr[i]
      .split(',')
      .map(v => v.replace(/""/g, '"'))
      .map(v => v.replace(/^"|"$/g, ''));
  }
  return arr;
}

function checkUrl(url) {
  const regex = /(https:\/\/)?(www\.)?(m.)?youtube\.com.*[?&]list=.*/;
  const result = regex.test(url);
  if(!result) {
    urlInput.insertAdjacentHTML('afterend', createError('Invalid URL'));
  }
  return result;
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
  clearError();
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

inputFile.addEventListener('change', (e) => {
  const path = e.target.value.split('\\');
  const fileName = path[path.length-1];
  fileLabel.textContent = fileName;
});