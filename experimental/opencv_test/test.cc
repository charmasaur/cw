#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <iostream>

using namespace cv;
using namespace std;

int main(int argc, char **argv) {
	if (argc != 2) {
		cout << "Usage: test image" << endl;
		return -1;
	}

	Mat image;
	image = imread(argv[1], CV_LOAD_IMAGE_GRAYSCALE);

	if (!image.data) {
		cout << "Could not open or find the image" << endl;
		return -1;
	}

	//namedWindow("Display window", WINDOW_AUTOSIZE);
	//imshow("Display window", image);

	cout << "Rows: " << image.rows << ", columns: " << image.cols
		<< ", channels: " << image.channels() << ", depth: " << image.depth()
		<< endl;

	waitKey(0);
	return 0;
}
