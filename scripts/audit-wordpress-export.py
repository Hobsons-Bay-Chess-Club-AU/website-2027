"""Summarize a local WXR export without logging private content or credentials."""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import re
import io
import xml.etree.ElementTree as ET

source = Path('reference/admin-export/hbcc-wordpress-2026-10-10.xml')
ns = {'wp': 'http://wordpress.org/export/1.2/'}
types, statuses = Counter(), Counter()
records = 0
original = source.read_bytes()
text = original.decode('utf-8', errors='surrogateescape')
legacy_bytes = Counter()
def repair_legacy_byte(match):
    value = ord(match.group(0)) - 0xdc00
    legacy_bytes[f'0x{value:02x}'] += 1
    return bytes([value]).decode('cp1252', errors='replace')
text = re.sub(r'[\udc80-\udcff]', repair_legacy_byte, text)
illegal_xml_chars = r'[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff\ufffe\uffff]'
removed = len(re.findall(illegal_xml_chars, text))
audited_source = source
if removed or legacy_bytes:
    text = re.sub(illegal_xml_chars, '', text)
    audited_source = source.with_name(source.stem + '.sanitized.xml')
    audited_source.write_text(text, encoding='utf-8')
for _, elem in ET.iterparse(io.StringIO(text), events=('end',)):
    if elem.tag == 'item':
        record_type = elem.findtext('wp:post_type', default='unknown', namespaces=ns)
        status = elem.findtext('wp:status', default='unknown', namespaces=ns)
        types[record_type] += 1
        statuses[f'{record_type}:{status}'] += 1
        records += 1
        elem.clear()
report = {
    'auditedAt': datetime.now(timezone.utc).isoformat(),
    'file': str(source),
    'bytes': source.stat().st_size,
    'auditedFile': str(audited_source),
    'removedIllegalXmlCharacters': removed,
    'legacyEncodedBytesConvertedForAudit': dict(legacy_bytes),
    'originalPreserved': True,
    'sha256': hashlib.file_digest(source.open('rb'), 'sha256').hexdigest(),
    'records': records,
    'recordTypes': dict(types),
    'statuses': dict(statuses),
    'scope': 'All content WXR export, including post metadata. Not a full database/filesystem backup.',
    'privateReference': True,
}
Path('reference/admin-export/manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
