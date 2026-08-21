"""Amazonのデータ開示から books.json を作る。

購入した本の一覧は Digital.Content.Ownership、最後に開いた日時は
Digital.Content.Whispersync/whispersync.csv から拾う。

使い方:
    python3 scripts/import-ownership.py ~/Downloads/Kindle.zip

zip でもディレクトリでも受ける。購入して権利が生きている電子書籍だけを拾い、
サンプル・Kindle Unlimited・Prime Reading・辞書・アプリは落とす。
"""
import csv, json, os, re, sys, zipfile, tempfile, shutil

WANT_TYPE = 'KindleEBook'
WANT_ORIGIN = {'Purchase'}          # KindleUnlimited と Prime は読み終われば権利が消える
WANT_STATUS = 'Active'
DROP_ORIGIN = {'KindleDictionary'}  # 辞書は棚に並べても仕方がない

# 書名の末尾に付く言語表記と、Amazon 側の飾り
TRAILING = re.compile(r'\s*\((?:Japanese|English|German|French|Spanish) Edition\)\s*$')


def last_read(root):
    """ASIN → 最後に開いた日時。Whispersync は端末をまたいで記録が残る。"""
    path = os.path.join(root, 'Digital.Content.Whispersync', 'whispersync.csv')
    if not os.path.isfile(path):
        return {}
    seen = {}
    with open(path, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            asin = row.get('ASIN')
            if not asin or asin == 'Not Available':
                continue
            d = row.get('LastUpdatedDate') or row.get('Customer modified date on device') or ''
            if d and d != 'Not Available' and d > seen.get(asin, ''):
                seen[asin] = d
    return seen


def records(root):
    d = os.path.join(root, 'Digital.Content.Ownership')
    if not os.path.isdir(d):
        sys.exit(f'Digital.Content.Ownership が見つかりません: {root}')
    for name in os.listdir(d):
        if name.endswith('.json'):
            with open(os.path.join(d, name), encoding='utf-8') as f:
                yield json.load(f)


def pick(j):
    res = j.get('resource') or {}
    if res.get('resourceType') != WANT_TYPE:
        return None
    asin = res.get('ASIN')
    if not asin:
        return None
    for right in j.get('rights') or []:
        origin = (right.get('origin') or {}).get('originType')
        if origin in DROP_ORIGIN or origin not in WANT_ORIGIN:
            continue
        if right.get('rightStatus') != WANT_STATUS:
            continue
        return {
            'asin': asin,
            'title': TRAILING.sub('', res.get('Product Name') or asin).strip(),
            'author': '',                       # 開示データに著者が無い
            'acquired': right.get('acquiredDate') or '',
        }
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = os.path.expanduser(sys.argv[1])
    tmp = None
    try:
        if zipfile.is_zipfile(src):
            tmp = tempfile.mkdtemp()
            with zipfile.ZipFile(src) as z:
                z.extractall(tmp)
            root = tmp
        else:
            root = src

        opened = last_read(root)
        seen = {}
        total = 0
        for j in records(root):
            total += 1
            b = pick(j)
            if b and b['asin'] not in seen:
                b['lastRead'] = opened.get(b['asin'], '')
                seen[b['asin']] = b

        # 買った日と最後に開いた日の、新しいほうで並べる
        books = sorted(seen.values(),
                       key=lambda b: (max(b['acquired'], b['lastRead']), b['title']),
                       reverse=True)
        with open('books.json', 'w', encoding='utf-8') as f:
            json.dump(books, f, ensure_ascii=False, indent=1)
        with_read = sum(1 for b in books if b['lastRead'])
        print(f'{total} 件を読み、{len(books)} 冊を books.json に書き出しました'
              f'（うち {with_read} 冊に閲覧日あり）')
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)


main()
