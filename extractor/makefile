CC = g++ -g -Wall
LDFLAGS = -lopencv_core -lopencv_highgui -lopencv_imgproc -lopencv_imgcodecs
RM = rm -f

extractor : extractor.cc grid_getter.o grid_processor.o
	$(CC) extractor.cc grid_getter.o grid_processor.o -o extractor $(LDFLAGS)

grid_getter.o : grid_getter.cc grid_getter.h
	$(CC) -c grid_getter.cc

grid_processor.o : grid_processor.cc grid_processor.h
	$(CC) -c grid_processor.cc
