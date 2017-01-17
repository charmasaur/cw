#ifndef GRID_GETTER_H
#define GRID_GETTER_H

#include <opencv2/core/core.hpp>

class GridGetter {
  public:
    void get_grid(cv::Mat& input, int& width, bool*& black);
};

#endif
