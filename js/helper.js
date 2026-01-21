export function downloadFile(element, file, name) {
  const date = new Date().toISOString().slice(0, 10);

  element.setAttribute("href", URL.createObjectURL(file));
  element.setAttribute('download', `${name.split(' ').join('-')}-${date}`);
}

export function arrayToCSV(arr) {
  const csv = arr.map(row =>
    row
    .map(String)  // convert every value to String
    .map(v => v.replaceAll('"', '""'))  // escape double colons
    .map(v => `"${v}"`)  // quote it
    .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
  return csv;
}

export function createChangesFile(changes) {
  const changesFile = new Blob([
    '\uFEFF', // Add BOM here to fix Excel encoding issue
    `"Added videos: ${changes.added.length}"\r\n`,
    arrayToCSV(changes.added),
    '\r\n\r\n',
    `"Removed videos: ${changes.removed.length}"\r\n`,
    arrayToCSV(changes.removed)
  ], {type: 'text/csv;charset=utf-8;'});
  return changesFile;
}