var width;
var height;
var cell;
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

function onSubmit() {
  var num = document.forms["new"]["number"].value;
  var across = document.forms["new"]["direction"].value == 'Across';
  var text = document.forms["new"]["text"].value.toUpperCase();

  var entry = find_entry(num, across);
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
    r = entry.start_r + i * rdiff;
    c = entry.start_c + i * cdiff;
    if (cell_letter[r][c].nodeValue != "" && cell_letter[r][c].nodeValue != text[i]) {
      alert("Conflict: " + cell_letter[r][c].nodeValue + " vs " + text[i]);
    }
    cell_letter[entry.start_r + i * rdiff][entry.start_c + i * cdiff].nodeValue = text[i];
  }
  save_user_input();
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

function onCellClicked(r, c) {
  var num = document.getElementsByName("number")[0];
  var old_index = num.value;
  var index = cell_label[r][c].nodeValue;

  num.value = index;

  var set_across;

  if (find_entry(index, true) == null) {
    set_across = false;
  } else if (find_entry(index, false) == null) {
    set_across = true;
    document.getElementsByName("direction")[0].value = "Across";
  } else {
    // Default to across if the index has changed or if across was selected last time.
    set_across = old_index != index || document.getElementsByName("direction")[0].value != "Across";
  }

  if (set_across) {
    document.getElementsByName("direction")[0].value = "Across";
  } else {
    document.getElementsByName("direction")[0].value = "Down";
  }

  var txt = document.getElementsByName("text")[0];
  txt.value = "";
  txt.focus();
}

function init_labels() {
  var div = document.getElementsByName("clues")[0];
  for (var i = 0; i < entries.length; i++) {
    var r = entries[i].start_r;
    var c = entries[i].start_c;
    cell_label[r][c].nodeValue = entries[i].index;
    cell[r][c].onclick = onCellClicked.bind(null, r, c);
    //cell[r][c].addEventListener("click", onCellClicked.bind(null, r, c));

    //div.appendChild(document.createTextNode(
    //    entries[i].index + ": " + entries[i].is_across + " (" + entries[i].start_r + ","
    //    + entries[i].start_c + ") " + entries[i].len));
    //div.appendChild(document.createElement("br"));
  }
}

function init_image(url) {
    var img = document.getElementsByName("image_image")[0];
    img.src = url;
}

function init_cw(file) {
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

  var div = document.getElementsByName("table")[0];
  var table = document.createElement("table");
  cell = new Array(height);
  cell_letter = new Array(height);
  cell_label = new Array(height);
  for (var r = 0; r < height; r++) {
    var row = document.createElement("tr");
    cell[r] = new Array(width);
    cell_letter[r] = new Array(width);
    cell_label[r] = new Array(width);
    for (var c = 0; c < width; c++) {
      cell[r][c] = document.createElement("td");
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

      cell[r][c].appendChild(container);
      row.appendChild(cell[r][c]);
      if (is_cell_blocked[r][c]) {
        cell[r][c].bgColor = '#000';
      }
    }
    table.appendChild(row);
  }
  div.appendChild(table);

  init_labels();
}

function get_and_remove_item(name) {
  val = localStorage.getItem(name);
  localStorage.removeItem(name);
  return val;
}

function put_item(name, val) {
  localStorage.setItem(name, val);
}

function is_storage_available() {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return true;
  } catch(e) {
    return false;
  }
}

function save_user_input() {
  if (!is_storage_available()) {
    console.log("Storage not available");
    return;
  }

  // remove the old data
  get_and_remove_item("user_input");

  val = "";
  for (var r = 0; r < height; r++) {
    for (var c = 0; c < width; c++) {
      val += cell_letter[r][c].nodeValue + "|";
    }
  }

  console.log("Saving input");
  put_item("user_input", val);
}

function init_user_input(cache_key) {
  if (!is_storage_available()) {
    console.log("Storage not available");
    return;
  }

  // get and remove the old cache key and input
  old_cache_key = get_and_remove_item("cache_key");
  old_user_input = get_and_remove_item("user_input");

  // save the new cache key
  put_item("cache_key", cache_key);

  // no more to do if the keys are different
  if (old_cache_key != cache_key) {
    console.log("Different keys, not loading saved data");
    return;
  }

  if (!old_user_input) {
    console.log("Old input missing, not loading saved data");
    return;
  }

  vals = old_user_input.split("|");
  if (vals.length != width * height + 1) {
    console.log("Wrong number of saved values, not loading saved data");
    return;
  }

  console.log("Loading input");
  for (var r = 0; r < height; r++) {
    for (var c = 0; c < width; c++) {
      cell_letter[r][c].nodeValue = vals[r * width + c];
    }
  }

  // remember to save the input
  save_user_input();
}

function onClearSavedDataSubmit() {
  if (!is_storage_available()) {
    console.log("Storage not available");
    return;
  }
  console.log("Clearing saved data");
  localStorage.clear();
  return false;
}

window.onload = function() {
  init_image(image_data);
  init_cw(cw_data);
  init_user_input(cache_key);
}
