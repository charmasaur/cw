var DEBUG = true;
var width;
var height;
var cells;
var cell_elements;
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
    cell_elements[entry.start_r + i * rdiff][entry.start_c + i * cdiff].nodeValue = text[i];
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

  var div = document.getElementsByName("clues")[0];
  for (var i = 0; i < entries.length; i++) {
    if (cells[entries[i].start_r][entries[i].start_c].childNodes.length == 1) {
      // TODO: Make superscripting work
      var sm = document.createElement("small");
      //sm.className = "supersc";
      sm.appendChild(document.createTextNode(entries[i].index));
      var cell = cells[entries[i].start_r][entries[i].start_c];
      cell.insertBefore(sm, cell.firstChild);
    }

    div.appendChild(document.createTextNode(
        entries[i].index + ": " + entries[i].is_across + " (" + entries[i].start_r + ","
        + entries[i].start_c + ") " + entries[i].len));
    div.appendChild(document.createElement("br"));
  }
}

function init(file) {
  if (DEBUG) {
    width = 5;
    height = 5;
    init_cell_blocks(['# # #', '# # #', '     ', '     ', '     ']);
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
  cells = new Array(height);
  cell_elements = new Array(height);
  for (var r = 0; r < height; r++) {
    var row = document.createElement("tr");
    cells[r] = new Array(width);
    cell_elements[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      cells[r][c] = document.createElement("td");
      cell_elements[r][c] = document.createTextNode("");
      cells[r][c].appendChild(cell_elements[r][c]);
      row.appendChild(cells[r][c]);
      if (is_cell_blocked[r][c]) {
        cells[r][c].bgColor = '#000';
      }
    }
    table.appendChild(row);
  }
  div.appendChild(table);

  if (DEBUG) {
    init_entries(['1 down: (0, 1), 4']);
  } else {
    init_entries(lines.slice(pos, pos + nclues));
  }
}

if (DEBUG) {
  window.onload = init;
}
