from google.appengine.api import urlfetch

def extract(image_bdata):
    """
    Given a base64-encoded image, extracts and returns the crossword grid.
    """
    urlfetch.set_default_fetch_deadline(20)
    return urlfetch.fetch(
            url="http://extractor.cw-mungo.appspot.com/extract",
            payload=image_bdata,
            method=urlfetch.POST).content

