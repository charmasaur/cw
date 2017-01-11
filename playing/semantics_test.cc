#include <iostream>
#include <string>
#include <cmath>
#include <cassert>
#include <map>
#include <utility>

using namespace std;

#define MAX_W 100

int wid;
char grid[MAX_W][MAX_W];

inline bool can_move_to(int r, int c) {
  return r >= 0 && c >= 0 && r < wid && c < wid && grid[r][c] == ' ';
}

bool is_start(int r, int c, int dr, int dc) {
  if (!can_move_to(r, c)) {
    return false;
  }
  int nr = r + dr;
  int nc = c + dc;
  if (!can_move_to(nr, nc)) {
    return false;
  }
  int pr = r - dr;
  int pc = c - dc;
  if (can_move_to(pr, pc)) {
    return false;
  }
  return true;
}

int get_len(int r, int c, int dr, int dc) {
  int len = 0;
  while (can_move_to(r, c)) {
    len++;
    r += dr;
    c += dc;
  }
  return len;
}

int main(int argc, char **argv) {
  cin >> wid;
  if (wid >= MAX_W) {
    cerr << "Grid too large";
    return -1;
  }
  cin.ignore(1,'\n');
  cout << wid << " " << wid << endl;
  for (int i = 0; i < wid; ++i) {
    cin.getline(grid[i], wid + 1);
    assert(grid[i][wid-1] == '#' || grid[i][wid-1] == ' ');
    assert(grid[i][wid] == '\0');
    cout << grid[i] << endl;
  }
  bool did;
  int found = 0;
  // ((down?, number), (r,c)) -> len
  map<pair<pair<bool, int>, pair<int, int> >, int> clues;
  for (int r = 0; r < wid; r++) {
    for (int c = 0; c < wid; c++) {
      did = false;
      if (is_start(r, c, 0, 1)) {
        did=true;
        clues.insert(make_pair(make_pair(make_pair(false, found+1), make_pair(r, c)), get_len(r, c, 0, 1)));
      }
      if (is_start(r, c, 1, 0)) {
        did=true;
        clues.insert(make_pair(make_pair(make_pair(true, found+1), make_pair(r, c)), get_len(r, c, 1, 0)));
      }
      if (did) {
        found++;
      }
    }
  }
  cout << clues.size() << endl;
  for (auto i = clues.begin(); i != clues.end(); ++i) {
    cout << i->first.first.second << " " << (i->first.first.first ? "down" : "across") << ": (" << i->first.second.first << ", " << i->first.second.second << "), " << i->second << endl;
  }
  return 0;
}
