# put the contents of the src folder into a zip file
import os
from sqlite3 import Date
import zipfile

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file))

# filename format is 'SetiAstroScriptsMM.DD.YYYY.zip'
# where MM.DD.YYYY is the current date
today = Date.today()
date = today.strftime("%m.%d.%Y")
# releaseDate format is 'YYYYMMDD'
releaseDate = today.strftime("%Y%m%d")
filename = 'SetiAstroScripts' + date + '.zip'
zipf = zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) 
zipdir('src/', zipf)
zipf.close()

# move zip file to the dist folder, replacing the old one, if it exists
if os.path.exists(f"dist/{filename}"):
    os.remove(f"dist/{filename}")
os.rename(filename, f"dist/{filename}")

# get zipfile checksum SHA1
import hashlib
sha1 = hashlib.sha1()
with open('dist/SetiAstroScripts' + date + '.zip', 'rb') as f:
    while chunk := f.read(4096):
        sha1.update(chunk)
checksum = sha1.hexdigest()

# load updates_template.xml and replace fileName, sha1 checksum, releaseDate, timestamp
with open('updates_template.xml', 'r') as f:
    template = f.read()
    template = template.replace('{{fileName}}', filename)
    template = template.replace('{{sha1}}', checksum)
    template = template.replace('{{releaseDate}}', releaseDate)
    # get current timestamp format: 2024-05-11T18:40:41.205Z
    import time
    timestamp = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    template = template.replace('{{timestamp}}', timestamp)

    # write to updates.xri replacing the old one
    if os.path.exists('dist/updates.xri'):
        os.remove('dist/updates.xri')
    with open('dist/updates.xri', 'w') as f:
        f.write(template)
