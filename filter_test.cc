#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <string>
#include <cmath>

using namespace cv;
using namespace std;

void rotate(Mat& input, Mat& output) {
    // FFT
    Mat padded = input;
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

    normalize(magI, magI, 0, 1, CV_MINMAX);

    // Convert to 8-bit for remaining things
    magI.convertTo(magI, CV_8UC1, 255.);

    // Threshold
    Mat thresholded;
    threshold(magI, thresholded, 128., 255., THRESH_BINARY);

    // Get rotation
    int midr = thresholded.rows / 2;
    int midc = thresholded.cols / 2;
    int nbuckets = 100;
    int buckets[nbuckets];
    double total_angle_in_buckets[nbuckets];
    int best_bucket = 0;
    for (int i = 0; i < nbuckets; ++i) {
            buckets[i] = 0;
            total_angle_in_buckets[i] = 0.;
    }
    for (int r = 0; r < thresholded.rows; r++) {
        for (int c = 0; c < thresholded.cols; c++) {
            if ((int) thresholded.at<uchar>(r, c) < 128) {
                continue;
            }
            double angle = atan2(midr - r, midc - c);
            // We only care about the angles between -pi/4 and pi/4 (assume image is almost
            // upright).
            int angle_bucket = int(((angle * 2. / 3.14) + 0.5) * double(nbuckets));
            if (angle_bucket < 0 || angle_bucket >= nbuckets) {
                    continue;
            }
            total_angle_in_buckets[angle_bucket] += angle;
            if (++buckets[angle_bucket] > buckets[best_bucket]) {
                    best_bucket = angle_bucket;
            }
        }
    }
    // This seems OK, but the problem is that the bucket positioning could have a big effect. I
    // think something like PCA would be more sensible. Evan also thought Hough might actually work
    // if done properly.
    double rot_angle_rad = total_angle_in_buckets[best_bucket] / double(buckets[best_bucket]);
    double rot_angle_deg = rot_angle_rad * 180. / 3.14;
    cout << "Rotation angle (degrees): " << rot_angle_deg << endl;

    // Actually rotate the input
    Mat rot = getRotationMatrix2D(Point(midc, midr), rot_angle_deg, 1.f);
    warpAffine(input, output, rot, input.size());

    // Don't think Hough is quite right, since they're not real lines. Maybe PCA? Or we could just
    // do a histogram of all angles...
    //vector<Vec2f> lines;
    //HoughLines(temp_output, lines, 10, CV_PI/180, 10000, 0, 0);
    //for (size_t i = 0; i < lines.size(); ++i) {
    //    float rho = lines[i][0];
    //    float theta = lines[i][1];
    //    Point pt1, pt2;
    //    double a = cos(theta), b = sin(theta);
    //    double x0 = a*rho, y0 = b*rho;
    //    pt1.x = cvRound(x0 + 1000*(-b));
    //    pt1.y = cvRound(y0 + 1000*a);
    //    pt2.x = cvRound(x0 - 1000*(-b));
    //    pt2.y = cvRound(y0 - 1000*a);
    //    line(output, pt1, pt2, Scalar(0, 0, 255), 1, CV_AA);

    //}
    //Mat kernel = (Mat_<double>(4,4) << 0, 0.1, 0.1, 0,
    //                                   0.1, 0.05, 0.05, 0.1,
    //                                   0.1, 0.05, 0.05, 0.1,
    //                                   0, 0.1, 0.1, 0);
    //filter2D(temp_output, output, temp_output.depth(), kernel);
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

    Mat rotated;
    rotate(input, rotated);
    namedWindow("Display window", WINDOW_AUTOSIZE);
    imshow("Display window", rotated);
    imwrite(string("rotated_") + string(argv[1]), rotated);
    waitKey(0);

    return 0;
}
