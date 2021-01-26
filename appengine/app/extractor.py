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

def get_label(d):
    if d == 0:
        return "across"
    return "down"

def works(lines, r, c):
    return r >= 0 and r < len(lines) and c >= 0 and c < len(lines[0]) and lines[r][c] == " "

def is_start(lines, r, c, dr, dc):
    if not works(lines, r, c):
        return False
    nr = r + dr
    nc = c + dc
    if not works(lines, nr, nc):
        return False
    pr = r - dr
    pc = c - dc
    if works(lines, pr, pc):
        return False
    return True

def get_len(lines, r, c, dr, dc):
    len = 0
    while works(lines, r, c):
        len += 1
        r += dr
        c += dc
    return len

def get_clues(data):
    lines = data.split("\n")
    width = int(lines[0].split(" ")[0])
    height = int(lines[0].split(" ")[1])
    rlines = lines[1:height+1]

    clues = []
    found = 0
    for r in range(height):
        for c in range(width):
            did = False
            if is_start(rlines, r, c, 0, 1):
                clues.append((0, found + 1, r, c, get_len(rlines, r, c, 0, 1)))
                did = True
            if is_start(rlines, r, c, 1, 0):
                clues.append((1, found + 1, r, c, get_len(rlines, r, c, 1, 0)))
                did = True
            if did:
                found += 1
    ret = str(len(clues)) + "\n"
    for (d, n, r, c, l) in clues:
        ret += str(n) + " " + get_label(d) + ": (" + str(r) + ", " + str(c) + "), " + str(l) + "\n"
    return ret
