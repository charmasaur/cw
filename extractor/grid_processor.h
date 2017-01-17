#ifndef GRID_PROCESSOR_H
#define GRID_PROCESSOR_H

class GridProcessor {
  private:
    const int width;
    const bool* black;

    inline bool get(int r, int c);
    inline bool can_move_to(int r, int c);
    bool is_start(int r, int c, int dr, int dc);
    int get_len(int r, int c, int dr, int dc);
  public:
    GridProcessor(int width, bool* black) : width(width), black(black) {}

    void print_info();
};

#endif
