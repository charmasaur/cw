CC = g++ -g -Wall
LDFLAGS = -lopencv_core -lopencv_highgui -lopencv_imgproc -lopencv_imgcodecs
RM = rm -f

test : test.cc
	$(CC) test.cc -o test $(LDFLAGS)

filter_test : filter_test.cc
	$(CC) filter_test.cc -o filter_test $(LDFLAGS)

semantics_test : semantics_test.cc
	$(CC) semantics_test.cc -o semantics_test

clean :
	$(RM) test output_*
