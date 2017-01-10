var width;
var height;
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

function onSubmit() {
  var num = document.forms["new"]["number"].value;
  var across = document.forms["new"]["direction"].value == 'Across';
  var text = document.forms["new"]["text"].value;

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
  if (find_entry(entry.index, entry.is_across)) {
    return false;
  }

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
  }
  entries.push(entry);
}

function init_entries() {
  entries = new Array();
  maybe_add_entry(new Entry(4, false, 0, 1, 5));
  maybe_add_entry(new Entry(2, true, 1, 0, 6));

  var div = document.getElementsByName("clues")[0];
  for (var i = 0; i < entries.length; i++) {
    div.appendChild(document.createTextNode(
        entries[i].index + ": " + entries[i].is_across + " (" + entries[i].start_r + ","
        + entries[i].start_c + ") " + entries[i].len));
    div.appendChild(document.createElement("br"));
  }
}

function init_cell_blocks() {
  is_cell_blocked = new Array(height);
  for (var r = 0; r < height; r++) {
    is_cell_blocked[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      if (c % 2 == 0 && r % 2 == 0) {
        is_cell_blocked[r][c] = true;
      } else {
        is_cell_blocked[r][c] = false;
      }
    }
  }
}


function init() {
  width = 15;
  height = 15;
  init_cell_blocks();
  init_entries();

  var div = document.getElementsByName("table")[0];
  var table = document.createElement("table");
  cell_elements = new Array(height);
  for (var r = 0; r < height; r++) {
    var row = document.createElement("tr");
    cell_elements[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      cell = document.createElement("td");
      cell_elements[r][c] = document.createTextNode("");
      cell.appendChild(cell_elements[r][c]);
      row.appendChild(cell);
      if (is_cell_blocked[r][c]) {
        cell.bgColor = '#000';
      }
    }
    table.appendChild(row);
  }
  div.appendChild(table);
}

window.onload = init;
