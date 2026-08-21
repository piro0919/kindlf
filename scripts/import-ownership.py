"""Amazonのデータ開示に含まれる Digital.Content.Ownership から books.json を作る。

使い方:
    python3 scripts/import-ownership.py ~/Downloads/Kindle.zip

zip でもディレクトリでも受ける。購入して権利が生きている電子書籍だけを拾い、
サンプル・Kindle Unlimited・Prime Reading・辞書・アプリは落とす。
"""
import json, os, re, sys, zipfile, tempfile, shutil

WANT_TYPE = 'KindleEBook'
WANT_ORIGIN = {'Purchase'}          # KindleUnlimited と Prime は読み終われば権利が消える
WANT_STATUS = 'Active'
DROP_ORIGIN = {'KindleDictionary'}  # 辞書は棚に並べても仕方がない

# 書名の末尾に付く言語表記と、Amazon 側の飾り
TRAILING = re.compile(r'\s*\((?:Japanese|English|German|French|Spanish) Edition\)\s*$')


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

        seen = {}
        total = 0
        for j in records(root):
            total += 1
            b = pick(j)
            if b and b['asin'] not in seen:
                seen[b['asin']] = b

        # 買った順に新しいものが先。同着はタイトル順
        books = sorted(seen.values(), key=lambda b: (b['acquired'], b['title']), reverse=True)
        with open('books.json', 'w', encoding='utf-8') as f:
            json.dump(books, f, ensure_ascii=False, indent=1)
        print(f'{total} 件を読み、{len(books)} 冊を books.json に書き出しました')
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)


main()
