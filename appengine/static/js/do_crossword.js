var width;
var height;
var cell;
var cell_letter;
var cell_label;
var is_cell_blocked;
var entries;
var sync_state;

function Entry(index, is_across, start_r, start_c, len) {
  this.index = index;
  this.is_across = is_across;
  this.start_r = start_r;
  this.start_c = start_c;
  this.len = len;
}

function find_entry(index, is_across) {
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].index == index && entries[i].is_across == is_across) {
      return entries[i];
    }
  }
  return null;
}

// returns whether (r, c) is part of a filled-in clue in the direction specified by (rd,cd)
function is_part_of_clue(r, c, rd, cd) {
  return (rd == 1 && r - rd >= 0 && cell_letter[r-rd][c].nodeValue != "")
      || (rd == 1 && r + rd < height && cell_letter[r+rd][c].nodeValue != "")
      || (cd == 1 && c - cd >= 0 && cell_letter[r][c-cd].nodeValue != "")
      || (cd == 1 && c + cd < width && cell_letter[r][c+cd].nodeValue != "");
}

function onSubmit() {
  var num = document.forms["new"]["number"].value;
  var across = document.forms["new"]["direction"].value == 'Across';
  var text = document.forms["new"]["text"].value.toUpperCase().trim();

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
    if (cell_letter[r][c].nodeValue != "" && cell_letter[r][c].nodeValue != text[i]
        && is_part_of_clue(r, c, cdiff, rdiff)) {
      alert("Conflict: " + cell_letter[r][c].nodeValue + " vs " + text[i]);
    }
    cell_letter[entry.start_r + i * rdiff][entry.start_c + i * cdiff].nodeValue = text[i];
  }

  document.getElementsByName("text")[0].value = "";

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
  var is_swap = false;

  if (find_entry(index, true) == null) {
    set_across = false;
  } else if (find_entry(index, false) == null) {
    set_across = true;
  } else if (old_index != index) {
    // Default to across, unless across is filled in and down isn't.
    set_across = !is_part_of_clue(r, c, 0, 1) || is_part_of_clue(r, c, 1, 0);
  } else {
    // We're on the same index and both are valid, so just swap.
    set_across = document.getElementsByName("direction")[0].value != "Across";
    is_swap = true;
  }

  document.getElementsByName("direction")[0].selectedIndex = set_across ? 0 : 1;

  var txt = document.getElementsByName("text")[0];
  // Only clear the text if this wasn't a swap (if it was a swap then the user might have
  // accidentally tried to enter the other way).
  if (!is_swap) {
    txt.value = "";
  }
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

// ------------------- storage/sync related stuff --------------------

function get_item(name) {
  return localStorage.getItem(name);
}

function remove_item(name) {
  localStorage.removeItem(name);
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
  set_local_saved_state = function(val) {
    if (!is_storage_available()) {
      console.log("Storage not available");
      return;
    }

    // remove the old data
    remove_item("cache_key");
    remove_item("cw_id");
    remove_item("user_input");

    console.log("Saving input");
    put_item("cw_id", cw_id);
    put_item("user_input", val);
  };

  set_remote_saved_state = function(val) {
    setSyncState("Getting login status...");
    get_user_id_token(function(idToken) {
      if (!idToken) {
        setSyncState("Saved locally (not logged in)");
        return;
      }

      setSyncState("Saving...");
      var xhttp = new XMLHttpRequest();
      // Set data.
      xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
          return;
        }
        if (this.status != 200) {
          setSyncState("Saved locally (failed to save remotely)");
          return;
        }
        setSyncState("Saved");
      };
      xhttp.open("POST", "/set_cw_data?cw_id=" + cw_id, true);
      xhttp.setRequestHeader('Authorization', 'Bearer ' + idToken);
      xhttp.send(val);
    });
  };

  var state = {
    "width": width,
    "height": height,
    "entries": [],
  }
  for (var r = 0; r < height; r++) {
    for (var c = 0; c < width; c++) {
      var entry = {}
      if (cell_letter[r][c].nodeValue) {
        entry["value"] = cell_letter[r][c].nodeValue;
      }
      state["entries"].push(entry);
    }
  }

  state_string = JSON.stringify(state);
  set_remote_saved_state(state_string);
  set_local_saved_state(state_string);
}

