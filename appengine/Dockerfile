# From https://testdriven.io/blog/dockerizing-flask-with-postgres-gunicorn-and-nginx/

FROM jjanzic/docker-python3-opencv:opencv-4.0.0

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update -y && apt-get install -y libmagickwand-dev ghostscript

RUN pip install --upgrade pip
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install -r requirements.txt

COPY . /usr/src/app/

# Allow conversion of PDFs
RUN sed -i 's/\(<policy domain="coder" rights="none" pattern="PDF" \/>\)/<!-- \1 -->/' /etc/ImageMagick-6/policy.xml

RUN useradd -m myuser
USER myuser

CMD gunicorn --bind 0.0.0.0:$PORT wsgi
