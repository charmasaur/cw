#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <string>

using namespace cv;
using namespace std;

void filter(Mat& input, Mat& output) {
    Mat& padded = input;
    int m = getOptimalDFTSize(input.rows);
    int n = getOptimalDFTSize(input.cols);
    copyMakeBorder(input, padded, 0, m - input.rows, 0, n - input.cols, BORDER_CONSTANT, Scalar::all(0));
    Mat planes[] = {Mat_<float>(padded), Mat::zeros(padded.size(), CV_32F)};
    Mat complexI;
    merge(planes, 2, complexI);
    dft(complexI, complexI);
    split(complexI, planes);
    magnitude(planes[0], planes[1], planes[0]);
    Mat magI = planes[0];
    magI += Scalar::all(1);
    log(magI, magI);
    magI = magI(Rect(0, 0, magI.cols & -2, magI.rows & -2));
    int cx = magI.cols/2;
    int cy = magI.rows/2;
    Mat q0(magI, Rect(0, 0, cx, cy));
    Mat q1(magI, Rect(cx, 0, cx, cy));
    Mat q2(magI, Rect(0, cy, cx, cy));
    Mat q3(magI, Rect(cx, cy, cx, cy));

    Mat tmp;
    q0.copyTo(tmp);
    q3.copyTo(q0);
    tmp.copyTo(q3);

    q1.copyTo(tmp);
    q2.copyTo(q1);
    tmp.copyTo(q2);

    normalize(magI, output, 0, 1, CV_MINMAX);
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
    Mat img8bit;
    output.convertTo(img8bit, CV_8UC3, 255.);
    imwrite(string("output_") + string(argv[1]), img8bit);

    waitKey(0);
    return 0;
}