function get_user_id_token(callback) {
  // Get auth state.
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      console.log("User not logged in");
      callback(null);
      return;
    }
    console.log("User logged in, getting ID token");
    // Get ID token.
    user.getIdToken().then(function(idToken) {
      console.log("Got ID token");
      callback(idToken);
    });
    // TODO: What if that never returns?
  });
}

function init_user_input() {
  // We start by checking whether the user is signed in and fetching any associated data. Then we
  // compare what's in the local storage with what we received, and use whichever is most recent.
  //
  // TODO: It'd be nice to improve that. The server should know the UID when preparing this page,
  // so we should be able to get an initial set of data straight away. Or maybe that isn't
  // possible...
  // TODO: We don't do that yet, we just use local and then override it with remote if remote
  // works.
  get_local_saved_state = function() {
    if (!is_storage_available()) {
      console.log("Storage not available");
      return null;
    }

    var old_cw_id = get_item("cw_id");

    // no more to do if the keys are different. don't clear anything yet though, in case the user
    // didn't actually want this crossword and is just here temporarily

    if (!old_cw_id) {
      // This was saved before migrating from cache keys to CW IDs. Check the cache keys.
      if (get_item("cache_key") != cache_key) {
        console.log("Different keys, not loading saved data");
        return null;
      }
      // Otherwise the cache keys match, so we're good.
    } else if (old_cw_id != cw_id) {
      console.log("Different IDs, not loading saved data");
      return null;
    }

    var old_user_input = get_item("user_input");

    if (!old_user_input) {
      console.log("Old input missing, not loading saved data");
      return null;
    }

    return old_user_input;
  };

  get_remote_saved_state = function(callback) {
    setSyncState("Getting login status");
    get_user_id_token(function(idToken) {
      if (!idToken) {
        setSyncState("Not logged in");
        callback(null);
        return;
      }

      setSyncState("Loading data");
      var xhttp = new XMLHttpRequest();
      // Get data.
      xhttp.onreadystatechange = function() {
        if (this.readyState != 4) {
          return;
        }
        if (this.status != 200) {
          callback(null);
          return;
        }
        callback(xhttp.responseText);
      };
      // TODO: Is there a legit way to set query params?
      xhttp.open("GET", "/get_cw_data?cw_id=" + cw_id, true);
      xhttp.setRequestHeader('Authorization', 'Bearer ' + idToken);
      xhttp.send();
    });
  }

  parse_data = function(data) {
    if (data == null) {
      console.log("No data");
      return null;
    }

    // Need to pull out a list of width*height vals. There's some compatibility to deal with.
    if (data.split("|").length == width * height + 1) {
      // Original.
      return data.split("|").slice(0, -1);
    }

    // JSON?
    var jdata;
    try {
      jdata = JSON.parse(data);
    } catch (e) {
      console.log("Failed to parse JSON")
      return null;
    }
    if ("width" in jdata
        && "height" in jdata
        && "entries" in jdata
        && jdata["width"] == width
        && jdata["height"] == height
        && jdata["entries"].length == width * height) {
      var vals = []
      for (var i = 0; i < width * height; i++) {
        entry = jdata["entries"][i];
        if ("value" in entry) {
          vals.push(entry["value"]);
        } else {
          vals.push("");
        }
      }
      return vals;
    }
    return null;
  };

  apply_saved_state = function(data) {
    setSyncState("Loaded");
    var vals = parse_data(data);
    if (!vals) {
      console.log("Could not parse data");
      return;
    }

    // TODO: If we loaded data remotely, should we persist it to local storage here? Similarly, if we
    // couldn't load any from the server but we did from local then should we sync here? Think the
    // simplest answer to both those questions is "yes".
    for (var r = 0; r < height; r++) {
      for (var c = 0; c < width; c++) {
        cell_letter[r][c].nodeValue = vals[r * width + c];
      }
    }
  };

  apply_saved_state(get_local_saved_state());
  get_remote_saved_state(function(vals) {
    console.log(vals);
    if (vals) {
      apply_saved_state(vals);
    }
  });
}

function setSyncState(message) {
  sync_state = message;
  document.getElementsByName("sync_status")[0].innerHTML = sync_state;
}

function onClearSavedDataSubmit() {
  if (!confirm("Are you sure you want to clear your saved data?")) {
    return false;
  }
  for (var r = 0; r < height; r++) {
    for (var c = 0; c < width; c++) {
      cell_letter[r][c].nodeValue = "";
    }
  }
  save_user_input();
  return false;
}

window.onload = function() {
  init_image(image_data);
  init_cw(cw_data);
  init_user_input();
}
