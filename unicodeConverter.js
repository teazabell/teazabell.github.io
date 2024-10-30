function clearDataUnicode() {
  document.getElementById('inputUnicode').value = '';
  document.getElementById('unicodeOutput').textContent = '';
}

function processUnicodeConverter() {
  const properties = {};

  const data = document.getElementById('inputUnicode').value;
  const lines = data.split('\n');

  const keyValuePattern = /^\s*(\S+)\s*=\s*(.*)$/;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = keyValuePattern.exec(line);
    if (match) {
      let key = match[1];
      let value = match[2].trim();

      // Join lines if value is split over multiple lines
      while (value.endsWith('\\')) {
        i++;
        if (i < lines.length) {
          const nextLine = lines[i].trim();
          if (nextLine) {
            value += nextLine;
          }
        } else {
          break;
        }
      }

      // Decode Unicode escape sequences and remove all backslashes
      const decodedValue = value
        .replace(/\\u([0-9A-Fa-f]{4})/g, (match, grp) => {
          return String.fromCharCode(parseInt(grp, 16)); // Convert Unicode escapes to characters
        })
        .replace(/\\/g, ''); // Remove all backslashes

      properties[key] = decodedValue;
    }
    i++;
  }

  const json = JSON.stringify(properties, null, 2);
  document.getElementById('unicodeOutput').textContent = json;
}