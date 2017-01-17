#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <iostream>
#include "grid_getter.h"
#include "grid_processor.h"

int main(int argc, char **argv) {
    if (argc != 2) {
        std::cerr << "Usage: extractor image" << std::endl;
        return -1;
    }

    cv::Mat input;
    input = cv::imread(argv[1], CV_LOAD_IMAGE_GRAYSCALE);

    if (!input.data) {
        std::cerr << "Could not open or find the image" << std::endl;
        return -1;
    }

    int width = 0;
    bool* black = 0;
    GridGetter getter;
    getter.get_grid(input, width, black);

    GridProcessor processor(width, black);
    processor.print_info();

    return 0;
}
