#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <string>
#include <cmath>
#include "grid_getter.h"

using namespace cv;
using namespace std;

namespace {

// helper to convert an angle (in radians) to [-pi, pi)
double principal_angle(double angle) {
  double tmp = fmod(angle, 2 * CV_PI); // (-2pi, 2pi)
  if (tmp < 0) {
    tmp += 2 * CV_PI;
  } // [0, 2pi)
  return fmod(tmp + CV_PI, 2 * CV_PI) - CV_PI; // [-pi, pi)
}

// gets the rotation angle using hough transform (works best with a single big rectangle, like a mask)
double get_angle_hough(Mat& input) {
    Mat edge;
    Canny(input, edge, 50, 200, 3);
    vector<Vec2f> lines;
    int thresh = 0;
    do {
      thresh += 10;
      HoughLines(edge, lines, 5, CV_PI/180, thresh, 0, 0);
    } while (lines.size() > 10);
    double angles = 0.;
    int angle_count = 0;
    for (Vec2f line : lines) {
        double pang = principal_angle(line[1]); // (-pi, pi)
        if (pang < -CV_PI / 2) {
          pang += CV_PI;
        }
        if (pang > CV_PI / 2) {
          pang -= CV_PI;
        }
        // (-pi/2, pi/2)
        if (pang < CV_PI / 4 && pang > -CV_PI/4) {
          angles += pang;
          angle_count++;
        }
    }
    double rot_angle_rad = angles / double(angle_count);
    double rot_angle_deg = rot_angle_rad * 180. / CV_PI;
    cerr << "Rotation angle (degrees): " << rot_angle_deg << endl;
    return rot_angle_deg;
}

// helper to rotate by an angle (in degrees)
void rotate(Mat& input, Mat& output, double angle) {
    int midr = input.rows / 2;
    int midc = input.cols / 2;
    // Actually rotate the input
    Mat rot = getRotationMatrix2D(Point(midc, midr), angle, 1.f);
    warpAffine(input, output, rot, input.size());
}

// crossword mask
void get_cw_mask(Mat& input, Mat& outputMask) {
    Mat filled = input.clone();
    threshold(filled, filled, 128., 255., THRESH_BINARY);
    // Fill from all corners
    int in = 1;
    Scalar col = Scalar(0,0,0);
    Mat mask = Mat::zeros(filled.rows + 2, filled.cols + 2, CV_8UC1);
    floodFill(filled, mask, Point(in,in), col);
    floodFill(filled, mask, Point(filled.cols - in,in), col);
    floodFill(filled, mask, Point(filled.cols - in,filled.rows - in), col);
    floodFill(filled, mask, Point(in,filled.rows - in), col);
    // Find average white pixel
    long tr = 0;
    long tc = 0;
    vector<Point> locs;
    findNonZero(filled, locs);
    for (Point p : locs) { // C++11, nice!
      tc += p.x;
      tr += p.y;
    }
    Mat oldmask = mask.clone();
    Scalar bc = Scalar(255, 255, 255);
    floodFill(filled, mask, Point(double(tc) / double(locs.size()), double(tr) / double(locs.size())), Scalar(255, 0, 0), NULL, bc, bc);
    mask -= oldmask;
    outputMask = mask(Rect(1, 1, input.cols, input.rows));
    //floodFill(input, mask, Point(in, in), Scalar(0, 0, 255), NULL, bc, bc);
    ////circle(input, Point(double(tc) / double(locs.size()), double(tr) / double(locs.size())), 4, Scalar(0, 0, 255));

    outputMask.convertTo(outputMask, CV_8UC1, 255.);
    //output = input;
}

// orthogonal truncated crossword
void get_cw_orth_trunc(Mat& input, Mat& output) {
    Mat mask;
    get_cw_mask(input, mask);

    double angle = get_angle_hough(mask);
    rotate(mask, mask, angle);
    rotate(input, input, angle);
    vector<Point> whites;
    findNonZero(mask, whites);
    output = input(boundingRect(whites));
}

// get grid count (assumes square)
int get_grid_count(Mat& input) {
    Mat tmp;
    Canny(input, tmp, 50, 200, 3);

    // get line spacings
    int mx = max(input.rows, input.cols);
    vector<float> vals(mx, 0);

    vector<Vec2f> lines;
    int thresh = 0;
    do {
      thresh += 10;
      HoughLines(tmp, lines, 5, CV_PI/180, thresh, 0, 0);
    } while (lines.size() > 100);
    for (Vec2f line : lines) {
        int rho = abs(line[0]);
        // only take things that are within the image and vaguely orthogonal
        if (rho < mx && (abs(cos(line[1])) < 0.1 || abs(sin(line[1])) < 0.1)) {
          ++vals[rho];
        }
    }

    Mat planes[] = {Mat_<float>(vals), Mat::zeros(vals.size(), 1, CV_32F)};
    Mat complexI;
    merge(planes, 2, complexI);
    dft(complexI, complexI);
    split(complexI, planes);
    magnitude(planes[0], planes[1], planes[0]);
    Mat magI = planes[0];
    // get the 90th percentile
    vector<float> dems;
    for (int i = 0; i < magI.rows; ++i) {
      dems.push_back(magI.at<float>(i, 0));
    }
    sort(dems.begin(), dems.end());
    float accept_thresh = dems[dems.size() * 9 / 10];
    // take the first peak after fst that's over the 90th percentile
    int fst = 9;
    float last = magI.at<float>(fst, 0);
    for (int i = fst + 1; i < magI.rows; ++i) {
      float ti = magI.at<float>(i, 0);
      if (ti < last && last > accept_thresh) {
        return i - 1;
      }
      last = ti;
    }
    cerr << "Oh no didn't find a grid count";
    return 1;
}

bool is_black_square(Mat& input, int grid_count, int row, int col) {
    double sp = double(input.rows) / double(grid_count);
    // get actual row/col pixel
    int r = int(double(row) * sp + sp / 2);
    int c = int(double(col) * sp + sp / 2);

    Mat tmp;
    threshold(input, tmp, 128., 255., THRESH_BINARY);

    unsigned int dim = int(sp/4);
    Mat masked = tmp(Rect(c - dim, r - dim, 2 * dim, 2 * dim));
    vector<Point> whites;
    if (countNonZero(masked) > 0) {
        findNonZero(masked, whites);
    }
    return whites.size() < 4 * dim;
}

} // namespace

void GridGetter::get_grid(Mat& input, int& width, bool*& black) {
    Mat cw;
    get_cw_orth_trunc(input, cw);

    width = get_grid_count(cw);

    black = (bool*) malloc(sizeof(bool) * width * width);
    for (int r = 0; r < width; ++r) {
      for (int c = 0; c < width; ++c) {
        black[r * width + c] = is_black_square(cw, width, r, c);
      }
    }
}
