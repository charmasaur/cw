var DEBUG = false;
var width;
var height;
var cell_letter;
var cell_label;
var is_cell_blocked;
var entries;

class Entry {
  constructor(index, is_across, start_r, start_c, len) {
    this.index = index;
    this.is_across = is_across;
    this.start_r = start_r;
    this.start_c = start_c;
    this.len = len;
  }
}

function find_entry(index, is_across) {
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].index == index && entries[i].is_across == is_across) {
      return entries[i];
    }
  }
  return null;
}

function onFileSelected(event) {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    init(e.target.result);
  };
  reader.readAsText(file);
  return false;
}

function onImageFileSelected(event) {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    init_image(e.target.result);
  };
  reader.readAsDataURL(file);
  return false;
}

function onSubmit() {
  var num = document.forms["new"]["number"].value;
  var across = document.forms["new"]["direction"].value == 'Across';
  var text = document.forms["new"]["text"].value.toUpperCase();

  entry = find_entry(num, across);
  if (entry == null) {
    alert("Entry not found");
    return false;
  }

  if (text.length != entry.len) {
    alert("Wrong length");
    return false;
  }

  if (across) {
    rdiff = 0;
    cdiff = 1;
  } else {
    rdiff = 1;
    cdiff = 0;
  }

  for (var i = 0; i < text.length; i++) {
    cell_letter[entry.start_r + i * rdiff][entry.start_c + i * cdiff].nodeValue = text[i];
  }
  return false;
}

function is_rc_good(r, c) {
  return r >= 0 && c >= 0 && r < height && c < height && !is_cell_blocked[r][c];
}

function is_entry_valid(entry) {
  // Have we already added it?
  if (find_entry(entry.index, entry.is_across)) {
    return false;
  }

  // Does it start at the same point as another but with a different index?
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].start_r == entry.start_r
        && entries[i].start_c == entry.start_c
        && entries[i].index != entry.index) {
      return false;
    }
  }

  // Does it fit?
  if (entry.is_across) {
    rdiff = 0;
    cdiff = 1;
  } else {
    rdiff = 1;
    cdiff = 0;
  }

  for (var i = 0; i < entry.len; i++) {
    if (!is_rc_good( entry.start_r + i * rdiff, entry.start_c + i * cdiff)) {
      return false;
    }
  }

  return true;
}

function maybe_add_entry(entry) {
  if (!is_entry_valid(entry)) {
    alert("Entry invalid: " + entry.index);
    return;
  }
  entries.push(entry);
}

function init_cell_blocks(lines) {
  is_cell_blocked = new Array(height);
  for (var r = 0; r < height; r++) {
    is_cell_blocked[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      if (lines[r][c] == ' ') {
        is_cell_blocked[r][c] = false;
      } else {
        is_cell_blocked[r][c] = true;
      }
    }
  }
}

function init_entries(lines) {
  entries = new Array();
  for (var i = 0; i < lines.length; i++) {
    var bits = lines[i].replace(/[^\w\s]/g, '').split(' ');
    maybe_add_entry(new Entry(
        parseInt(bits[0]),
        bits[1] == 'across',
        parseInt(bits[2]),
        parseInt(bits[3]),
        parseInt(bits[4])));
  }
}

function init_labels() {
  var div = document.getElementsByName("clues")[0];
  for (var i = 0; i < entries.length; i++) {
    cell_label[entries[i].start_r][entries[i].start_c].nodeValue = entries[i].index;

    div.appendChild(document.createTextNode(
        entries[i].index + ": " + entries[i].is_across + " (" + entries[i].start_r + ","
        + entries[i].start_c + ") " + entries[i].len));
    div.appendChild(document.createElement("br"));
  }
}

function init_image(url) {
    var img = document.getElementsByName("image_image")[0];
    img.src = url;
}

function init(file) {
  if (DEBUG) {
    width = 5;
    height = 5;
    init_cell_blocks(['# # #', '# # #', '     ', '     ', '     ']);
    init_entries(['1 down: (0, 1), 4']);
  } else {
    var pos = 0;
    var lines = file.split('\n');
    width = parseInt(lines[pos].split(' ')[0]);
    height = parseInt(lines[pos].split(' ')[1]);
    pos++;

    init_cell_blocks(lines.slice(pos, pos + height));
    pos += height;
    var nclues = parseInt(lines[pos]);
    pos++;
    init_entries(lines.slice(pos, pos + nclues));
  }

  var div = document.getElementsByName("table")[0];
  var table = document.createElement("table");
  cell_letter = new Array(height);
  cell_label = new Array(height);
  for (var r = 0; r < height; r++) {
    var row = document.createElement("tr");
    cell_letter[r] = new Array(width);
    cell_label[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      cell = document.createElement("td");
      cell_letter[r][c] = document.createTextNode("");
      cell_label[r][c] = document.createTextNode("");

      container = document.createElement("div");
      container.className = "cell_container";
      label = document.createElement("small");
      label.className = "cell_label";
      letter = document.createElement("div");
      letter.className = "cell_letter";

      label.appendChild(cell_label[r][c]);
      letter.appendChild(cell_letter[r][c]);

      container.appendChild(label);
      container.appendChild(letter);

      cell.appendChild(container);
      row.appendChild(cell);
      if (is_cell_blocked[r][c]) {
        cell.bgColor = '#000';
      }
    }
    table.appendChild(row);
  }
  div.appendChild(table);

  init_labels();
}

if (DEBUG) {
  window.onload = init;
}
