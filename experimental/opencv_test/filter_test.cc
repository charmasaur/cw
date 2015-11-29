#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>

using namespace cv;
using namespace std;

void filter(Mat& input, Mat& output) {
  Mat kernel = (Mat_<double>(3,3) << 0, 0.2, 0,
                                   0.2, 0.2, 0.2,
                                   0, 0.2, 0);

  filter2D(input, output, input.depth(), kernel);
}
  

int main(int argc, char **argv) {
	if (argc != 2) {
		cout << "Usage: filter_test image" << endl;
		return -1;
	}

	Mat input;
	input = imread(argv[1], CV_LOAD_IMAGE_GRAYSCALE);

	if (!input.data) {
		cout << "Could not open or find the image" << endl;
		return -1;
	}

  Mat output;
  filter(input, output);
	namedWindow("Display window", WINDOW_AUTOSIZE);
	imshow("Display window", output);

	waitKey(0);
	return 0;
}
