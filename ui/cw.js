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
  }

  if (text.length != entry.len) {
    alert("Wrong length");
  }

  if (across) {
    rdiff = 0;
    cdiff = 1;
  } else {
    rdiff = 1;
    cdiff = 0;
  }

  for (var i = 0; i < text.length; i++) {
    // TODO: Shouldn't just append child. If there's already one there we need to reuse that.
    cell_elements[entry.start_r + i * rdiff][entry.start_c + i * cdiff]
      .appendChild(document.createTextNode(text[i]));
  }
  return false;
}

function init_entries() {
  entries = new Array(2);
  entries[0] = new Entry(4, false, 0, 1, 5);
  entries[1] = new Entry(2, true, 1, 0, 6);
  // TODO: Verify entries
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
      cell_elements[r][c] = document.createElement("td");
      //var text = document.createTextNode("a");
      //cell.appendChild(text);
      //cell.bgColor = '#000';
      row.appendChild(cell_elements[r][c]);
      if (is_cell_blocked[r][c]) {
        cell_elements[r][c].bgColor = '#000';
      }
    }
    table.appendChild(row);
  }
  div.appendChild(table);
}

window.onload = init;
